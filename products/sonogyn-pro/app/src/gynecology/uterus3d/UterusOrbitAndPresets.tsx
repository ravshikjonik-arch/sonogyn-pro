import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  DEFAULT_ORBIT_DISTANCE,
  DEFAULT_ORBIT_POLAR,
  resolveUterusViewPreset,
  type UterusViewPresetId,
} from "./uterusCameraPresets";

type Props = {
  preset: UterusViewPresetId;
  /** Режим planning tool: панорамирование сцены */
  enablePan?: boolean;
  /** Блокируем orbit во время перетаскивания маркера pathology */
  interactionsFrozen?: boolean;
};

/** Жёсткие пресеты позиции/таргета OrbitControls + near/fov для интракавитарных ракурсов. */
export default function UterusOrbitAndPresets({
  preset,
  enablePan = false,
  interactionsFrozen = false,
}: Props) {
  const ref = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  useLayoutEffect(() => {
    const ctrl = ref.current;
    if (!ctrl) return;

    if (preset === "free") {
      ctrl.minDistance = DEFAULT_ORBIT_DISTANCE.min;
      ctrl.maxDistance = DEFAULT_ORBIT_DISTANCE.max;
      ctrl.minPolarAngle = DEFAULT_ORBIT_POLAR.min;
      ctrl.maxPolarAngle = DEFAULT_ORBIT_POLAR.max;
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.near = 0.08;
        camera.fov = 42;
        camera.updateProjectionMatrix();
      }
      ctrl.update();
      return;
    }

    const cfg = resolveUterusViewPreset(preset);
    if (!cfg) return;

    ctrl.minDistance = cfg.minDistance ?? DEFAULT_ORBIT_DISTANCE.min;
    ctrl.maxDistance = cfg.maxDistance ?? DEFAULT_ORBIT_DISTANCE.max;
    ctrl.minPolarAngle = cfg.minPolarAngle ?? DEFAULT_ORBIT_POLAR.min;
    ctrl.maxPolarAngle = cfg.maxPolarAngle ?? DEFAULT_ORBIT_POLAR.max;

    ctrl.target.set(cfg.target[0], cfg.target[1], cfg.target[2]);
    camera.position.set(cfg.position[0], cfg.position[1], cfg.position[2]);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.near = cfg.near ?? 0.08;
      camera.fov = cfg.fov ?? 42;
      camera.updateProjectionMatrix();
    }

    ctrl.update();
  }, [preset, camera]);

  return (
    <OrbitControls
      ref={ref}
      makeDefault
      enabled={!interactionsFrozen}
      enablePan={enablePan}
      enableRotate
      enableDamping
      dampingFactor={0.09}
      rotateSpeed={0.74}
      zoomSpeed={0.88}
    />
  );
}
