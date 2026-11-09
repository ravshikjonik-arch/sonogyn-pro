import * as Clipboard from "expo-clipboard";
import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import {
  ACR_TIRADS_SOURCE,
  COMPOSITION_OPTIONS,
  ECHOGENIC_FOCI_OPTIONS,
  ECHOGENICITY_OPTIONS,
  EU_CATEGORY_META,
  EU_COMPOSITION_OPTIONS,
  EU_ECHOGENICITY_OPTIONS,
  EU_ETE_OPTIONS,
  EU_FNA_THRESHOLD_MM,
  EU_MARGINS_OPTIONS,
  EU_MICROCALCIFICATIONS_OPTIONS,
  EU_SHAPE_OPTIONS,
  EU_SOURCES,
  MARGIN_OPTIONS,
  SHAPE_OPTIONS,
  TIRADS_CATEGORIES,
  evaluateThyroidStudy,
  generateThyroidReport,
  type AcrStrictResult,
  type EuPolicyProfile,
  type EuTiradsResult,
  type ThyroidNodule,
  type ThyroidNoduleDimensionsMm,
  type ThyroidNoduleLocation,
  type ThyroidStudyInput,
  type TiradsEchogenicFoci,
} from "@repo/tirads-acr";

import { branding } from "../../../config/branding";
import { theme } from "../../../theme";

export type ThyroidModuleTab = "eu" | "acr" | "compare" | "reference";

type Opt<T extends string> = { value: T; labelRu: string };

const LOCATIONS: Opt<ThyroidNoduleLocation>[] = [
  { value: "right_lobe", labelRu: "Правая доля" },
  { value: "left_lobe", labelRu: "Левая доля" },
  { value: "isthmus", labelRu: "Перешеек" },
];
const DIMENSIONS: { key: keyof ThyroidNoduleDimensionsMm; labelRu: string }[] = [
  { key: "longitudinal", labelRu: "Продольный" },
  { key: "anteroposterior", labelRu: "Переднезадний" },
  { key: "transverse", labelRu: "Поперечный" },
];
const LYMPH: Opt<NonNullable<ThyroidStudyInput["lymphNodes"]>>[] = [
  { value: "not_assessed", labelRu: "Не оценивались" },
  { value: "normal", labelRu: "Без особенностей" },
  { value: "indeterminate", labelRu: "Неопределённые" },
  { value: "suspicious", labelRu: "Подозрительные" },
];
const FIELD_RU: Record<string, string> = {
  composition: "состав",
  echogenicity: "эхогенность",
  shape: "форма",
  margins: "контуры",
  margin: "контуры",
  microcalcifications: "микрокальцинаты",
  echogenicFoci: "эхогенные включения",
};
const FNA_RU = {
  indicated: "ТАБ показана",
  consider: "ТАБ рассмотреть",
  not_indicated: "ТАБ не показана",
  undetermined: "Показания к ТАБ не определены",
} as const;

const clean = (s: string) => s.replace(/\s*\([^)]*\)/g, "").trim();

function Chips<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: Opt<T>[];
  value: T | undefined;
  onChange: (v: T | undefined) => void;
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      <View style={styles.chips}>
        {options.map((o) => {
          const on = value === o.value;
          return (
            <Pressable
              key={o.value}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => onChange(on ? undefined : o.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{clean(o.labelRu)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Pending({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardKicker}>{title}</Text>
      <Text style={styles.pending}>{text}</Text>
    </View>
  );
}

function ManagementBlock({ fna, reason, followUp, source }: { fna: keyof typeof FNA_RU; reason: string; followUp: string | null; source: string }) {
  return (
    <>
      <View style={[styles.fnaBox, fna === "indicated" && styles.fnaOn, fna === "consider" && styles.fnaConsider]}>
        <Text style={styles.fnaTitle}>{FNA_RU[fna]}</Text>
        <Text style={styles.fnaReason}>{reason}</Text>
      </View>
      {followUp ? <Text style={styles.body}>Наблюдение: {followUp}</Text> : null}
      <Text style={styles.source}>Источник: {source}</Text>
    </>
  );
}

function Warnings({ items }: { items: string[] }) {
  return (
    <>
      {items.map((w) => (
        <Text key={w} style={styles.warning}>
          ⚠ {w}
        </Text>
      ))}
    </>
  );
}

function EuCard({ result }: { result: EuTiradsResult | null }) {
  const title = "EU-TIRADS · результат";
  if (!result) return <Pending title={title} text="Выберите состав узла." />;
  if (result.status === "invalid") return <Pending title={title} text={result.errors.map((e) => e.messageRu).join(" ")} />;
  if (result.status === "incomplete") {
    return <Pending title={title} text={`Не хватает данных: ${result.missing.map((m) => FIELD_RU[m] ?? m).join(", ")}.`} />;
  }
  const [code, name] = result.categoryLabelRu.split(" · ");
  return (
    <View style={styles.card}>
      <Text style={styles.cardKicker}>{title}</Text>
      <Text style={styles.category}>{code}</Text>
      <Text style={styles.body}>
        {name} · риск {result.malignancyRiskRu}
      </Text>
      {result.rationaleRu.map((r) => (
        <Text key={r} style={styles.rationale}>
          • {r}
        </Text>
      ))}
      <ManagementBlock
        fna={result.management.fna}
        reason={result.management.fnaReasonRu}
        followUp={result.management.followUpRu}
        source={result.management.source.citation}
      />
      <Warnings items={result.warnings.map((w) => w.messageRu)} />
    </View>
  );
}

function AcrCard({ result }: { result: AcrStrictResult | null }) {
  const title = "ACR TI-RADS · результат";
  if (!result) return <Pending title={title} text="Выберите состав узла." />;
  if (result.status === "invalid") return <Pending title={title} text={result.errors.map((e) => e.messageRu).join(" ")} />;
  if (result.status === "incomplete") {
    return <Pending title={title} text={`Не хватает данных: ${result.missing.map((m) => FIELD_RU[m] ?? m).join(", ")}.`} />;
  }
  const r = result.result;
  return (
    <View style={styles.card}>
      <Text style={styles.cardKicker}>{title}</Text>
      <Text style={styles.category}>
        {r.category} · {r.totalPoints} б.
      </Text>
      <Text style={styles.body}>
        {r.categoryLabel} · риск {r.malignancyRisk}
      </Text>
      <ManagementBlock
        fna={result.management.fna}
        reason={result.management.fnaReasonRu}
        followUp={result.management.followUpRu}
        source={result.source.citation}
      />
      <Warnings items={result.warnings.map((w) => w.messageRu)} />
    </View>
  );
}

function Reference() {
  return (
    <View style={styles.card}>
      <Text style={styles.cardKicker}>EU-TIRADS / ETA 2023</Text>
      {([1, 2, 3, 4, 5] as const).map((c) => (
        <Text key={c} style={styles.body}>
          {EU_CATEGORY_META[c].labelRu} — риск {EU_CATEGORY_META[c].malignancyRiskRu}
        </Text>
      ))}
      <Text style={styles.body}>
        ТАБ: EU-TIRADS 3 — более {EU_FNA_THRESHOLD_MM[3]} мм, 4 — более {EU_FNA_THRESHOLD_MM[4]} мм, 5 — более {EU_FNA_THRESHOLD_MM[5]} мм.
      </Text>
      <Text style={styles.source}>{EU_SOURCES.RU_KR_2024.citation}</Text>
      <Text style={styles.source}>{EU_SOURCES.ETA_2023.citation}</Text>
      <Text style={[styles.cardKicker, { marginTop: 16 }]}>ACR TI-RADS 2017</Text>
      {TIRADS_CATEGORIES.map((c) => (
        <Text key={c.code} style={styles.body}>
          {c.label} — {c.pointsRange}
        </Text>
      ))}
      <Text style={styles.body}>FNA: TR3 ≥25 мм, TR4 ≥15 мм, TR5 ≥10 мм. Наблюдение: TR3 ≥15, TR4 ≥10, TR5 ≥5 мм.</Text>
      <Text style={styles.source}>{ACR_TIRADS_SOURCE.citation}</Text>
    </View>
  );
}

let seq = 1;
const newNodule = (): ThyroidNodule => ({ id: `m-nodule-${seq++}` });

export default function ThyroidModulePanel({ tab }: { tab: ThyroidModuleTab }) {
  const [study, setStudy] = useState<ThyroidStudyInput>(() => ({ nodules: [newNodule()], euProfile: "RU_KR_2024", lymphNodes: "not_assessed" }));
  const [activeId, setActiveId] = useState(study.nodules[0].id);
  const [dimText, setDimText] = useState<Record<string, Partial<Record<keyof ThyroidNoduleDimensionsMm, string>>>>({});

  const evaluation = useMemo(() => evaluateThyroidStudy(study), [study]);
  const system = tab === "acr" ? "acr" : tab === "compare" ? "both" : "eu";
  const report = useMemo(() => generateThyroidReport(study, evaluation, system), [study, evaluation, system]);

  if (tab === "reference") return <Reference />;

  const active = study.nodules.find((n) => n.id === activeId) ?? study.nodules[0];
  const row = evaluation.nodules.find((r) => r.noduleId === active.id) ?? null;
  const update = (next: ThyroidNodule) => setStudy((s) => ({ ...s, nodules: s.nodules.map((n) => (n.id === next.id ? next : n)) }));
  const eu = active.eu ?? {};
  const acr = active.acr ?? {};
  const setEu = (patch: Partial<NonNullable<ThyroidNodule["eu"]>>) => update({ ...active, eu: { ...eu, ...patch } });
  const setAcr = (patch: Partial<NonNullable<ThyroidNodule["acr"]>>) => update({ ...active, acr: { ...acr, ...patch } });
  const euSolid = eu.composition === "mixed" || eu.composition === "solid";
  const acrFull = acr.composition !== undefined && acr.composition !== "spongiform" && acr.composition !== "no_nodule";
  const foci = acr.echogenicFoci ?? [];
  const toggleFocus = (f: TiradsEchogenicFoci) => {
    if (f === "none_or_comet_tail") return setAcr({ echogenicFoci: foci.includes(f) ? [] : [f] });
    const rest = foci.filter((x) => x !== "none_or_comet_tail");
    setAcr({ echogenicFoci: rest.includes(f) ? rest.filter((x) => x !== f) : [...rest, f] });
  };
  const highest = tab === "acr" ? evaluation.highestAcr : evaluation.highestEu;

  const fullText = [report.descriptionRu, "", "Заключение:", report.conclusionRu, report.tacticsRu ? `\nТактика:\n${report.tacticsRu}` : "", "", report.disclaimerRu].join("\n");

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardKicker}>Узлы</Text>
        <View style={styles.chips}>
          {study.nodules.map((n, i) => {
            const on = n.id === active.id;
            return (
              <Pressable key={n.id} style={[styles.chip, on && styles.chipOn]} onPress={() => setActiveId(n.id)} accessibilityRole="button" accessibilityState={{ selected: on }}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>
                  Узел {i + 1}
                  {study.nodules.length > 1 && highest === n.id ? " · наибольший риск" : ""}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            style={styles.chip}
            onPress={() => {
              const n = newNodule();
              setStudy((s) => ({ ...s, nodules: [...s.nodules, n] }));
              setActiveId(n.id);
            }}
            accessibilityRole="button"
          >
            <Text style={styles.chipText}>+ Узел</Text>
          </Pressable>
        </View>
        {tab !== "acr" ? (
          <Chips<EuPolicyProfile>
            title="Профиль EU-TIRADS"
            options={[
              { value: "RU_KR_2024", labelRu: "КР 2024 (РФ)" },
              { value: "ETA_2023", labelRu: "ETA 2023" },
            ]}
            value={study.euProfile}
            onChange={(v) => v && setStudy((s) => ({ ...s, euProfile: v }))}
          />
        ) : null}
        <Chips title="Регионарные лимфоузлы" options={LYMPH} value={study.lymphNodes} onChange={(v) => v && setStudy((s) => ({ ...s, lymphNodes: v }))} />
        <View style={styles.switchRow}>
          <Text style={styles.body}>Пациент младше 18 лет</Text>
          <Switch value={Boolean(study.isPediatric)} onValueChange={(v) => setStudy((s) => ({ ...s, isPediatric: v || undefined }))} />
        </View>
      </View>

      <Chips title="Локализация" options={LOCATIONS} value={active.location} onChange={(location) => update({ ...active, location })} />
      <View style={styles.block}>
        <Text style={styles.blockTitle}>Размеры, мм</Text>
        <View style={styles.dimRow}>
          {DIMENSIONS.map(({ key, labelRu }) => (
            <View key={key} style={styles.dimCell}>
              <Text style={styles.dimLabel}>{labelRu}</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                accessibilityLabel={`${labelRu} размер, мм`}
                value={dimText[active.id]?.[key] ?? (active.dimensionsMm?.[key] !== undefined ? String(active.dimensionsMm[key]) : "")}
                onChangeText={(t) => {
                  setDimText((d) => ({ ...d, [active.id]: { ...d[active.id], [key]: t } }));
                  const n = Number(t.replace(",", "."));
                  update({ ...active, dimensionsMm: { ...active.dimensionsMm, [key]: t.trim() && Number.isFinite(n) ? n : undefined } });
                }}
              />
            </View>
          ))}
        </View>
      </View>

      {tab !== "acr" ? (
        <>
          <Chips title="EU-TIRADS · состав" options={EU_COMPOSITION_OPTIONS} value={eu.composition} onChange={(composition) => setEu({ composition })} />
          {euSolid ? (
            <>
              <Chips title="Эхогенность солидного компонента" options={EU_ECHOGENICITY_OPTIONS} value={eu.echogenicity} onChange={(echogenicity) => setEu({ echogenicity })} />
              <Chips title="Форма" options={EU_SHAPE_OPTIONS} value={eu.shape} onChange={(shape) => setEu({ shape })} />
              <Chips title="Контуры" options={EU_MARGINS_OPTIONS} value={eu.margins} onChange={(margins) => setEu({ margins })} />
              <Chips title="Микрокальцинаты" options={EU_MICROCALCIFICATIONS_OPTIONS} value={eu.microcalcifications} onChange={(microcalcifications) => setEu({ microcalcifications })} />
            </>
          ) : null}
          {eu.composition && eu.composition !== "no_nodule" ? (
            <Chips title="Экстратиреоидное распространение" options={EU_ETE_OPTIONS} value={eu.extrathyroidalExtension} onChange={(extrathyroidalExtension) => setEu({ extrathyroidalExtension })} />
          ) : null}
          <EuCard result={row?.eu ?? null} />
        </>
      ) : null}

      {tab !== "eu" ? (
        <>
          <Chips title="ACR · состав" options={COMPOSITION_OPTIONS} value={acr.composition} onChange={(composition) => setAcr({ composition })} />
          {acrFull ? (
            <>
              <Chips title="Эхогенность" options={ECHOGENICITY_OPTIONS} value={acr.echogenicity} onChange={(echogenicity) => setAcr({ echogenicity })} />
              <Chips title="Форма" options={SHAPE_OPTIONS} value={acr.shape} onChange={(shape) => setAcr({ shape })} />
              <Chips title="Контуры" options={MARGIN_OPTIONS} value={acr.margin} onChange={(margin) => setAcr({ margin })} />
              <View style={styles.block}>
                <Text style={styles.blockTitle}>Эхогенные включения · все, что есть</Text>
                <View style={styles.chips}>
                  {ECHOGENIC_FOCI_OPTIONS.map((o) => {
                    const on = foci.includes(o.value);
                    return (
                      <Pressable key={o.value} style={[styles.chip, on && styles.chipOn]} onPress={() => toggleFocus(o.value)} accessibilityRole="button" accessibilityState={{ selected: on }}>
                        <Text style={[styles.chipText, on && styles.chipTextOn]}>{clean(o.labelRu)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </>
          ) : null}
          <AcrCard result={row?.acr ?? null} />
        </>
      ) : null}

      {tab === "compare" ? (
        <View style={styles.card}>
          <Text style={styles.cardKicker}>Сравнение (системы независимы)</Text>
          {evaluation.comparison.map((c, i) => (
            <Text key={c.noduleId} style={styles.body}>
              Узел {i + 1}: {c.euCategory ? `EU-TIRADS ${c.euCategory}` : "EU —"} / {c.acrCategory ?? "ACR —"}
              {c.noteRu ? `\n⚠ ${c.noteRu}` : ""}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardKicker}>Описание и заключение</Text>
        <Text style={styles.body}>{report.descriptionRu}</Text>
        <Text style={[styles.body, styles.bold]}>{report.conclusionRu}</Text>
        {report.tacticsRu ? <Text style={styles.body}>{report.tacticsRu}</Text> : null}
        <Text style={styles.source}>{report.disclaimerRu}</Text>
        <Pressable
          style={styles.primary}
          onPress={() => void Clipboard.setStringAsync(fullText).then(() => Alert.alert("Скопировано", "Заключение в буфере обмена."))}
          accessibilityRole="button"
        >
          <Text style={styles.primaryText}>Скопировать заключение</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: 16 },
  blockTitle: { fontSize: 11, fontWeight: "800", color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#fff", maxWidth: "100%" },
  chipOn: { borderColor: "#0d9488", backgroundColor: "#ecfdf5" },
  chipText: { fontSize: 12, color: branding.colors.text, fontWeight: "600" },
  chipTextOn: { color: "#0f766e" },
  dimRow: { flexDirection: "row", gap: 8 },
  dimCell: { flex: 1 },
  dimLabel: { fontSize: 11, color: branding.colors.textSecondary, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: "#fff", fontSize: 16 },
  card: { marginBottom: 16, padding: 16, borderRadius: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8ecf1", gap: 6, ...theme.shadow.card },
  cardKicker: { fontSize: 11, fontWeight: "800", color: "#94a3b8", letterSpacing: 0.8, textTransform: "uppercase" },
  pending: { fontSize: 14, color: branding.colors.textSecondary, lineHeight: 20 },
  category: { fontSize: 24, fontWeight: "900", color: branding.colors.text },
  body: { fontSize: 14, color: branding.colors.text, lineHeight: 20 },
  bold: { fontWeight: "700" },
  rationale: { fontSize: 12, color: branding.colors.textSecondary, lineHeight: 18 },
  fnaBox: { marginTop: 6, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: "#cbd5e1", backgroundColor: "#f8fafc" },
  fnaOn: { borderColor: "#fda4af", backgroundColor: "#fff1f2" },
  fnaConsider: { borderColor: "#fcd34d", backgroundColor: "#fffbeb" },
  fnaTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
  fnaReason: { fontSize: 12, color: "#334155", marginTop: 2, lineHeight: 17 },
  source: { fontSize: 11, color: "#64748b", lineHeight: 15 },
  warning: { fontSize: 12, color: "#92400e", backgroundColor: "#fffbeb", borderRadius: 10, padding: 8, lineHeight: 17 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  primary: { marginTop: 10, backgroundColor: "#0d9488", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
