import { Platform } from "react-native";
import type { MeshPhysicalMaterial } from "three";

/**
 * Expo `expo-gl` (EXGL) does not implement `renderbufferStorageMultisample`.
 * Three.js `MeshPhysicalMaterial` with `transmission > 0` uses a multisampled transmission pass → native crash.
 */
export function exglTransmissionProps(
  transmission: number,
  thickness: number,
): { transmission: number; thickness: number } {
  return Platform.OS === "web" ? { transmission, thickness } : { transmission: 0, thickness: 0 };
}

export function exglStripPhysicalTransmission(mat: MeshPhysicalMaterial): void {
  if (Platform.OS === "web") return;
  mat.transmission = 0;
  mat.thickness = 0;
}
