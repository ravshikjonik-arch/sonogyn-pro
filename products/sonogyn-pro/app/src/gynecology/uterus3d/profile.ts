import * as THREE from "three";

/**
 * Профиль меридиана матки (радиус X, высота Y), мм-масштаб условный — важны относительные пропорции.
 * Ось вращения Lathe = Y (как продольная ось матки: шейка снизу, дно сверху).
 */
export const OUTER_PROFILE: THREE.Vector2[] = [
  new THREE.Vector2(0.1, -1.52),
  new THREE.Vector2(0.18, -1.18),
  new THREE.Vector2(0.38, -0.72),
  new THREE.Vector2(0.62, -0.22),
  new THREE.Vector2(0.74, 0.28),
  new THREE.Vector2(0.68, 0.72),
  new THREE.Vector2(0.42, 1.12),
  new THREE.Vector2(0.22, 1.38),
  new THREE.Vector2(0.08, 1.48),
];

export function clampY(y: number): number {
  const ys = OUTER_PROFILE.map((p) => p.y);
  return THREE.MathUtils.clamp(y, Math.min(...ys), Math.max(...ys));
}

/** Радиус наружной поверхности при заданной высоте Y (линейная интерполяция по профилю). */
export function outerRadiusAtY(y: number): number {
  const yy = clampY(y);
  for (let i = 0; i < OUTER_PROFILE.length - 1; i++) {
    const a = OUTER_PROFILE[i];
    const b = OUTER_PROFILE[i + 1];
    if (yy >= a.y && yy <= b.y) {
      const t = (yy - a.y) / (b.y - a.y || 1e-6);
      return THREE.MathUtils.lerp(a.x, b.x, t);
    }
  }
  return OUTER_PROFILE[OUTER_PROFILE.length - 1].x;
}

/** Упрощённая «полость + JZ»: внутренняя граница миометрия. */
export function innerRadiusAtY(y: number): number {
  return outerRadiusAtY(y) * 0.74;
}

/** 0 = у полости, 1 = у серозы. */
export function radialDepth01(r: number, y: number): number {
  const o = outerRadiusAtY(y);
  const inn = innerRadiusAtY(y);
  const den = o - inn + 1e-6;
  return THREE.MathUtils.clamp((r - inn) / den, 0, 1);
}

export function cylindricalR(x: number, z: number): number {
  return Math.hypot(x, z);
}
