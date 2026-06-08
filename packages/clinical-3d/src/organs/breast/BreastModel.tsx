import { useMemo } from "react";
import * as THREE from "three";
import type { BreastLesionAnnotation } from "../../types";
import { getBiradsColor } from "./biradsMapping";

export type BreastModelProps = {
  side: "left" | "right";
  /** Объём по УЗИ, мл — масштабирует полусферу. */
  breastVolumeMl?: number;
  lesions?: BreastLesionAnnotation[];
  onLesionClick?: (id: string) => void;
};

/**
 * Процедурная 3D-модель молочной железы (без GLB).
 * Полусфера + сосковой конус; очаги — эллипсоиды по BI-RADS.
 */
export function createBreastGeometry(breastVolumeMl: number, side: "left" | "right") {
  const volumeScale = THREE.MathUtils.clamp(Math.cbrt(breastVolumeMl / 350), 0.75, 1.35);
  const mirror = side === "right" ? -1 : 1;
  return { volumeScale, mirror };
}

export function BreastModel({
  side,
  breastVolumeMl = 350,
  lesions = [],
  onLesionClick,
}: BreastModelProps) {
  const { volumeScale, mirror } = useMemo(
    () => createBreastGeometry(breastVolumeMl, side),
    [breastVolumeMl, side],
  );

  return (
    <group scale={[mirror * volumeScale, volumeScale, volumeScale]}>
      {/* Кожа / паренхима */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#f5d0c5" roughness={0.85} metalness={0.02} />
      </mesh>
      {/* Сосок */}
      <mesh position={[0, 0.02, 0.92]} castShadow>
        <coneGeometry args={[0.08, 0.14, 24]} />
        <meshStandardMaterial color="#c9887a" roughness={0.7} />
      </mesh>
      {/* Очаговые образования */}
      {lesions.map((lesion) => {
        const [sx, sy, sz] = [lesion.size.x, lesion.size.y, lesion.size.z].map((v) =>
          THREE.MathUtils.clamp(v / 100, 0.04, 0.35),
        );
        return (
          <mesh
            key={lesion.id}
            position={[lesion.position.x, lesion.position.y, lesion.position.z]}
            scale={[sx, sy, sz]}
            onClick={(e) => {
              e.stopPropagation();
              onLesionClick?.(lesion.id);
            }}
          >
            <sphereGeometry args={[1, 20, 16]} />
            <meshStandardMaterial
              color={lesion.color || getBiradsColor(lesion.metadata.biradsCategory)}
              transparent
              opacity={lesion.opacity}
              roughness={0.45}
            />
          </mesh>
        );
      })}
    </group>
  );
}
