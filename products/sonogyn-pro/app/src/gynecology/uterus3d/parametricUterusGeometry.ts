import * as THREE from "three";
import { OUTER_PROFILE, cylindricalR, innerRadiusAtY, outerRadiusAtY, radialDepth01 } from "./profile";

/** Диапазон высот по профилю Lathe */
export function uterusYRange(): { y0: number; y1: number } {
  const ys = OUTER_PROFILE.map((p) => p.y);
  return { y0: Math.min(...ys), y1: Math.max(...ys) };
}

/** Визуальное утолщение/рифление шейки (не затрагивает radialDepth01 для FIGO-хита по объёму). */
function cervicalInnerVisualFactor(y: number): number {
  if (y > -0.88) return 1;
  return 1 + 0.065 * Math.sin(23 * y + 3.15) + 0.042 * Math.cos(35 * y - 0.6);
}

export function innerRadiusVisual(y: number): number {
  return innerRadiusAtY(y) * cervicalInnerVisualFactor(y);
}

/** Лёгкая анизотропная модуляция наружной поверхности + намёк на продольные пучки миометрия */
function outerSurfaceRipple(theta: number, y: number): number {
  return (
    1 +
    0.026 * Math.sin(6 * theta + y * 2.55) +
    0.016 * Math.sin(11 * theta - y * 1.85) +
    0.036 * Math.sin(y * 8.6 + theta * 2.05) +
    0.008 * Math.cos(17 * theta + y * 1.05)
  );
}

/** Рифление эндометрия по окружности и высоте */
function innerEndometrialRipple(theta: number, y: number): number {
  return (
    1 +
    0.074 * Math.sin(16 * theta + y * 4.05) +
    0.046 * Math.sin(11 * theta - y * 3.05) +
    0.032 * Math.sin(24 * theta + 1.72 * y)
  );
}

const SEAM_BLEND = 0.14;

function outerRippleSafe(theta: number, y: number): number {
  const edge = Math.min(theta, Math.PI - theta);
  const blend = THREE.MathUtils.smoothstep(edge, 0, SEAM_BLEND);
  return THREE.MathUtils.lerp(1, outerSurfaceRipple(theta, y), blend);
}

function innerRippleSafe(theta: number, y: number): number {
  const edge = Math.min(theta, Math.PI - theta);
  const blend = THREE.MathUtils.smoothstep(edge, 0, SEAM_BLEND);
  return THREE.MathUtils.lerp(1, innerEndometrialRipple(theta, y), blend);
}

function figoDepthColor(depth01: number): THREE.Color {
  const c = new THREE.Color();
  const d = THREE.MathUtils.clamp(depth01, 0, 1);
  if (d < 0.12) c.setHex(0xa684f0);
  else if (d < 0.28) c.setHex(0x58a8df);
  else if (d < 0.58) c.setHex(0x42b883);
  else if (d < 0.82) c.setHex(0xf0a060);
  else c.setHex(0xf07078);
  return c;
}

/** Процедурная карта рельефа для миометрия (tangent-space bump). */
export function createMyometriumBumpTexture(size = 160): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  const colTmp = new THREE.Color();
  for (let v = 0; v < size; v++) {
    for (let u = 0; u < size; u++) {
      const fu = u / size;
      const fv = v / size;
      const longitudinal = Math.sin(fv * Math.PI * 22 + fu * 6.2) * 0.55;
      const circum = Math.sin(fu * Math.PI * 28 + fv * 11.5) * 0.28;
      const fine = Math.sin((fu + fv) * 160) * 0.12;
      const n = longitudinal + circum + fine;
      const g = THREE.MathUtils.clamp(0.5 + n * 0.42, 0.06, 0.96);
      colTmp.setRGB(g, g, g);
      const i = (v * size + u) * 4;
      data[i] = Math.round(colTmp.r * 255);
      data[i + 1] = Math.round(colTmp.g * 255);
      data[i + 2] = Math.round(colTmp.b * 255);
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6.5, 10);
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Передняя половина тела (z ≥ 0): продольный разрез как на медицинских иллюстрациях.
 * θ ∈ [0, π].
 */
export function createParametricOuterGeometryHalf(
  sectorsHalf: number,
  rings: number,
  includeFigoVertexColors: boolean,
): THREE.BufferGeometry {
  const { y0, y1 } = uterusYRange();
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const colors: number[] | null = includeFigoVertexColors ? [] : null;
  const colTmp = new THREE.Color();

  for (let j = 0; j <= rings; j++) {
    const tv = j / rings;
    const y = THREE.MathUtils.lerp(y0, y1, tv);
    for (let i = 0; i <= sectorsHalf; i++) {
      const tu = i / sectorsHalf;
      const theta = tu * Math.PI;
      const r = outerRadiusAtY(y) * outerRippleSafe(theta, y);
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      verts.push(x, y, z);
      uvs.push(tu, tv);
      if (colors) {
        const d = radialDepth01(cylindricalR(x, z), y);
        colTmp.copy(figoDepthColor(d));
        colors.push(colTmp.r, colTmp.g, colTmp.b);
      }
    }
  }

  const stride = sectorsHalf + 1;
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < sectorsHalf; i++) {
      const a = j * stride + i;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  if (colors) geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Внутренняя полость для передней половины */
export function createParametricInnerCavityGeometryHalf(sectorsHalf: number, rings: number): THREE.BufferGeometry {
  const { y0, y1 } = uterusYRange();
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= rings; j++) {
    const tv = j / rings;
    const y = THREE.MathUtils.lerp(y0, y1, tv);
    for (let i = 0; i <= sectorsHalf; i++) {
      const tu = i / sectorsHalf;
      const theta = tu * Math.PI;
      const r = innerRadiusVisual(y) * 0.984 * innerRippleSafe(theta, y);
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      verts.push(x, y, z);
      uvs.push(tu, tv);
    }
  }

  const stride = sectorsHalf + 1;
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < sectorsHalf; i++) {
      const a = j * stride + i;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export type SagittalCapColorMode = "anatomy" | "figo";

/**
 * Плоскость разреза z = 0: миометрий — полость — миометрий; волнообразная линия эндометрия.
 */
export function createSagittalCrossSectionCapGeometry(
  rings: number,
  xSeg: number,
  colorMode: SagittalCapColorMode,
): THREE.BufferGeometry {
  const { y0, y1 } = uterusYRange();
  const verts: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  function innerWave(y: number): number {
    return 1 + 0.055 * Math.sin(16.8 * y + 0.42) + 0.036 * Math.sin(23.5 * y - 1.05);
  }

  type Band = "myo_l" | "endo" | "myo_r";

  function bandVertexColor(x: number, y: number, band: Band): THREE.Color {
    const c = new THREE.Color();
    if (colorMode === "figo") {
      const d = radialDepth01(Math.abs(x) + 0.004, y);
      return figoDepthColor(d);
    }
    if (band === "endo") {
      const ri = innerRadiusVisual(y) * innerWave(y);
      const t = THREE.MathUtils.clamp((Math.abs(x) + 0.008) / (ri + 1e-6), 0, 1);
      c.setRGB(THREE.MathUtils.lerp(0.42, 0.78, t), THREE.MathUtils.lerp(0.14, 0.42, t), THREE.MathUtils.lerp(0.22, 0.48, t));
      return c;
    }
    const d = radialDepth01(Math.abs(x), y);
    if (d > 0.72) c.setHex(0xd0909c);
    else if (d > 0.38) c.setHex(0xc47280);
    else c.setHex(0xb85d6e);
    return c;
  }

  function pushVertex(x: number, y: number, band: Band, tu: number, tv: number) {
    verts.push(x, y, 0);
    normals.push(0, 0, -1);
    uvs.push(tu, tv);
    const col = bandVertexColor(x, y, band);
    colors.push(col.r, col.g, col.b);
  }

  const colsPerBand = xSeg + 1;
  const vertsPerRow = colsPerBand * 3;

  for (let j = 0; j <= rings; j++) {
    const tv = j / rings;
    const y = THREE.MathUtils.lerp(y0, y1, tv);
    const iw = innerWave(y);
    const ri = innerRadiusVisual(y) * iw;
    const ro = outerRadiusAtY(y);

    const bands: { band: Band; xa: number; xb: number }[] = [
      { band: "myo_l", xa: -ro, xb: -ri },
      { band: "endo", xa: -ri, xb: ri },
      { band: "myo_r", xa: ri, xb: ro },
    ];

    for (let bi = 0; bi < 3; bi++) {
      const { band, xa, xb } = bands[bi];
      for (let k = 0; k <= xSeg; k++) {
        const t = k / xSeg;
        const x = THREE.MathUtils.lerp(xa, xb, t);
        const tu = (bi + t) / 3;
        pushVertex(x, y, band, tu, tv);
      }
    }
  }

  for (let j = 0; j < rings; j++) {
    for (let bi = 0; bi < 3; bi++) {
      const rowOff = j * vertsPerRow + bi * colsPerBand;
      const rowOffN = rowOff + vertsPerRow;
      for (let k = 0; k < xSeg; k++) {
        const a = rowOff + k;
        const bIdx = a + 1;
        const c = rowOffN + k;
        const d = c + 1;
        indices.push(a, c, bIdx, bIdx, c, d);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}
