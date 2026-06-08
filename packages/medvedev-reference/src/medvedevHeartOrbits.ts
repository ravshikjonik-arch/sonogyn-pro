/**
 * Орбиты, тимус, сердце — p5/p50/p95 (или Shapiro 2,5/50/97,5 для предсердий).
 * Медведев М.В. Пренатальная эхография, 2016: Прил. 13–20.
 */

import { percentileFromMedvedevBand, type PercentileBand } from "./medvedevFirstTrimester";
import type { MedvedevBiometryAssessment } from "./medvedevBiometry";

export const MEDVEDEV_HEART_ORBITS_SOURCE =
  "Медведев М.В. Пренатальная эхография, 2016. Прил. 13–20 (Потапова, Zalel, Cho, Shapiro, Медведев).";

export type MedvedevHeartOrbitMarker =
  | "orbitExtra"
  | "orbitIntra"
  | "orbitDiameter"
  | "thymusPerimeter"
  | "thymusTransverse"
  | "leftAtrium"
  | "rightAtrium"
  | "leftVentricle"
  | "rightVentricle"
  | "aorta";

type WeekBandRow = { week: number; band: PercentileBand };

const band = (p5: number, p50: number, p95: number): PercentileBand => ({ p5, p50, p95 });

/** Shapiro: храним как p5=p2.5, p95=p97.5 для единого расчёта перцентиля. */
const shapiro = (p25: number, p50: number, p975: number): PercentileBand => band(p25, p50, p975);

/** Прил. 13 — экстраорбитальный размер, мм. */
const ORBIT_EXTRA: WeekBandRow[] = [
  { week: 14, band: band(13.0, 14.6, 16.2) },
  { week: 15, band: band(16.5, 19.5, 22.5) },
  { week: 16, band: band(19.3, 21.8, 24.3) },
  { week: 17, band: band(22.7, 25.3, 27.9) },
  { week: 18, band: band(26.1, 29.1, 32.1) },
  { week: 19, band: band(27.8, 31.5, 35.2) },
  { week: 20, band: band(29.2, 32.3, 35.4) },
  { week: 21, band: band(29.8, 34.1, 38.4) },
  { week: 22, band: band(32.1, 36.2, 40.3) },
  { week: 23, band: band(34.1, 37.3, 40.7) },
  { week: 24, band: band(36.0, 38.9, 41.8) },
  { week: 25, band: band(36.5, 39.3, 42.1) },
  { week: 26, band: band(38.2, 42.1, 46.0) },
  { week: 27, band: band(41.8, 45.5, 49.2) },
  { week: 28, band: band(42.9, 46.1, 49.3) },
  { week: 29, band: band(43.4, 47.2, 51.0) },
  { week: 30, band: band(44.9, 48.8, 52.7) },
  { week: 31, band: band(46.1, 49.4, 52.7) },
  { week: 32, band: band(47.0, 49.8, 52.6) },
  { week: 33, band: band(49.9, 53.5, 57.1) },
  { week: 34, band: band(51.9, 54.9, 57.9) },
  { week: 35, band: band(52.6, 55.8, 59.0) },
  { week: 36, band: band(54.1, 57.3, 60.5) },
  { week: 37, band: band(55.2, 57.9, 60.6) },
  { week: 38, band: band(56.3, 59.6, 62.9) },
  { week: 39, band: band(57.0, 60.1, 63.2) },
  { week: 40, band: band(57.3, 60.3, 63.3) },
];

const ORBIT_INTRA: WeekBandRow[] = [
  { week: 14, band: band(6.0, 7.0, 8.0) },
  { week: 15, band: band(6.9, 8.9, 10.9) },
  { week: 16, band: band(7.0, 9.2, 11.4) },
  { week: 17, band: band(8.1, 10.4, 12.7) },
  { week: 18, band: band(8.5, 11.6, 14.7) },
  { week: 19, band: band(9.3, 12.3, 15.6) },
  { week: 20, band: band(9.6, 12.4, 15.2) },
  { week: 21, band: band(10.0, 12.7, 15.4) },
  { week: 22, band: band(10.4, 13.0, 15.6) },
  { week: 23, band: band(10.9, 13.5, 16.1) },
  { week: 24, band: band(11.4, 14.2, 17.0) },
  { week: 25, band: band(12.8, 15.1, 17.4) },
  { week: 26, band: band(13.0, 15.8, 18.6) },
  { week: 27, band: band(13.5, 16.0, 18.5) },
  { week: 28, band: band(13.9, 16.3, 18.7) },
  { week: 29, band: band(14.4, 16.8, 19.2) },
  { week: 30, band: band(14.2, 16.8, 19.4) },
  { week: 31, band: band(14.9, 17.1, 19.3) },
  { week: 32, band: band(15.0, 17.3, 19.3) },
  { week: 33, band: band(15.9, 18.8, 21.7) },
  { week: 34, band: band(16.3, 19.4, 22.5) },
  { week: 35, band: band(17.0, 20.0, 23.0) },
  { week: 36, band: band(18.5, 21.6, 24.7) },
  { week: 37, band: band(19.3, 22.3, 25.3) },
  { week: 38, band: band(19.6, 22.8, 26.0) },
  { week: 39, band: band(19.8, 23.0, 26.2) },
  { week: 40, band: band(20.1, 23.3, 26.5) },
];

const ORBIT_DIAMETER: WeekBandRow[] = [
  { week: 14, band: band(3.6, 5.1, 6.6) },
  { week: 15, band: band(4.8, 6.6, 8.4) },
  { week: 16, band: band(6.2, 7.7, 9.2) },
  { week: 17, band: band(7.0, 8.4, 10.8) },
  { week: 18, band: band(7.6, 8.8, 11.0) },
  { week: 19, band: band(8.0, 9.3, 10.6) },
  { week: 20, band: band(8.0, 9.6, 11.2) },
  { week: 21, band: band(8.2, 10.5, 12.8) },
  { week: 22, band: band(8.9, 10.4, 11.9) },
  { week: 23, band: band(9.0, 10.7, 12.4) },
  { week: 24, band: band(9.6, 11.2, 12.8) },
  { week: 25, band: band(10.0, 11.6, 13.2) },
  { week: 26, band: band(10.1, 11.9, 13.7) },
  { week: 27, band: band(10.2, 12.1, 14.0) },
  { week: 28, band: band(11.0, 13.0, 15.0) },
  { week: 29, band: band(11.1, 13.3, 15.5) },
  { week: 30, band: band(11.4, 13.7, 16.0) },
  { week: 31, band: band(11.9, 14.2, 16.5) },
  { week: 32, band: band(12.0, 14.0, 16.0) },
  { week: 33, band: band(12.4, 14.8, 17.2) },
  { week: 34, band: band(13.3, 15.3, 17.3) },
  { week: 35, band: band(13.8, 15.8, 17.8) },
  { week: 36, band: band(14.0, 16.0, 18.0) },
  { week: 37, band: band(14.5, 16.5, 18.5) },
  { week: 38, band: band(14.9, 17.0, 19.1) },
  { week: 39, band: band(15.3, 17.4, 19.5) },
  { week: 40, band: band(15.3, 17.4, 19.5) },
];

const THYMUS_PERIMETER: WeekBandRow[] = [
  { week: 14, band: band(17.97, 22.42, 26.87) },
  { week: 15, band: band(22.27, 26.83, 31.41) },
  { week: 16, band: band(26.57, 31.25, 35.94) },
  { week: 17, band: band(30.86, 35.67, 40.47) },
  { week: 18, band: band(35.16, 40.08, 45.0) },
  { week: 19, band: band(39.45, 44.5, 49.54) },
  { week: 20, band: band(43.75, 48.91, 54.07) },
  { week: 21, band: band(48.05, 53.33, 58.6) },
  { week: 22, band: band(52.34, 57.74, 63.14) },
  { week: 23, band: band(56.64, 62.16, 67.67) },
  { week: 24, band: band(60.93, 66.57, 72.2) },
  { week: 25, band: band(65.23, 70.99, 76.74) },
  { week: 26, band: band(69.53, 75.4, 81.27) },
  { week: 27, band: band(73.82, 79.82, 85.8) },
  { week: 28, band: band(78.12, 84.23, 90.33) },
  { week: 29, band: band(82.41, 88.65, 94.87) },
  { week: 30, band: band(86.71, 93.06, 99.4) },
  { week: 31, band: band(91.01, 97.48, 103.93) },
  { week: 32, band: band(95.3, 101.89, 108.47) },
  { week: 33, band: band(99.6, 106.31, 113.0) },
  { week: 34, band: band(103.89, 110.72, 117.53) },
  { week: 35, band: band(108.19, 115.14, 122.07) },
  { week: 36, band: band(112.49, 119.55, 126.6) },
  { week: 37, band: band(116.78, 123.96, 131.13) },
  { week: 38, band: band(121.08, 128.38, 135.66) },
];

const THYMUS_TRANSVERSE: WeekBandRow[] = [
  { week: 19, band: band(0.6, 1.2, 1.8) },
  { week: 20, band: band(0.7, 1.4, 2.0) },
  { week: 21, band: band(0.9, 1.5, 2.1) },
  { week: 22, band: band(1.0, 1.6, 2.3) },
  { week: 23, band: band(1.2, 1.8, 2.4) },
  { week: 24, band: band(1.3, 1.9, 2.6) },
  { week: 25, band: band(1.5, 2.1, 2.7) },
  { week: 26, band: band(1.6, 2.2, 2.9) },
  { week: 27, band: band(1.8, 2.4, 3.0) },
  { week: 28, band: band(1.9, 2.5, 3.2) },
  { week: 29, band: band(2.0, 2.7, 3.3) },
  { week: 30, band: band(2.2, 2.8, 3.5) },
  { week: 31, band: band(2.3, 3.0, 3.6) },
  { week: 32, band: band(2.5, 3.1, 3.7) },
  { week: 33, band: band(2.6, 3.3, 3.9) },
  { week: 34, band: band(2.8, 3.4, 4.0) },
  { week: 35, band: band(2.9, 3.6, 4.2) },
  { week: 36, band: band(3.1, 3.7, 4.3) },
  { week: 37, band: band(3.2, 3.9, 4.5) },
  { week: 38, band: band(3.4, 4.0, 4.6) },
];

const LEFT_ATRIUM: WeekBandRow[] = [
  { week: 14, band: shapiro(1.96, 3.16, 4.37) },
  { week: 15, band: shapiro(2.49, 3.8, 5.12) },
  { week: 16, band: shapiro(3.0, 4.43, 5.86) },
  { week: 17, band: shapiro(3.5, 5.04, 6.58) },
  { week: 18, band: shapiro(3.99, 5.64, 7.29) },
  { week: 19, band: shapiro(4.46, 6.22, 7.98) },
  { week: 20, band: shapiro(4.92, 6.79, 8.66) },
  { week: 21, band: shapiro(5.36, 7.35, 9.33) },
  { week: 22, band: shapiro(5.79, 7.89, 9.99) },
  { week: 23, band: shapiro(6.21, 8.42, 10.62) },
  { week: 24, band: shapiro(6.61, 8.93, 11.25) },
  { week: 25, band: shapiro(7.0, 9.43, 11.86) },
  { week: 26, band: shapiro(7.38, 9.92, 12.46) },
  { week: 27, band: shapiro(7.74, 10.39, 13.04) },
  { week: 28, band: shapiro(8.09, 10.85, 13.61) },
  { week: 29, band: shapiro(8.42, 11.29, 14.17) },
  { week: 30, band: shapiro(8.74, 11.72, 14.73) },
  { week: 31, band: shapiro(9.04, 12.14, 15.24) },
  { week: 32, band: shapiro(9.34, 12.54, 15.75) },
  { week: 33, band: shapiro(9.61, 12.93, 16.25) },
  { week: 34, band: shapiro(9.88, 13.31, 16.74) },
  { week: 35, band: shapiro(10.12, 13.67, 17.21) },
  { week: 36, band: shapiro(10.36, 14.01, 17.67) },
  { week: 37, band: shapiro(10.58, 14.35, 18.11) },
  { week: 38, band: shapiro(10.79, 14.66, 18.54) },
  { week: 39, band: shapiro(10.98, 14.97, 18.96) },
  { week: 40, band: shapiro(11.16, 15.26, 19.36) },
];

const RIGHT_ATRIUM: WeekBandRow[] = [
  { week: 14, band: shapiro(2.22, 3.54, 4.87) },
  { week: 15, band: shapiro(2.75, 4.2, 5.65) },
  { week: 16, band: shapiro(3.26, 4.84, 6.42) },
  { week: 17, band: shapiro(3.77, 5.47, 7.17) },
  { week: 18, band: shapiro(4.27, 6.09, 7.92) },
  { week: 19, band: shapiro(4.75, 6.7, 8.65) },
  { week: 20, band: shapiro(5.22, 7.29, 9.37) },
  { week: 21, band: shapiro(5.68, 7.88, 10.08) },
  { week: 22, band: shapiro(6.13, 8.45, 10.77) },
  { week: 23, band: shapiro(6.56, 9.01, 11.46) },
  { week: 24, band: shapiro(6.99, 9.56, 12.13) },
  { week: 25, band: shapiro(7.4, 10.1, 12.79) },
  { week: 26, band: shapiro(7.8, 10.62, 13.44) },
  { week: 27, band: shapiro(8.19, 11.13, 14.08) },
  { week: 28, band: shapiro(8.57, 11.64, 14.7) },
  { week: 29, band: shapiro(8.93, 12.13, 15.32) },
  { week: 30, band: shapiro(9.29, 12.61, 15.92) },
  { week: 31, band: shapiro(9.63, 13.07, 16.51) },
  { week: 32, band: shapiro(9.96, 13.53, 17.09) },
  { week: 33, band: shapiro(10.28, 13.97, 17.66) },
  { week: 34, band: shapiro(10.59, 14.4, 18.21) },
  { week: 35, band: shapiro(10.88, 14.82, 18.76) },
  { week: 36, band: shapiro(11.17, 15.23, 19.29) },
  { week: 37, band: shapiro(11.44, 15.62, 19.81) },
  { week: 38, band: shapiro(11.7, 16.01, 20.32) },
  { week: 39, band: shapiro(11.95, 16.38, 20.82) },
  { week: 40, band: shapiro(12.18, 16.74, 21.3) },
];

const LEFT_VENTRICLE: WeekBandRow[] = [
  { week: 14, band: band(1.1, 2.4, 3.7) },
  { week: 15, band: band(1.5, 3.0, 4.5) },
  { week: 16, band: band(2.0, 3.6, 5.2) },
  { week: 17, band: band(2.6, 4.3, 6.0) },
  { week: 18, band: band(3.3, 5.0, 6.7) },
  { week: 19, band: band(3.6, 5.6, 7.6) },
  { week: 20, band: band(4.1, 6.2, 8.3) },
  { week: 21, band: band(4.6, 6.8, 9.0) },
  { week: 22, band: band(5.1, 7.3, 9.5) },
  { week: 23, band: band(5.6, 7.8, 10.0) },
  { week: 24, band: band(6.1, 8.3, 10.5) },
  { week: 25, band: band(6.4, 8.7, 11.0) },
  { week: 26, band: band(6.7, 9.1, 11.5) },
  { week: 27, band: band(7.0, 9.5, 12.0) },
  { week: 28, band: band(7.3, 9.9, 12.5) },
  { week: 29, band: band(7.6, 10.3, 13.0) },
  { week: 30, band: band(7.8, 10.6, 13.4) },
  { week: 31, band: band(8.0, 10.9, 13.8) },
  { week: 32, band: band(8.2, 11.2, 14.2) },
  { week: 33, band: band(8.4, 11.5, 14.6) },
  { week: 34, band: band(8.5, 11.7, 14.9) },
  { week: 35, band: band(8.6, 11.9, 15.2) },
  { week: 36, band: band(8.6, 12.1, 15.6) },
  { week: 37, band: band(8.7, 12.3, 15.9) },
  { week: 38, band: band(8.8, 12.5, 16.2) },
  { week: 39, band: band(8.8, 12.6, 16.4) },
  { week: 40, band: band(8.8, 12.7, 16.6) },
];

const RIGHT_VENTRICLE: WeekBandRow[] = [
  { week: 14, band: band(1.2, 2.5, 3.8) },
  { week: 15, band: band(1.6, 3.2, 4.8) },
  { week: 16, band: band(2.1, 3.7, 5.3) },
  { week: 17, band: band(2.7, 4.4, 6.1) },
  { week: 18, band: band(3.3, 5.1, 6.9) },
  { week: 19, band: band(3.8, 5.7, 7.6) },
  { week: 20, band: band(4.3, 6.3, 8.3) },
  { week: 21, band: band(4.7, 6.9, 9.1) },
  { week: 22, band: band(5.1, 7.5, 9.9) },
  { week: 23, band: band(5.4, 8.0, 10.6) },
  { week: 24, band: band(5.8, 8.5, 11.2) },
  { week: 25, band: band(6.0, 9.0, 12.0) },
  { week: 26, band: band(6.3, 9.5, 12.7) },
  { week: 27, band: band(6.7, 10.0, 13.3) },
  { week: 28, band: band(7.0, 10.5, 14.0) },
  { week: 29, band: band(7.4, 11.0, 14.6) },
  { week: 30, band: band(7.8, 11.5, 15.2) },
  { week: 31, band: band(8.1, 11.9, 15.7) },
  { week: 32, band: band(8.4, 12.3, 16.2) },
  { week: 33, band: band(8.7, 12.7, 16.7) },
  { week: 34, band: band(9.1, 13.1, 17.1) },
  { week: 35, band: band(9.5, 13.5, 17.5) },
  { week: 36, band: band(9.9, 13.9, 17.9) },
  { week: 37, band: band(10.2, 14.2, 18.2) },
  { week: 38, band: band(10.5, 14.5, 18.5) },
  { week: 39, band: band(10.6, 14.7, 18.8) },
  { week: 40, band: band(10.6, 14.8, 19.0) },
];

const AORTA: WeekBandRow[] = [
  { week: 14, band: band(1.2, 1.6, 2.0) },
  { week: 15, band: band(1.5, 2.0, 2.5) },
  { week: 16, band: band(1.7, 2.2, 2.7) },
  { week: 17, band: band(1.9, 2.4, 2.9) },
  { week: 18, band: band(2.0, 2.6, 3.2) },
  { week: 19, band: band(2.2, 2.9, 3.6) },
  { week: 20, band: band(2.4, 3.2, 4.0) },
  { week: 21, band: band(2.6, 3.5, 4.4) },
  { week: 22, band: band(2.9, 3.8, 4.7) },
  { week: 23, band: band(3.0, 4.0, 5.0) },
  { week: 24, band: band(3.2, 4.2, 5.2) },
  { week: 25, band: band(3.3, 4.4, 5.5) },
  { week: 26, band: band(3.6, 4.7, 5.8) },
  { week: 27, band: band(3.7, 4.9, 6.1) },
  { week: 28, band: band(3.9, 5.1, 6.3) },
  { week: 29, band: band(4.1, 5.4, 6.7) },
  { week: 30, band: band(4.4, 5.7, 7.0) },
  { week: 31, band: band(4.7, 6.0, 7.3) },
  { week: 32, band: band(4.9, 6.2, 7.5) },
  { week: 33, band: band(5.1, 6.4, 7.7) },
  { week: 34, band: band(5.2, 6.6, 8.0) },
  { week: 35, band: band(5.4, 6.8, 8.2) },
  { week: 36, band: band(5.7, 7.1, 8.5) },
  { week: 37, band: band(5.9, 7.3, 8.7) },
  { week: 38, band: band(6.0, 7.5, 9.0) },
  { week: 39, band: band(6.2, 7.7, 9.2) },
  { week: 40, band: band(6.4, 7.9, 9.4) },
];

const MARKER_TABLES: Record<MedvedevHeartOrbitMarker, WeekBandRow[]> = {
  orbitExtra: ORBIT_EXTRA,
  orbitIntra: ORBIT_INTRA,
  orbitDiameter: ORBIT_DIAMETER,
  thymusPerimeter: THYMUS_PERIMETER,
  thymusTransverse: THYMUS_TRANSVERSE,
  leftAtrium: LEFT_ATRIUM,
  rightAtrium: RIGHT_ATRIUM,
  leftVentricle: LEFT_VENTRICLE,
  rightVentricle: RIGHT_VENTRICLE,
  aorta: AORTA,
};

const MARKER_LABELS: Record<MedvedevHeartOrbitMarker, string> = {
  orbitExtra: "Экстраорбитальный размер",
  orbitIntra: "Интраорбитальный размер",
  orbitDiameter: "Диаметр глазницы",
  thymusPerimeter: "Периметр тимуса",
  thymusTransverse: "Поперечный диаметр тимуса",
  leftAtrium: "Ширина левого предсердия",
  rightAtrium: "Ширина правого предсердия",
  leftVentricle: "Ширина левого желудочка",
  rightVentricle: "Ширина правого желудочка",
  aorta: "Диаметр аорты",
};

const MARKER_UNITS: Record<MedvedevHeartOrbitMarker, string> = {
  orbitExtra: "мм",
  orbitIntra: "мм",
  orbitDiameter: "мм",
  thymusPerimeter: "мм",
  thymusTransverse: "см",
  leftAtrium: "мм",
  rightAtrium: "мм",
  leftVentricle: "мм",
  rightVentricle: "мм",
  aorta: "мм",
};

const SHAPIRO_MARKERS = new Set<MedvedevHeartOrbitMarker>(["leftAtrium", "rightAtrium"]);

export const MEDVEDEV_HEART_ORBIT_METRIC_OPTIONS: {
  id: MedvedevHeartOrbitMarker;
  label: string;
  unit: string;
  group: "orbit" | "thymus" | "heart";
  appendix: string;
}[] = [
  { id: "orbitExtra", label: "Экстраорбитальный размер", unit: "мм", group: "orbit", appendix: "13" },
  { id: "orbitIntra", label: "Интраорбитальный размер", unit: "мм", group: "orbit", appendix: "13" },
  { id: "orbitDiameter", label: "Диаметр глазницы", unit: "мм", group: "orbit", appendix: "13" },
  { id: "thymusPerimeter", label: "Периметр тимуса", unit: "мм", group: "thymus", appendix: "14" },
  { id: "thymusTransverse", label: "Поперечный диаметр тимуса", unit: "см", group: "thymus", appendix: "15" },
  { id: "leftAtrium", label: "Левое предсердие", unit: "мм", group: "heart", appendix: "16" },
  { id: "rightAtrium", label: "Правое предсердие", unit: "мм", group: "heart", appendix: "17" },
  { id: "leftVentricle", label: "Левый желудочек", unit: "мм", group: "heart", appendix: "18" },
  { id: "rightVentricle", label: "Правый желудочек", unit: "мм", group: "heart", appendix: "19" },
  { id: "aorta", label: "Диаметр аорты", unit: "мм", group: "heart", appendix: "20" },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpBand(a: PercentileBand, b: PercentileBand, t: number): PercentileBand {
  return { p5: lerp(a.p5, b.p5, t), p50: lerp(a.p50, b.p50, t), p95: lerp(a.p95, b.p95, t) };
}

function interpolateWeekRows(rows: WeekBandRow[], gaWeeks: number): PercentileBand | null {
  if (rows.length === 0) return null;
  if (gaWeeks <= rows[0].week) return rows[0].band;
  if (gaWeeks >= rows[rows.length - 1].week) return rows[rows.length - 1].band;
  for (let i = 0; i < rows.length - 1; i += 1) {
    const left = rows[i];
    const right = rows[i + 1];
    if (gaWeeks >= left.week && gaWeeks <= right.week) {
      if (Math.abs(gaWeeks - left.week) < 0.001) return left.band;
      if (Math.abs(gaWeeks - right.week) < 0.001) return right.band;
      const t = (gaWeeks - left.week) / (right.week - left.week);
      return lerpBand(left.band, right.band, t);
    }
  }
  return rows[rows.length - 1].band;
}

function gaWeeksDecimal(weeks?: number, days?: number): number | null {
  if (weeks === undefined || !Number.isFinite(weeks)) return null;
  return weeks + (days ?? 0) / 7;
}

function formatBandRef(bandRef: PercentileBand, unit: string, marker: MedvedevHeartOrbitMarker): string {
  if (SHAPIRO_MARKERS.has(marker)) {
    return `p2.5 ${bandRef.p5} · p50 ${bandRef.p50} · p97.5 ${bandRef.p95} ${unit}`;
  }
  return `p5 ${bandRef.p5} · p50 ${bandRef.p50} · p95 ${bandRef.p95} ${unit}`;
}

function formatValue(value: number, unit: string): string {
  return `${value.toFixed(1).replace(/\.0$/, "")} ${unit}`;
}

function flagFromPercentile(percentile: number): MedvedevBiometryAssessment["flag"] {
  if (percentile <= 5) return "low";
  if (percentile >= 95) return "high";
  return "normal";
}

function assessHeartOrbitMarker(
  marker: MedvedevHeartOrbitMarker,
  value: number | undefined,
  gaWeeks: number | null,
): MedvedevBiometryAssessment {
  const label = MARKER_LABELS[marker];
  const unit = MARKER_UNITS[marker];

  if (gaWeeks == null) {
    return {
      marker,
      label,
      value,
      unit,
      reference: null,
      flag: "unknown",
      summary: `${label}: укажите срок беременности.`,
    };
  }

  const reference = interpolateWeekRows(MARKER_TABLES[marker], gaWeeks);
  if (!reference) {
    return {
      marker,
      label,
      value,
      unit,
      reference: null,
      flag: "out_of_range",
      summary: `${label}: таблица недоступна для ${gaWeeks.toFixed(1)} нед.`,
    };
  }

  if (value === undefined) {
    return {
      marker,
      label,
      unit,
      reference,
      flag: "unknown",
      summary: `${label} (~${gaWeeks.toFixed(1)} нед): ${formatBandRef(reference, unit, marker)}.`,
    };
  }

  const percentile = percentileFromMedvedevBand(value, reference);
  const flag = flagFromPercentile(percentile);
  const flagText =
    flag === "high"
      ? SHAPIRO_MARKERS.has(marker)
        ? "выше 97,5-го перцентиля"
        : "выше 95-го перцентиля"
      : flag === "low"
        ? SHAPIRO_MARKERS.has(marker)
          ? "ниже 2,5-го перцентиля"
          : "ниже 5-го перцентиля"
        : "в пределах нормы";

  return {
    marker,
    label,
    value,
    unit,
    reference,
    percentile,
    flag,
    summary: `${label} ${formatValue(value, unit)} → ~${percentile}-й перц. (${flagText}; ref ${formatBandRef(reference, unit, marker)}).`,
  };
}

export type HeartOrbitsInput = {
  gaWeeksByLmp?: number;
  gaDaysByLmp?: number;
  orbitExtraMm?: number;
  orbitIntraMm?: number;
  orbitDiameterMm?: number;
  thymusPerimeterMm?: number;
  thymusTransverseCm?: number;
  leftAtriumMm?: number;
  rightAtriumMm?: number;
  leftVentricleMm?: number;
  rightVentricleMm?: number;
  aortaMm?: number;
};

export function assessHeartOrbitsScreening(input: HeartOrbitsInput): MedvedevBiometryAssessment[] {
  const gaWeeks = gaWeeksDecimal(input.gaWeeksByLmp, input.gaDaysByLmp);
  return [
    assessHeartOrbitMarker("orbitExtra", input.orbitExtraMm, gaWeeks),
    assessHeartOrbitMarker("orbitIntra", input.orbitIntraMm, gaWeeks),
    assessHeartOrbitMarker("orbitDiameter", input.orbitDiameterMm, gaWeeks),
    assessHeartOrbitMarker("thymusPerimeter", input.thymusPerimeterMm, gaWeeks),
    assessHeartOrbitMarker("thymusTransverse", input.thymusTransverseCm, gaWeeks),
    assessHeartOrbitMarker("leftAtrium", input.leftAtriumMm, gaWeeks),
    assessHeartOrbitMarker("rightAtrium", input.rightAtriumMm, gaWeeks),
    assessHeartOrbitMarker("leftVentricle", input.leftVentricleMm, gaWeeks),
    assessHeartOrbitMarker("rightVentricle", input.rightVentricleMm, gaWeeks),
    assessHeartOrbitMarker("aorta", input.aortaMm, gaWeeks),
  ].filter((row) => row.reference !== null || row.value !== undefined);
}

export function listHeartOrbitsAtWeek(week: number): MedvedevBiometryAssessment[] {
  return MEDVEDEV_HEART_ORBIT_METRIC_OPTIONS.map((opt) => assessHeartOrbitMarker(opt.id, undefined, week));
}

export function getHeartOrbitBand(week: number, marker: MedvedevHeartOrbitMarker): PercentileBand | null {
  return interpolateWeekRows(MARKER_TABLES[marker], week);
}
