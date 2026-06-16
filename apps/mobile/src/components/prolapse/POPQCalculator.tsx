import * as Clipboard from "expo-clipboard";
import { useMemo, useState, type ReactNode } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import {
  NORMAL_ANATOMY,
  POPQ_PRESETS,
  buildProtocolLine,
  compartmentLabel,
  computePopQStage,
  inputToFieldStrings,
  leadingCompartment,
  leadingPointKey,
  stageLabel,
  type PopQInput,
} from "@repo/medical-calculations/popq";

import type { POPQPointKey } from "../../gynecology/prolapseLogic";
import { popqStageLabel } from "../../gynecology/prolapseStageLabel";
import SelectChip from "../../features/oradsPro/components/SelectChip";
import i18n from "../../i18n";
import { theme } from "../../theme";
import PopQDiagram from "./PopQDiagram";
import PopQGrid from "./PopQGrid";

type Props = {
  values: Record<POPQPointKey, string>;
  uterusPresent: boolean;
  onChange: (k: POPQPointKey, v: string) => void;
  onUterusPresentChange: (v: boolean) => void;
  onBatchChange: (values: Record<POPQPointKey, string>, uterusPresent: boolean) => void;
};

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function POPQCalculator({
  values,
  uterusPresent,
  onChange,
  onUterusPresentChange,
  onBatchChange,
}: Props) {
  const [showNormal, setShowNormal] = useState(false);
  const [showLabels, setShowLabels] = useState(true);

  const input = useMemo<PopQInput>(() => {
    const parsed: PopQInput = {};
    (Object.keys(values) as POPQPointKey[]).forEach((k) => {
      const raw = values[k]?.trim().replace(",", ".");
      if (!raw) return;
      const n = Number(raw);
      if (Number.isFinite(n)) parsed[k] = n;
    });
    if (!uterusPresent) delete parsed.D;
    return parsed;
  }, [values, uterusPresent]);

  const stage = useMemo(() => computePopQStage(input), [input]);
  const lead = useMemo(() => leadingCompartment(input, uterusPresent), [input, uterusPresent]);
  const leadPoint = useMemo(() => leadingPointKey(input, uterusPresent), [input, uterusPresent]);

  const protocolLine = useMemo(
    () => buildProtocolLine({ stageKey: stage.stageKey, leading: lead, tvl: input.TVL }),
    [stage.stageKey, lead, input.TVL],
  );

  const stageText = popqStageLabel(stage.stageKey);
  const stageBannerStyle =
    stage.stageKey === "na"
      ? styles.bannerNa
      : stage.stageKey === "0" || stage.stageKey === "1"
        ? styles.bannerLow
        : stage.stageKey === "2"
          ? styles.bannerMid
          : styles.bannerHigh;

  function updateField(key: POPQPointKey, value: string) {
    if (!uterusPresent && key === "D") return;
    onChange(key, value);
    setShowNormal(false);
  }

  function applyPreset(presetId: string) {
    const preset = POPQ_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    onBatchChange(inputToFieldStrings(preset.values), preset.uterusPresent);
    setShowNormal(false);
  }

  async function copyProtocol() {
    if (stage.stageKey === "na") {
      Alert.alert(i18n.t("prolapse_history_empty_title"), i18n.t("prolapse_popq_enter_points"));
      return;
    }
    await Clipboard.setStringAsync(protocolLine);
    Alert.alert(i18n.t("success"), i18n.t("prolapse_popq_protocol_copied"));
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.sub}>{i18n.t("prolapse_popq_subtitle")}</Text>

      <SectionCard title={i18n.t("prolapse_popq_presets_title")}>
        <View style={styles.chipWrap}>
          {POPQ_PRESETS.map((p) => (
            <SelectChip key={p.id} label={p.label} selected={false} onPress={() => applyPreset(p.id)} />
          ))}
        </View>
      </SectionCard>

      <SectionCard title={i18n.t("prolapse_popq_context_title")}>
        <View style={styles.chipWrap}>
          <SelectChip
            label={i18n.t("prolapse_popq_uterus_present")}
            selected={uterusPresent}
            onPress={() => onUterusPresentChange(true)}
          />
          <SelectChip
            label={i18n.t("prolapse_popq_hysterectomy")}
            selected={!uterusPresent}
            onPress={() => {
              onUterusPresentChange(false);
              onChange("D", "");
            }}
          />
        </View>
      </SectionCard>

      <SectionCard title={i18n.t("prolapse_popq_diagram_title")}>
        <View style={styles.chipWrap}>
          <SelectChip
            label={showNormal ? i18n.t("prolapse_popq_show_normal") : i18n.t("prolapse_popq_show_patient")}
            selected={showNormal}
            onPress={() => setShowNormal((v) => !v)}
          />
          <SelectChip
            label={showLabels ? i18n.t("prolapse_popq_labels_on") : i18n.t("prolapse_popq_labels_off")}
            selected={showLabels}
            onPress={() => setShowLabels((v) => !v)}
          />
        </View>
        <View style={styles.diagramCard}>
          <PopQDiagram
            input={input}
            uterusPresent={uterusPresent}
            showNormal={showNormal}
            normalInput={NORMAL_ANATOMY}
            showLabels={showLabels}
            leadingPoint={leadPoint}
            normalTitle={i18n.t("prolapse_popq_normal_anatomy")}
            patientTitle={i18n.t("prolapse_popq_your_measurements")}
            axisHint={i18n.t("prolapse_popq_axis_hint")}
            disclaimer={i18n.t("prolapse_popq_diagram_disclaimer")}
          />
        </View>
      </SectionCard>

      <SectionCard title={i18n.t("prolapse_popq_grid_title")}>
        <PopQGrid
          values={values}
          uterusPresent={uterusPresent}
          onChange={updateField}
          dNaLabel={i18n.t("prolapse_popq_d_na")}
          pickValueLabel={i18n.t("prolapse_popq_pick_value")}
        />
      </SectionCard>

      <View style={[styles.resultBanner, stageBannerStyle]}>
        <Text style={styles.resultStage}>{stageText !== "—" ? stageLabel(stage.stageKey) : stageText}</Text>
        <Text style={styles.resultLead}>
          {lead
            ? `${compartmentLabel(lead.key)} · ${i18n.t("prolapse_popq_leading")} ${lead.value} ${i18n.t("prolapse_cm")}`
            : i18n.t("prolapse_popq_leading_unknown")}
        </Text>
        <Text style={styles.resultProtocol} numberOfLines={3}>
          {protocolLine}
        </Text>
        <Pressable style={({ pressed }) => [styles.copyBtn, pressed && styles.pressed]} onPress={() => void copyProtocol()}>
          <Text style={styles.copyBtnText}>{i18n.t("prolapse_popq_copy_protocol")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.spacing.md },
  sub: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 20 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: theme.colors.textSecondary, letterSpacing: 0.3 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  diagramCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: "#fed7aa",
    backgroundColor: "#fff7ed",
    overflow: "hidden",
    paddingTop: 4,
  },
  resultBanner: {
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    padding: theme.spacing.md,
    gap: 6,
  },
  bannerNa: { borderColor: "#cbd5e1", backgroundColor: "#f8fafc" },
  bannerLow: { borderColor: "#6ee7b7", backgroundColor: "#ecfdf5" },
  bannerMid: { borderColor: "#fcd34d", backgroundColor: "#fffbeb" },
  bannerHigh: { borderColor: "#fda4af", backgroundColor: "#fff1f2" },
  resultStage: { fontSize: 22, fontWeight: "900", color: theme.colors.text },
  resultLead: { fontSize: 14, fontWeight: "700", color: theme.colors.text },
  resultProtocol: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 17 },
  copyBtn: {
    alignSelf: "flex-start",
    marginTop: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  copyBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  pressed: { opacity: 0.9 },
});
