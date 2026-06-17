"use client";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";

import { ProceduralUterus, type PathologyAnnotation } from "@clinical/uterus";

type Props = {
  annotations: PathologyAnnotation[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onPositionCommit: (id: string, local: THREE.Vector3) => void;
  pedunculated: boolean;
};

export function FigoMyoma3DPreview({
  annotations,
  selectedId,
  onSelect,
  onPositionCommit,
  pedunculated,
}: Props) {
  return (
    <div className="h-[420px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-inner">
      <Canvas dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <color attach="background" args={["#0f172a"]} />
          <PerspectiveCamera makeDefault position={[0, 0.2, 3.6]} fov={38} />
          <ambientLight intensity={0.72} />
          <directionalLight intensity={1.35} position={[2.6, 3.2, 2.4]} />
          <ProceduralUterus
            theme="dark"
            eduMode="figo"
            pedunculated={pedunculated}
            showDiffuseAdeno={false}
            showFocalAdeno={false}
            showCysticAdeno={false}
            modelScale={1}
            pathologyAnnotations={annotations}
            pathologySelectedId={selectedId}
            onPathologySelect={onSelect}
            onPathologyPositionCommit={onPositionCommit}
          />
          <OrbitControls enablePan={false} minDistance={2.2} maxDistance={5.2} />
        </Suspense>
      </Canvas>
    </div>
  );
}
