import { Line } from "@react-three/drei";
import * as THREE from "three";

type Props = {
  a: THREE.Vector3 | null;
  b: THREE.Vector3 | null;
  visible: boolean;
};

/** Линейный замер между двумя точками в локальных координатах матки */
export default function MeasureDistanceOverlay({ a, b, visible }: Props) {
  if (!visible || !a || !b) return null;
  return (
    <Line
      points={[a.toArray(), b.toArray()]}
      color="#0369a1"
      lineWidth={2}
      dashed
      dashScale={10}
      depthTest={false}
      transparent
      opacity={0.92}
    />
  );
}
