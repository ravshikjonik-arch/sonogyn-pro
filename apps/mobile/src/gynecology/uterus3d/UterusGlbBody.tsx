import { useGLTF } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { AnatomyLayerId } from "./figoHitMapping";
import FibroidMarkers from "./FibroidMarkers";
import AdenoFociMarkers from "./AdenoFociMarkers";
import MeasureDistanceOverlay from "./MeasureDistanceOverlay";
import type { UterusClinicalWorkspaceBinding } from "./clinicalWorkspaceTypes";
import type { ProceduralUterusProps } from "./ProceduralUterus";
import { mergeGlbNamedMeshHit } from "./glbHitMerge";
import { applyAnatomyLayersUserData } from "./glbLayerMap";
import { exglStripPhysicalTransmission, exglTransmissionProps } from "./exglCompat";
import { DEFAULT_SCAR_NICHE_MEASUREMENTS_MM } from "./scarNicheTypes";
import ScarNicheOverlay from "./ScarNicheOverlay";

export type UterusGlbBodyProps = ProceduralUterusProps & { url: string };

export default function UterusGlbBody({
  url,
  theme,
  eduMode,
  pedunculated,
  showDiffuseAdeno,
  showFocalAdeno,
  showCysticAdeno,
  interiorCamera = false,
  scarNiche,
  onPick,
  clinicalWorkspace = null,
}: UterusGlbBodyProps) {
  const { scene } = useGLTF(url);
  const root = useMemo(() => scene.clone(true), [scene]);
  const groupRef = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    applyAnatomyLayersUserData(root);
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (!mesh.userData.__uterusMatCloned) {
        mesh.material = Array.isArray(mesh.material) ? mesh.material.map((m) => m.clone()) : mesh.material.clone();
        mesh.userData.__uterusMatCloned = true;
      }
    });
  }, [root]);

  useLayoutEffect(() => {
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const raw of mats) {
        if (raw instanceof THREE.MeshStandardMaterial || raw instanceof THREE.MeshPhysicalMaterial) {
          if (raw instanceof THREE.MeshPhysicalMaterial) {
            exglStripPhysicalTransmission(raw);
          }
          raw.side = interiorCamera ? THREE.DoubleSide : THREE.FrontSide;
          if (eduMode === "figo") {
            raw.emissive.set("#8b5cf6");
            raw.emissiveIntensity = theme === "dark" ? 0.07 : 0.05;
          } else {
            raw.emissive.set("#000000");
            raw.emissiveIntensity = 0;
          }
          if (interiorCamera) {
            raw.emissive.lerp(new THREE.Color(theme === "dark" ? "#fbcfe8" : "#fda4af"), 0.35);
            raw.emissiveIntensity += theme === "dark" ? 0.12 : 0.09;
          }
        }
      }
    });
  }, [root, eduMode, theme, interiorCamera]);

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const mesh = e.object as THREE.Mesh & { userData: { anatomyLayerId?: AnatomyLayerId } };
    const meshLayer = mesh.userData.anatomyLayerId;
    if (!groupRef.current) return;
    const local = e.point.clone();
    groupRef.current.worldToLocal(local);
    const hit = mergeGlbNamedMeshHit(meshLayer, local, pedunculated);
    onPick?.(hit, local);
  };

  return (
    <group ref={groupRef} rotation={[0, -0.55, 0]}>
      <primitive object={root} onPointerDown={onPointerDown} />

      {eduMode === "adenomyosis" && showDiffuseAdeno && (
        <mesh raycast={() => null} position={[0, 0.05, 0]} scale={[1.05, 1.06, 1.05]}>
          <sphereGeometry args={[0.92, 28, 28]} />
          <meshPhysicalMaterial
            transparent
            opacity={0.11}
            color="#fda4af"
            emissive="#fb7185"
            emissiveIntensity={0.06}
            roughness={0.92}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {eduMode === "adenomyosis" && showFocalAdeno && (
        <mesh raycast={() => null} position={[0.38, 0.35, 0.22]} scale={[1.15, 1.05, 1]}>
          <sphereGeometry args={[0.14, 24, 24]} />
          <meshPhysicalMaterial
            transparent
            opacity={0.45}
            color="#fb7185"
            emissive="#f43f5e"
            emissiveIntensity={0.15}
            roughness={0.35}
            depthWrite={false}
          />
        </mesh>
      )}

      {eduMode === "adenomyosis" &&
        showCysticAdeno &&
        [
          [-0.36, 0.42, -0.18, 0.055],
          [-0.42, 0.28, -0.22, 0.048],
          [-0.32, 0.18, -0.28, 0.052],
          [-0.44, 0.08, -0.16, 0.04],
        ].map(([x, y, z, r], i) => (
          <mesh key={i} raycast={() => null} position={[x, y, z]}>
            <sphereGeometry args={[r, 18, 18]} />
            <meshPhysicalMaterial
              transparent
              opacity={0.55}
              color="#bae6fd"
              emissive="#38bdf8"
              emissiveIntensity={0.12}
              roughness={0.2}
              {...exglTransmissionProps(0.35, 0.4)}
              depthWrite={false}
            />
          </mesh>
        ))}
      <ScarNicheOverlay scar={scarNiche ?? { enabled: false, measurements: DEFAULT_SCAR_NICHE_MEASUREMENTS_MM }} theme={theme} />

      {clinicalWorkspace && (
        <>
          <FibroidMarkers
            markers={clinicalWorkspace.fibroidMarkers}
            selectedId={clinicalWorkspace.fibroidSelectedId}
            visible={clinicalWorkspace.fibroidsVisible}
            onSelect={clinicalWorkspace.onFibroidSelect}
            onPositionCommit={clinicalWorkspace.onFibroidPositionCommit}
            onDragLock={clinicalWorkspace.onWorkspaceDragLock}
          />
          <AdenoFociMarkers
            foci={clinicalWorkspace.adenoFoci}
            selectedId={clinicalWorkspace.adenoSelectedId}
            visible={clinicalWorkspace.adenoFociVisible}
            onSelect={clinicalWorkspace.onAdenoSelect}
            onPositionCommit={clinicalWorkspace.onAdenoPositionCommit}
            onDragLock={clinicalWorkspace.onWorkspaceDragLock}
          />
          <MeasureDistanceOverlay
            a={clinicalWorkspace.measurePointA}
            b={clinicalWorkspace.measurePointB}
            visible={clinicalWorkspace.measureOverlayVisible}
          />
        </>
      )}
    </group>
  );
}
