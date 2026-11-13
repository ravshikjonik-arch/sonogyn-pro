/**
 * PELVIS_3D — каркас модуля малого таза (DIE / глубина инфильтрации).
 * Default off: не меняет UX, пока NEXT_PUBLIC_PELVIS_3D не включён.
 */

function envTruthy(value: string | undefined): boolean {
  const v = value?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function isPelvis3dEnabled(): boolean {
  return envTruthy(process.env.NEXT_PUBLIC_PELVIS_3D);
}
