import { useMemo, useState } from "react";
import * as THREE from "three";

export type MeasurementPoint = { id: string; position: THREE.Vector3 };

export function useMeasurement() {
  const [points, setPoints] = useState<MeasurementPoint[]>([]);

  const distanceMm = useMemo(() => {
    if (points.length < 2) return null;
    return points[0].position.distanceTo(points[1].position) * 10;
  }, [points]);

  return { points, setPoints, distanceMm };
}
