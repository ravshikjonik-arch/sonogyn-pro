"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { ProceduralUterus, computeFibroidClinicalMetrics, type UterusHitResult } from "@clinical/uterus";
import { Suspense, useCallback, useMemo, useState } from "react";
import { Vector3 } from "three";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FigoResultCard } from "@/components/uterus/FigoResultCard";

type PlacedFibroid = {
  id: string;
  position: [number, number, number];
  hit: UterusHitResult;
};

export function Uterus3DInteractive() {
  const [pedunculated, setPedunculated] = useState(false);
  const [placeMode, setPlaceMode] = useState(false);
  const [fibroids, setFibroids] = useState<PlacedFibroid[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = fibroids.find((f) => f.id === selectedId) ?? fibroids[fibroids.length - 1] ?? null;

  const metrics = useMemo(() => {
    if (!selected) return null;
    return computeFibroidClinicalMetrics(new Vector3(...selected.position), pedunculated);
  }, [selected, pedunculated]);

  const onPick = useCallback(
    (hit: UterusHitResult, local: Vector3) => {
      if (!placeMode) {
        setSelectedId(null);
        return;
      }
      const id = `fb-${Date.now()}`;
      setFibroids((prev) => [...prev, { id, position: [local.x, local.y, local.z], hit }]);
      setSelectedId(id);
      setPlaceMode(false);
      toast.success(`FIGO ${hit.figoType}`, { description: hit.tooltipRu });
    },
    [placeMode],
  );

  const pathologyAnnotations = useMemo(
    () =>
      fibroids.map((f) => ({
        id: f.id,
        type: "myoma" as const,
        position: f.position,
        sizeMm: { length: 28, width: 24, depth: 22 },
        pedunculated,
        figoType: f.hit.figoType,
        figoOverride: null,
        localizationRu: computeFibroidClinicalMetrics(new Vector3(...f.position), pedunculated).localizationRu,
      })),
    [fibroids, pedunculated],
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b">
        <CardTitle className="text-lg">3D модель матки · FIGO</CardTitle>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          Кликните «Поставить миому», затем коснитесь стенки модели — программа определит FIGO и сформирует описание.
        </p>
      </CardHeader>
      <div className="grid gap-0 xl:grid-cols-[minmax(280px,320px)_1fr]">
        <CardContent className="space-y-4 border-b p-5 xl:border-b-0 xl:border-r">
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant={placeMode ? "default" : "secondary"} onClick={() => setPlaceMode(true)}>
              Поставить миому
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setFibroids([]);
                setSelectedId(null);
              }}
            >
              Сброс
            </Button>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={pedunculated} onChange={(e) => setPedunculated(e.target.checked)} />
            На ножке (FIGO 0 / 7)
          </label>
          <Badge variant="outline">{fibroids.length} узел(ов)</Badge>
          {selected && metrics ? (
            <FigoResultCard
              figoType={selected.hit.figoType}
              localizationRu={metrics.localizationRu}
              mode="clinical"
            />
          ) : (
            <p className="text-sm text-slate-500">Отметьте узел на 3D-модели.</p>
          )}
        </CardContent>
        <div className="h-[min(520px,60vh)] min-h-[360px] bg-[#0b1220]">
          <Canvas camera={{ position: [2.8, 1.2, 3.2], fov: 42 }} dpr={[1, 1.5]}>
            <color attach="background" args={["#0b1220"]} />
            <ambientLight intensity={0.55} />
            <directionalLight position={[4, 6, 3]} intensity={1.1} />
            <Suspense fallback={null}>
              <ProceduralUterus
                theme="dark"
                eduMode="figo"
                pedunculated={pedunculated}
                showDiffuseAdeno={false}
                showFocalAdeno={false}
                showCysticAdeno={false}
                onPick={onPick}
                pathologyAnnotations={pathologyAnnotations}
                pathologySelectedId={selectedId}
                onPathologySelect={setSelectedId}
              />
            </Suspense>
            <OrbitControls makeDefault enablePan enableZoom />
          </Canvas>
        </div>
      </div>
    </Card>
  );
}
