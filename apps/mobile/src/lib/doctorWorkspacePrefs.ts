import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_PINNED_TOOL_IDS,
  type DoctorRole,
} from "@repo/clinical-tools";

const ROLE_KEY = "sonogyn_doctor_role_v1";
const PINS_KEY = "sonogyn_pinned_tools_v1";
const ONBOARDED_KEY = "sonogyn_workspace_onboarded_v1";

export async function loadDoctorRole(): Promise<DoctorRole | null> {
  const v = await AsyncStorage.getItem(ROLE_KEY);
  if (v === "ultrasound" || v === "gynecologist" || v === "obstetrician" || v === "allied") return v;
  return null;
}

export async function saveDoctorRole(role: DoctorRole): Promise<void> {
  await AsyncStorage.setItem(ROLE_KEY, role);
  const pins = await loadPinnedToolIds();
  if (!pins.length) {
    await savePinnedToolIds(DEFAULT_PINNED_TOOL_IDS[role]);
  }
}

export async function loadPinnedToolIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(PINS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function savePinnedToolIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(PINS_KEY, JSON.stringify(ids));
}

export async function isWorkspaceOnboarded(): Promise<boolean> {
  return (await AsyncStorage.getItem(ONBOARDED_KEY)) === "1";
}

export async function setWorkspaceOnboarded(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDED_KEY, "1");
}

export async function resolvePinnedIds(role: DoctorRole | null): Promise<string[]> {
  const custom = await loadPinnedToolIds();
  if (custom.length) return custom;
  if (role) return DEFAULT_PINNED_TOOL_IDS[role];
  return DEFAULT_PINNED_TOOL_IDS.ultrasound;
}
