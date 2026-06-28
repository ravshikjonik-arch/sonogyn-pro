import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { OradsColorCode, OradsTreeResult } from "@repo/orads-us";

import type { OradsLocaleStrings } from "./useOradsLocale";

type Props = {
  result: OradsTreeResult;
  locale: OradsLocaleStrings;
  pathSummary: string[];
  onRestart: () => void;
  onBack: () => void;
  onShare: () => void;
  onBuildReport?: () => void;
  onOpenGuide?: () => void;
  onAskAscites?: () => void;
};

function colorsForToken(token: OradsColorCode) {
  const map: Record<OradsColorCode, { border: string; text: string; bg: string }> = {
    slate: { border: "#94A3B8", text: "#334155", bg: "#F8FAFC" },
    sky: { border: "#38BDF8", text: "#0369A1", bg: "#F0F9FF" },
    emerald: { border: "#10B981", text: "#047857", bg: "#ECFDF5" },
    amber: { border: "#F59E0B", text: "#B45309", bg: "#FFFBEB" },
    orange: { border: "#EA580C", text: "#C2410C", bg: "#FFF7ED" },
    red: { border: "#DC2626", text: "#B91C1C", bg: "#FEF2F2" },
  };
  return map[token];
}

export default function OradsWizardResultPanel({
  result,
  locale,
  pathSummary,
  onRestart,
  onBack,
  onShare,
  onBuildReport,
  onOpenGuide,
  onAskAscites,
}: Props) {
  const c = colorsForToken(result.colorCode);
  const management = locale.t(result.managementKey);
  const rationale = result.rationaleKey ? locale.t(result.rationaleKey) : "";
  const rtl = locale.rtl;

  async function copyReport() {
    const lines = [
      result.category,
      `${locale.t("orads.wizard.rom_label")}: ${result.riskPercent}`,
      ...pathSummary,
      rationale,
      management,
      locale.t("orads.meta.disclaimer"),
    ].filter(Boolean);
    await Clipboard.setStringAsync(lines.join("\n"));
  }

  return (
    <View style={[styles.wrap, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.title, rtl && styles.textRtl]}>{result.category}</Text>
      <Text style={[styles.risk, { color: c.text }, rtl && styles.textRtl]}>
        {locale.t("orads.wizard.rom_label")}: {result.riskPercent}
      </Text>
      {rationale ? <Text style={[styles.body, rtl && styles.textRtl]}>• {rationale}</Text> : null}
      <Text style={[styles.body, rtl && styles.textRtl]}>{management}</Text>

      {pathSummary.length > 0 ? (
        <View style={styles.summaryBox}>
          <Text style={[styles.summaryTitle, rtl && styles.textRtl]}>
            {locale.t("orads.wizard.path_summary")}
          </Text>
          {pathSummary.map((line) => (
            <Text key={line} style={[styles.summaryLine, rtl && styles.textRtl]}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}

      <Text style={[styles.disclaimer, rtl && styles.textRtl]}>{locale.t("orads.meta.disclaimer")}</Text>

      <View style={[styles.row, rtl && styles.rowRtl]}>
        <Pressable style={styles.secondaryBtn} onPress={onBack}>
          <Text style={styles.secondaryText}>{locale.t("orads.wizard.back")}</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={copyReport}>
          <Text style={styles.secondaryText}>{locale.t("orads.wizard.copy")}</Text>
        </Pressable>
      </View>

      <Pressable style={styles.shareBtn} onPress={onShare}>
        <Text style={styles.shareText}>{locale.t("orads.wizard.share_colleagues")}</Text>
        <Text style={styles.shareHint}>{locale.t("orads.wizard.share_todo")}</Text>
      </Pressable>

      {onBuildReport ? (
        <Pressable style={styles.reportBtn} onPress={onBuildReport}>
          <Text style={styles.reportText}>Сформировать протокол</Text>
          <Text style={styles.reportHint}>Structured Reporting · 3 блока</Text>
        </Pressable>
      ) : null}

      {onOpenGuide ? (
        <Pressable style={styles.guideBtn} onPress={onOpenGuide}>
          <Text style={styles.guideText}>O-RADS · руководство (реферат)</Text>
        </Pressable>
      ) : null}

      {onAskAscites ? (
        <Pressable style={styles.modifierBtn} onPress={onAskAscites}>
          <Text style={styles.modifierText}>{locale.t("orads.modifier.ascites.question")}</Text>
        </Pressable>
      ) : null}

      <Pressable style={styles.primaryBtn} onPress={onRestart}>
        <Text style={styles.primaryText}>{locale.t("orads.wizard.restart")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    gap: 6,
    marginTop: 8,
  },
  title: { fontSize: 28, fontWeight: "900", color: "#0f172a" },
  risk: { fontSize: 16, fontWeight: "800" },
  body: { color: "#334155", fontSize: 13, lineHeight: 18 },
  summaryBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.65)",
    gap: 4,
  },
  summaryTitle: { fontWeight: "800", color: "#0f172a", fontSize: 13 },
  summaryLine: { color: "#475569", fontSize: 12, lineHeight: 17 },
  disclaimer: { color: "#64748b", fontSize: 11, marginTop: 4 },
  row: { flexDirection: "row", gap: 8, marginTop: 8 },
  rowRtl: { flexDirection: "row-reverse" },
  secondaryBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  secondaryText: { color: "#334155", fontWeight: "700" },
  shareBtn: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#93C5FD",
    backgroundColor: "#EFF6FF",
    paddingVertical: 10,
    alignItems: "center",
  },
  shareText: { color: "#1D4ED8", fontWeight: "800", fontSize: 14 },
  shareHint: { color: "#64748B", fontSize: 11, marginTop: 2 },
  reportBtn: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#86EFAC",
    backgroundColor: "#F0FDF4",
    paddingVertical: 10,
    alignItems: "center",
  },
  reportText: { color: "#15803D", fontWeight: "800", fontSize: 14 },
  reportHint: { color: "#64748B", fontSize: 11, marginTop: 2 },
  guideBtn: {
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#86EFAC",
    paddingVertical: 10,
    alignItems: "center",
  },
  guideText: { color: "#15803D", fontWeight: "800", fontSize: 13 },
  modifierBtn: {
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    paddingVertical: 10,
    alignItems: "center",
  },
  modifierText: { color: "#B91C1C", fontWeight: "800", fontSize: 13 },
  primaryBtn: {
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "800" },
  textRtl: { textAlign: "right", writingDirection: "rtl" },
});
