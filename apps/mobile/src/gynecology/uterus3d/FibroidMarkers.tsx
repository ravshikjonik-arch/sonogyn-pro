import { PivotControls } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { FibroidMarkerState } from "./clinicalWorkspaceTypes";
import { exglTransmissionProps } from "./exglCompat";

type Props = {
  markers: FibroidMarkerState[];
  selectedId: string | null;
  visible: boolean;
  onSelect: (id: string | null) => void;
  onPositionCommit: (id: string, local: THREE.Vector3) => void;
  onDragLock: (locked: boolean) => void;
};

/**
 * Клинические маркеры миомы: перетаскивание осей (drei PivotControls), материал — «clean clinical», не game-like.
 */
export default function FibroidMarkers({
  markers,
  selectedId,
  visible,
  onSelect,
  onPositionCommit,
  onDragLock,
}: Props) {
  if (!visible || markers.length === 0) return null;

  return (
    <>
      {markers.map((m) => (
        <FibroidMarkerItem
          key={m.id}
          marker={m}
          selected={selectedId === m.id}
          onSelect={() => onSelect(m.id)}
          onPositionCommit={onPositionCommit}
          onDragLock={onDragLock}
        />
      ))}
    </>
  );
}

function FibroidMarkerItem({
  marker,
  selected,
  onSelect,
  onPositionCommit,
  onDragLock,
}: {
  marker: FibroidMarkerState;
  selected: boolean;
  onSelect: () => void;
  onPositionCommit: (id: string, local: THREE.Vector3) => void;
  onDragLock: (locked: boolean) => void;
}) {
  const lastLocal = useRef(new THREE.Matrix4());

  return (
    <PivotControls
      key={`${marker.id}:${marker.position.map((v) => v.toFixed(5)).join(":")}`}
      offset={[marker.position[0], marker.position[1], marker.position[2]]}
      autoTransform
      depthTest={false}
      scale={Math.max(0.55, marker.radius * 2.6)}
      lineWidth={2}
      disableRotations
      disableScaling
      axisColors={["#c026d3", "#0891b2", "#15803d"]}
      onDragStart={() => {
        onDragLock(true);
      }}
      onDrag={(mL) => {
        lastLocal.current.copy(mL);
      }}
      onDragEnd={() => {
        onDragLock(false);
        const pos = new THREE.Vector3().setFromMatrixPosition(lastLocal.current);
        onPositionCommit(marker.id, pos);
      }}
    >
      <mesh
        castShadow
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <sphereGeometry args={[marker.radius, 28, 28]} />
        <meshPhysicalMaterial
          color={selected ? "#9333ea" : "#7e22ce"}
          emissive="#3b0764"
          emissiveIntensity={selected ? 0.18 : 0.1}
          roughness={0.42}
          metalness={0.06}
          clearcoat={0.45}
          clearcoatRoughness={0.22}
          {...exglTransmissionProps(0.08, 0.35)}
          transparent
          opacity={0.96}
        />
      </mesh>
    </PivotControls>
  );
}
