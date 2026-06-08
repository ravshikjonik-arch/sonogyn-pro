"use client";

import { PivotControls } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import type { PathologyAnnotation, PathologyType } from "./pathologyTypes";

const COLORS: Record<PathologyType, string> = {
  myoma: "#e11d48",
  adenomyosis: "#a855f7",
  polyp: "#f59e0b",
  scar: "#64748b",
  other: "#0ea5e9",
};

function radiusFromMm(size: { length: number; width: number; depth: number }): number {
  const avg = (size.length + size.width + size.depth) / 3;
  return THREE.MathUtils.clamp(avg / 180, 0.06, 0.22);
}

type Props = {
  annotations: PathologyAnnotation[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onPositionCommit: (id: string, local: THREE.Vector3) => void;
  onDragLock: (locked: boolean) => void;
};

export default function PathologyMarkers({
  annotations,
  selectedId,
  onSelect,
  onPositionCommit,
  onDragLock,
}: Props) {
  const items = useMemo(() => annotations, [annotations]);

  return (
    <group>
      {items.map((a) => {
        const selected = a.id === selectedId;
        const color = COLORS[a.type];
        const r = radiusFromMm(a.sizeMm);
        const pos = new THREE.Vector3(...a.position);

        if (selected) {
          return (
            <PivotControls
              key={a.id}
              anchor={[0, 0, 0]}
              depthTest={false}
              lineWidth={2}
              scale={0.85}
              onDragStart={() => onDragLock(true)}
              onDragEnd={() => onDragLock(false)}
              onDrag={(localMatrix) => {
                const p = new THREE.Vector3();
                p.setFromMatrixPosition(localMatrix);
                onPositionCommit(a.id, p);
              }}
            >
              <mesh
                position={pos}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(a.id);
                }}
              >
                <sphereGeometry args={[r, 24, 24]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
              </mesh>
            </PivotControls>
          );
        }

        return (
          <mesh
            key={a.id}
            position={pos}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(a.id);
            }}
          >
            <sphereGeometry args={[r, 20, 20]} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={0.92}
              emissive={color}
              emissiveIntensity={0.2}
            />
          </mesh>
        );
      })}
    </group>
  );
}
