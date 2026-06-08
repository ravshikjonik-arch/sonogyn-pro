import { PerspectiveCamera } from "@react-three/drei";
import { Suspense } from "react";
import type { UterusHitResult } from "./figoHitMapping";
import GlbErrorBoundary from "./GlbErrorBoundary";
import ProceduralUterus from "./ProceduralUterus";
import UterusGlbBody from "./UterusGlbBody";
import UterusOrbitAndPresets from "./UterusOrbitAndPresets";
import { cylindricalR, outerRadiusAtY, radialDepth01 } from "./profile";
import type { UterusViewPresetId } from "./uterusCameraPresets";
import type { UterusClinicalWorkspaceBinding } from "./clinicalWorkspaceTypes";
import type { ScarNicheVisualState } from "./scarNicheTypes";

export type EduMode = "anatomy" | "figo" | "adenomyosis";

export type UterusSceneProps = {
  theme: "light" | "dark";
  eduMode: EduMode;
  pedunculated: boolean;
  showDiffuseAdeno: boolean;
  showFocalAdeno: boolean;
  showCysticAdeno: boolean;
  glbUrl: string | null;
  /** Ортогональные и интракавитарные ракурсы камеры */
  viewPreset: UterusViewPresetId;
  scarNiche: ScarNicheVisualState;
  onPick?: (hit: UterusHitResult, local: import("three").Vector3) => void;
  clinicalWorkspace?: UterusClinicalWorkspaceBinding | null;
  enableOrbitPan?: boolean;
  orbitInteractionsFrozen?: boolean;
};

export default function UterusScene({
  theme,
  eduMode,
  pedunculated,
  showDiffuseAdeno,
  showFocalAdeno,
  showCysticAdeno,
  glbUrl,
  viewPreset,
  scarNiche,
  onPick,
  clinicalWorkspace = null,
  enableOrbitPan = false,
  orbitInteractionsFrozen = false,
}: UterusSceneProps) {
  const ambientGround = theme === "dark" ? "#1e293b" : "#cbd5e1";
  const ambientSky = theme === "dark" ? "#f8fafc" : "#fefefe";
  const bg = theme === "dark" ? "#0f172a" : "#e8eef5";

  const interior =
    viewPreset === "intracavity_to_fundus" ||
    viewPreset === "intracavity_to_cervix" ||
    viewPreset === "hysteroscopy_scar";
  const hemiIntensity = (theme === "dark" ? 0.38 : 0.62) * (interior ? 1.52 : 1);
  const keyIntensity = (theme === "dark" ? 0.85 : 1.05) * (interior ? 1.18 : 1);

  const bodyProps = {
    theme,
    eduMode,
    pedunculated,
    showDiffuseAdeno,
    showFocalAdeno,
    showCysticAdeno,
    interiorCamera: interior,
    scarNiche,
    onPick,
    clinicalWorkspace,
  };

  return (
    <>
      <color attach="background" args={[bg]} />
      <hemisphereLight intensity={hemiIntensity} color={ambientSky} groundColor={ambientGround} />
      <directionalLight
        castShadow
        position={[4.2, 6.5, 3.2]}
        intensity={keyIntensity}
        color="#fff7ed"
      />
      <directionalLight position={[-3.5, 2.4, -4]} intensity={theme === "dark" ? 0.28 : 0.42} color="#bfdbfe" />
      <directionalLight position={[0.5, -2, 5]} intensity={theme === "dark" ? 0.18 : 0.28} color="#e0f2fe" />
      <directionalLight
        position={[-3.2, 4.2, -5.8]}
        intensity={theme === "dark" ? 0.32 : 0.52}
        color="#fff8f5"
      />
      <ambientLight intensity={theme === "dark" ? 0.08 : 0.06} color="#94a3b8" />

      {interior && (
        <>
          <pointLight position={[0, 0.38, 0.09]} intensity={theme === "dark" ? 0.62 : 0.48} distance={2.8} decay={2} color="#fff5eb" />
          <pointLight position={[0, -0.12, 0.06]} intensity={theme === "dark" ? 0.28 : 0.22} distance={2.2} decay={2} color="#e0f2fe" />
        </>
      )}

      <PerspectiveCamera makeDefault position={[2.35, 0.55, 2.55]} fov={42} near={0.08} far={80} />

      {glbUrl ? (
        <GlbErrorBoundary key={glbUrl} fallback={<ProceduralUterus {...bodyProps} />}>
          <Suspense fallback={<ProceduralUterus {...bodyProps} />}>
            <UterusGlbBody url={glbUrl} {...bodyProps} />
          </Suspense>
        </GlbErrorBoundary>
      ) : (
        <ProceduralUterus {...bodyProps} />
      )}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.62, 0]} receiveShadow raycast={() => null}>
        <planeGeometry args={[10, 10]} />
        <shadowMaterial opacity={theme === "dark" ? 0.35 : 0.18} />
      </mesh>

      <UterusOrbitAndPresets
        preset={viewPreset}
        enablePan={enableOrbitPan}
        interactionsFrozen={orbitInteractionsFrozen}
      />
    </>
  );
}

export function __depthProbe(x: number, y: number, z: number): number {
  const r = cylindricalR(x, z);
  return radialDepth01(r, y);
}

export function __outerRAtY(y: number): number {
  return outerRadiusAtY(y);
}

export type { UterusViewPresetId } from "./uterusCameraPresets";
export type { ScarNicheVisualState } from "./scarNicheTypes";
