import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  DOCTOR_ROLE_HINTS,
  DOCTOR_ROLE_LABELS,
  DEFAULT_PINNED_TOOL_IDS,
  type DoctorRole,
} from "@repo/clinical-tools";

import { loadDoctorRole, saveDoctorRole, savePinnedToolIds } from "../../lib/doctorWorkspacePrefs";

const ROLES: DoctorRole[] = ["ultrasound", "gynecologist", "obstetrician", "allied"];

export function DoctorRoleSettings() {
  const [role, setRole] = useState<DoctorRole | null>(null);

  useEffect(() => {
    void loadDoctorRole().then(setRole);
  }, []);

  async function pick(next: DoctorRole) {
    await saveDoctorRole(next);
    await savePinnedToolIds(DEFAULT_PINNED_TOOL_IDS[next]);
    setRole(next);
  }

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Профиль смены</Text>
      <Text style={styles.sub}>Влияет на избранное и порядок в поиске</Text>
      {ROLES.map((r) => {
        const on = role === r;
        return (
          <Pressable key={r} style={[styles.row, on && styles.rowOn]} onPress={() => void pick(r)}>
            <Text style={[styles.rowTitle, on && styles.rowTitleOn]}>{DOCTOR_ROLE_LABELS[r]}</Text>
            <Text style={styles.rowSub}>{DOCTOR_ROLE_HINTS[r]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    gap: 8,
  },
  title: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
  sub: { fontSize: 12, color: "#64748b", marginBottom: 4 },
  row: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  rowOn: { borderColor: "#059669", backgroundColor: "#ecfdf5" },
  rowTitle: { fontSize: 14, fontWeight: "700", color: "#334155" },
  rowTitleOn: { color: "#047857" },
  rowSub: { fontSize: 11, color: "#64748b", marginTop: 2 },
});
