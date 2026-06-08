import { PivotControls } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { AdenoFocalState } from "./clinicalWorkspaceTypes";

type Props = {
  foci: AdenoFocalState[];
  selectedId: string | null;
  visible: boolean;
  onSelect: (id: string | null) => void;
  onPositionCommit: (id: string, local: THREE.Vector3) => void;
  onDragLock: (locked: boolean) => void;
};

/** Очаги аденомиоза: полупрозрачный berry/red overlay, перетаскивание как у миомы */
export default function AdenoFociMarkers({
  foci,
  selectedId,
  visible,
  onSelect,
  onPositionCommit,
  onDragLock,
}: Props) {
  if (!visible || foci.length === 0) return null;

  return (
    <>
      {foci.map((m) => (
        <AdenoFocusItem
          key={m.id}
          focal={m}
          selected={selectedId === m.id}
          onSelect={() => onSelect(m.id)}
          onPositionCommit={onPositionCommit}
          onDragLock={onDragLock}
        />
      ))}
    </>
  );
}

function AdenoFocusItem({
  focal,
  selected,
  onSelect,
  onPositionCommit,
  onDragLock,
}: {
  focal: AdenoFocalState;
  selected: boolean;
  onSelect: () => void;
  onPositionCommit: (id: string, local: THREE.Vector3) => void;
  onDragLock: (locked: boolean) => void;
}) {
  const lastLocal = useRef(new THREE.Matrix4());

  return (
    <PivotControls
      key={`${focal.id}:${focal.position.map((v) => v.toFixed(5)).join(":")}`}
      offset={[focal.position[0], focal.position[1], focal.position[2]]}
      autoTransform
      depthTest={false}
      scale={Math.max(0.45, focal.radius * 2.4)}
      lineWidth={2}
      disableRotations
      disableScaling
      axisColors={["#be185d", "#c2410c", "#a21caf"]}
      onDragStart={() => onDragLock(true)}
      onDrag={(mL) => lastLocal.current.copy(mL)}
      onDragEnd={() => {
        onDragLock(false);
        const pos = new THREE.Vector3().setFromMatrixPosition(lastLocal.current);
        onPositionCommit(focal.id, pos);
      }}
    >
      <mesh
        castShadow={false}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <sphereGeometry args={[focal.radius, 22, 22]} />
        <meshPhysicalMaterial
          color={selected ? "#f472b6" : "#ec4899"}
          emissive="#831843"
          emissiveIntensity={selected ? 0.22 : 0.14}
          roughness={0.52}
          metalness={0.02}
          transmission={0.42}
          thickness={0.55}
          transparent
          opacity={0.44}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={2}
          polygonOffsetUnits={2}
        />
      </mesh>
    </PivotControls>
  );
}
