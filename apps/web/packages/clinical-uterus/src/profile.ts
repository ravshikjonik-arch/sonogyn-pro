import * as THREE from "three";

/**
 * Меридиан матки (радиус X, высота Y): грушевидное тело, перешеек, шейка, ниша влагалища.
 * Ось Lathe = Y (дно вверху по +Y, шейка внизу по -Y).
 */
export const OUTER_PROFILE: THREE.Vector2[] = [
  new THREE.Vector2(0.05, -1.92),
  new THREE.Vector2(0.1, -1.72),
  new THREE.Vector2(0.18, -1.48),
  new THREE.Vector2(0.26, -1.22),
  new THREE.Vector2(0.34, -0.92),
  new THREE.Vector2(0.52, -0.48),
  new THREE.Vector2(0.72, 0.02),
  new THREE.Vector2(0.84, 0.52),
  new THREE.Vector2(0.86, 0.98),
  new THREE.Vector2(0.78, 1.32),
  new THREE.Vector2(0.58, 1.52),
  new THREE.Vector2(0.34, 1.64),
  new THREE.Vector2(0.14, 1.68),
  new THREE.Vector2(0.05, 1.66),
];

/** Нижняя граница шейки для FIGO / слоёв */
export const CERVIX_Y_MAX = -1.05;

export function clampY(y: number): number {
  const ys = OUTER_PROFILE.map((p) => p.y);
  return THREE.MathUtils.clamp(y, Math.min(...ys), Math.max(...ys));
}

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

/** Полость: узкая у шейки и дна, шире в корпусе (сагиттальный треугольник). */
export function innerRadiusAtY(y: number): number {
  const o = outerRadiusAtY(y);
  const { y0, y1 } = uterusYRange();
  const t = (clampY(y) - y0) / (y1 - y0 + 1e-6);
  const belly = Math.sin(Math.PI * THREE.MathUtils.clamp(t, 0, 1));
  const wall = 0.42 + 0.22 * belly;
  return o * (1 - wall);
}

export function uterusYRange(): { y0: number; y1: number } {
  const ys = OUTER_PROFILE.map((p) => p.y);
  return { y0: Math.min(...ys), y1: Math.max(...ys) };
}

export function radialDepth01(r: number, y: number): number {
  const o = outerRadiusAtY(y);
  const inn = innerRadiusAtY(y);
  const den = o - inn + 1e-6;
  return THREE.MathUtils.clamp((r - inn) / den, 0, 1);
}

export function cylindricalR(x: number, z: number): number {
  return Math.hypot(x, z);
}
