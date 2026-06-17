import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import {
  DOCTOR_ROLE_HINTS,
  DOCTOR_ROLE_LABELS,
  DEFAULT_PINNED_TOOL_IDS,
  type DoctorRole,
} from "@repo/clinical-tools";

import {
  isWorkspaceOnboarded,
  loadDoctorRole,
  saveDoctorRole,
  savePinnedToolIds,
  setWorkspaceOnboarded,
} from "../../lib/doctorWorkspacePrefs";

const ROLES: DoctorRole[] = ["ultrasound", "gynecologist", "obstetrician", "allied"];

export function DoctorRoleOnboarding() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    void (async () => {
      const onboarded = await isWorkspaceOnboarded();
      const role = await loadDoctorRole();
      if (!onboarded || !role) setVisible(true);
    })();
  }, []);

  async function pick(role: DoctorRole) {
    await saveDoctorRole(role);
    await savePinnedToolIds(DEFAULT_PINNED_TOOL_IDS[role]);
    await setWorkspaceOnboarded();
    setVisible(false);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Кто вы в смену?</Text>
          <Text style={styles.sub}>Подстроим избранное и поиск. Можно сменить в профиле.</Text>
          {ROLES.map((role) => (
            <Pressable key={role} style={styles.option} onPress={() => void pick(role)}>
              <Text style={styles.optionTitle}>{DOCTOR_ROLE_LABELS[role]}</Text>
              <Text style={styles.optionSub}>{DOCTOR_ROLE_HINTS[role]}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    gap: 10,
  },
  title: { fontSize: 22, fontWeight: "900", color: "#0f172a" },
  sub: { fontSize: 14, color: "#64748b", marginBottom: 8, lineHeight: 20 },
  option: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  optionTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  optionSub: { fontSize: 12, color: "#64748b", marginTop: 4 },
});
