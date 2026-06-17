import * as Clipboard from "expo-clipboard";
import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  buildClinicalProtocolText,
  buildProtocolOneLiner,
  DESCRIPTOR_LABELS,
  evaluateTiradsRu,
  type TiradsRuInput,
} from "@repo/thyroid-tirads";
import { SITUATIONAL_CASES } from "@repo/thyroid-tirads/education";

import { exportReportPdf } from "../../../reporting/exportReportPdf";

type Opt<T extends string> = { value: T; label: string };

function defaultRuInput(): TiradsRuInput {
  return {
    composition: "solid",
    echogenicity: "hypoechoic",
    shape: "wider",
    margin: "smooth",
    calcification: "none",
    vascularization: "none",
    cysticWithSolidComponent: false,
    suspiciousLymphNodes: false,
    highRiskPatient: false,
    elastography: { mode: "none" },
  };
}

function ChipRow<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: Opt<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      <View style={styles.chips}>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <Pressable key={opt.value} style={[styles.chip, selected && styles.chipOn]} onPress={() => onChange(opt.value)}>
              <Text style={[styles.chipText, selected && styles.chipTextOn]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function num(v: string): number | undefined {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

type Props = {
  learnMode: boolean;
};

export default function TiradsRuPanel({ learnMode }: Props) {
  const [input, setInput] = useState<TiradsRuInput>(defaultRuInput);
  const [sizeText, setSizeText] = useState("");
  const [location, setLocation] = useState("");

  const fullInput = useMemo(
    () => ({ ...input, largestDiameterMm: num(sizeText) }),
    [input, sizeText],
  );
  const result = useMemo(() => evaluateTiradsRu(fullInput), [fullInput]);
  const protocolLine = useMemo(
    () => buildProtocolOneLiner(result, fullInput.largestDiameterMm),
    [result, fullInput.largestDiameterMm],
  );
  const clinicalText = useMemo(
    () =>
      buildClinicalProtocolText({
        noduleLocation: location || undefined,
        tiradsInput: fullInput,
        result,
      }),
    [fullInput, result, location],
  );

  function patch(partial: Partial<TiradsRuInput>) {
    setInput((prev) => ({ ...prev, ...partial }));
  }

  function applyCase(id: string) {
    const c = SITUATIONAL_CASES.find((x) => x.id === id);
    if (!c) return;
    setInput(c.preset);
    setSizeText(c.preset.largestDiameterMm ? String(c.preset.largestDiameterMm) : "");
  }

  async function exportClinicalPdf() {
    try {
      await exportReportPdf({
        title: "ЩЖ · TI-RADS протокол",
        bodyText: clinicalText,
      });
    } catch {
      Alert.alert("PDF", "Не удалось создать или отправить PDF.");
    }
  }

  const bannerStyle =
    result.category === "1" || result.category === "2"
      ? styles.bannerLow
      : result.category === "3"
        ? styles.bannerMid
        : styles.bannerHigh;

  return (
    <View style={styles.wrap}>
      <Text style={styles.intro}>
        Российская адаптация TI-RADS (Катрич и др., 2023): категории 1–5, пороги ТАБ и TI-MDS. Не смешивать с ACR
        2017.
      </Text>

      {learnMode ? (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Ситуационные задачи</Text>
          <View style={styles.chips}>
            {SITUATIONAL_CASES.map((c) => (
              <Pressable key={c.id} style={styles.chip} onPress={() => applyCase(c.id)}>
                <Text style={styles.chipText}>
                  {c.figureRef} → TR{c.expectedCategory}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <ChipRow
        title="Композиция"
        value={input.composition}
        onChange={(v) => patch({ composition: v })}
        options={Object.entries(DESCRIPTOR_LABELS.composition).map(([value, label]) => ({
          value: value as TiradsRuInput["composition"],
          label: String(label),
        }))}
      />
      <ChipRow
        title="Эхогенность"
        value={input.echogenicity}
        onChange={(v) => patch({ echogenicity: v })}
        options={Object.entries(DESCRIPTOR_LABELS.echogenicity).map(([value, label]) => ({
          value: value as TiradsRuInput["echogenicity"],
          label: String(label),
        }))}
      />
      <ChipRow
        title="Форма"
        value={input.shape}
        onChange={(v) => patch({ shape: v })}
        options={Object.entries(DESCRIPTOR_LABELS.shape).map(([value, label]) => ({
          value: value as TiradsRuInput["shape"],
          label: String(label),
        }))}
      />
      <ChipRow
        title="Контур"
        value={input.margin}
        onChange={(v) => patch({ margin: v })}
        options={Object.entries(DESCRIPTOR_LABELS.margin).map(([value, label]) => ({
          value: value as TiradsRuInput["margin"],
          label: String(label),
        }))}
      />
      <ChipRow
        title="Кальцинаты"
        value={input.calcification}
        onChange={(v) => patch({ calcification: v })}
        options={Object.entries(DESCRIPTOR_LABELS.calcification).map(([value, label]) => ({
          value: value as TiradsRuInput["calcification"],
          label: String(label),
        }))}
      />

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Размер (мм)</Text>
        <TextInput
          style={styles.input}
          placeholder="12"
          keyboardType="decimal-pad"
          value={sizeText}
          onChangeText={setSizeText}
        />
        <TextInput
          style={[styles.input, { marginTop: 8 }]}
          placeholder="Локализация (доля, сегмент)"
          value={location}
          onChangeText={setLocation}
        />
      </View>

      <View style={styles.chips}>
        <Pressable
          style={[styles.chip, input.cysticWithSolidComponent && styles.chipOn]}
          onPress={() => patch({ cysticWithSolidComponent: !input.cysticWithSolidComponent })}
        >
          <Text style={styles.chipText}>Кистозно-солидный</Text>
        </Pressable>
        <Pressable
          style={[styles.chip, input.highRiskPatient && styles.chipOn]}
          onPress={() => patch({ highRiskPatient: !input.highRiskPatient })}
        >
          <Text style={styles.chipText}>Группа риска</Text>
        </Pressable>
        <Pressable
          style={[styles.chip, input.suspiciousLymphNodes && styles.chipOn]}
          onPress={() => patch({ suspiciousLymphNodes: !input.suspiciousLymphNodes })}
        >
          <Text style={styles.chipText}>Подозр. ЛУ</Text>
        </Pressable>
      </View>

      <View style={[styles.resultCard, bannerStyle]}>
        <Text style={styles.resultCat}>{result.categoryLabel}</Text>
        <Text style={styles.resultBody}>Риск: {result.malignancyRiskPercent}</Text>
        <Text style={styles.resultImp}>{result.fnaRationale}</Text>
        <Text style={styles.resultBody}>{result.followUp}</Text>
        {result.tiMdsHint ? <Text style={styles.resultBody}>{result.tiMdsHint}</Text> : null}
        <Text style={styles.protocolLine}>{protocolLine}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.secondary}
          onPress={() => {
            setInput(defaultRuInput());
            setSizeText("");
            setLocation("");
          }}
        >
          <Text style={styles.secondaryText}>Сброс</Text>
        </Pressable>
        <Pressable style={styles.primary} onPress={() => void Clipboard.setStringAsync(clinicalText)}>
          <Text style={styles.primaryText}>Копировать протокол</Text>
        </Pressable>
        <Pressable style={styles.pdfBtn} onPress={() => void exportClinicalPdf()}>
          <Text style={styles.primaryText}>PDF протокол</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  intro: { fontSize: 13, color: "#64748b", lineHeight: 19, marginBottom: 12 },
  block: { marginBottom: 16 },
  blockTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  chipOn: { borderColor: "#0284c7", backgroundColor: "#e0f2fe" },
  chipText: { fontSize: 11, color: "#0f172a", fontWeight: "600" },
  chipTextOn: { color: "#0369a1" },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#fff",
    fontSize: 15,
  },
  resultCard: {
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    gap: 6,
  },
  bannerLow: { borderColor: "#6ee7b7", backgroundColor: "#ecfdf5" },
  bannerMid: { borderColor: "#fcd34d", backgroundColor: "#fffbeb" },
  bannerHigh: { borderColor: "#fda4af", backgroundColor: "#fff1f2" },
  resultCat: { fontSize: 17, fontWeight: "900", color: "#0f172a" },
  resultBody: { fontSize: 13, color: "#475569", lineHeight: 18 },
  resultImp: { fontSize: 14, fontWeight: "700", color: "#0f172a", lineHeight: 20 },
  protocolLine: { fontSize: 12, color: "#334155", marginTop: 4 },
  actions: { marginTop: 12, gap: 10, marginBottom: 8 },
  primary: {
    backgroundColor: "#0284c7",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  pdfBtn: {
    backgroundColor: "#1d4ed8",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  secondary: {
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
  },
  secondaryText: { color: "#0f172a", fontWeight: "700", fontSize: 14 },
});
