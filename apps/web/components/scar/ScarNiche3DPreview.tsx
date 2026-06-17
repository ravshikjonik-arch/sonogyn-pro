"use client";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

import {
  ProceduralUterus,
  type ScarNicheVisualState,
} from "@clinical/uterus";

type Props = {
  scarNiche: ScarNicheVisualState;
};

export function ScarNiche3DPreview({ scarNiche }: Props) {
  return (
    <div className="h-[420px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-inner">
      <Canvas dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <color attach="background" args={["#0f172a"]} />
          <PerspectiveCamera makeDefault position={[0, 0.12, 3.6]} fov={38} />
          <ambientLight intensity={0.72} />
          <directionalLight intensity={1.35} position={[2.6, 3.2, 2.4]} />
          <ProceduralUterus
            theme="dark"
            eduMode="anatomy"
            pedunculated={false}
            showDiffuseAdeno={false}
            showFocalAdeno={false}
            showCysticAdeno={false}
            modelScale={1}
            scarNiche={scarNiche}
          />
          <OrbitControls enablePan={false} minDistance={2.2} maxDistance={5.2} />
        </Suspense>
      </Canvas>
    </div>
  );
}
