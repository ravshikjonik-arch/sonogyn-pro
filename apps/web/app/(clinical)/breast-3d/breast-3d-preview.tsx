"use client";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo, useState } from "react";
import { Vector3 } from "three";

import { BIRADS_COLORS, BreastModel, type BreastLesionAnnotation } from "@repo/clinical-3d";

export function Breast3dPreview() {
  const [side, setSide] = useState<"left" | "right">("right");
  const lesions = useMemo<BreastLesionAnnotation[]>(
    () => [
      {
        id: "preview",
        type: "breast_lesion",
        label: "Демо",
        position: new Vector3(0.35, 0.15, 0.55),
        size: new Vector3(12, 10, 8),
        color: BIRADS_COLORS[3],
        opacity: 0.85,
        metadata: {
          biradsCategory: 3,
          quadrant: "upper_outer",
          distanceFromNippleMm: 45,
          depthFromSkinMm: 8,
          shape: "oval",
          orientation: "parallel",
          margin: "circumscribed",
          echoPattern: "hypoechoic",
          posteriorFeatures: "none",
          calcifications: false,
          vascularization: "none",
        },
      },
    ],
    [],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-3">
      <p className="text-xs font-semibold text-slate-500">Учебный 3D-просмотр (не для протокола локализации)</p>
      <div className="h-[360px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-950">
        <Canvas dpr={[1, 1.5]}>
          <Suspense fallback={null}>
            <color attach="background" args={["#0f172a"]} />
            <PerspectiveCamera makeDefault position={[0, 0.5, 2.8]} fov={42} />
            <ambientLight intensity={0.55} />
            <directionalLight intensity={1.1} position={[2, 3, 2]} />
            <BreastModel side={side} breastVolumeMl={380} lesions={lesions} />
            <OrbitControls enablePan={false} minDistance={1.6} maxDistance={4.5} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
