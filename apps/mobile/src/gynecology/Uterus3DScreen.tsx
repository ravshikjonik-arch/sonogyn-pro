import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { PageType } from "../navigationTypes";
import Uterus3DPanel from "./uterus3d/Uterus3DPanel";

export default function Uterus3DScreen({ setPage }: { setPage: (p: PageType) => void }) {
  return (
    <ScrollView contentContainerStyle={s.scroll}>
      <View style={s.card}>
        <Pressable style={s.backBtn} onPress={() => setPage("gyn_uterus_clinic")}>
          <Text style={s.backBtnText}>← К матке · FIGO</Text>
        </Pressable>
        <Text style={s.title}>3D модель матки · FIGO</Text>
        <Text style={s.meta}>
          Коснитесь стенки модели в режиме «+ Миома» — программа определит тип FIGO и локализацию. Учебный CDS, не
          заменяет заключение специалиста.
        </Text>
        <Uterus3DPanel />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  backBtn: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignSelf: "flex-start",
  },
  backBtnText: { color: "#0f172a", fontWeight: "600" },
  title: { fontSize: 17, fontWeight: "800", color: "#111827" },
  meta: { fontSize: 11, color: "#64748b", lineHeight: 16 },
});
