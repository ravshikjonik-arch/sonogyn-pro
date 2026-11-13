import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { formatMeasurementRu, parseMeasurementMm } from "@repo/medical-calculations";
import {
  DOPPLER_OPTIONS,
  LN_RADS_VERSION,
  defaultLnRadsInput,
  enrichEngineResult,
  formatLnAxesRu,
  formatLnRatio,
  generateStructuredReport,
  lnRadsOptions,
  type LnRadsInput,
} from "@repo/ln-rads-us";
import type { PageType } from "../../navigationTypes";
import {
  BREAST_RISK_TOOL_VERSION,
  evaluateBreastRiskEducation,
} from "../breastRiskTool";
import { GynBackToHub } from "../components/GynBackToHub";
import { gynRouterStyles as s } from "../gynRouterStyles";

export function ScreenBreastRisk({ setPage }: { setPage: (p: PageType) => void }) {
  const [age, setAge] = useState("45");
  const [m12, setM12] = useState(false);
  const [birth30, setBirth30] = useState(false);
  const [rel, setRel] = useState(false);
  const [bx, setBx] = useState(false);
  const res = useMemo(() => {
    const a = parseInt(age, 10);
    if (!Number.isFinite(a) || a < 18 || a > 100) return null;
    return evaluateBreastRiskEducation({
      age: a,
      menarcheBefore12: m12,
      firstBirthAfter30OrNulliparous: birth30,
      firstDegreeBcOrOvary: rel,
      priorBreastBiopsyBenign: bx,
    });
  }, [age, m12, birth30, rel, bx]);
  return (
    <View style={s.card}>
      <GynBackToHub onPress={() => setPage("gyn_hub")} />
      <Text style={s.title}>Риск рака молочной железы</Text>
      <Text style={s.meta}>{BREAST_RISK_TOOL_VERSION}</Text>
      <Text style={s.label}>Возраст</Text>
      <TextInput value={age} onChangeText={setAge} keyboardType="number-pad" style={s.input} />
      <Text style={s.label}>Факторы (да/нет)</Text>
      {(
        [
          ["Менархе раньше 12 лет", m12, setM12],
          ["Первая беременность после 30 или nullipara", birth30, setBirth30],
          ["Родственник I степени РМЖ/яичники", rel, setRel],
          ["Была биопсия МЖ (доброкач.)", bx, setBx],
        ] as const
      ).map(([label, val, set]) => (
        <Pressable key={label} style={s.backBtn} onPress={() => set(!val)}>
          <Text style={s.backBtnText}>
            {label}: {val ? "да" : "нет"}
          </Text>
        </Pressable>
      ))}
      {res ? <Text style={s.result}>{res.text.join("\n\n")}</Text> : <Text style={s.result}>Введите возраст 18–100.</Text>}
    </View>
  );
}

type LnOption = { readonly value: string; readonly label: string };

function LnChips<K extends keyof LnRadsInput>({
  title,
  field,
  options,
  input,
  setField,
}: {
  title: string;
  field: K;
  options: readonly LnOption[];
  input: LnRadsInput;
  setField: (key: K, value: LnRadsInput[K]) => void;
}) {
  return (
    <>
      <Text style={s.label}>{title}</Text>
      <View style={s.rowWrap}>
        {options.map((o) => {
          const selected = (input[field] ?? "not_assessed") === o.value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[s.backBtn, selected && { backgroundColor: "#ccfbf1" }]}
              onPress={() => setField(field, o.value as LnRadsInput[K])}
            >
              <Text style={s.backBtnText}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

function LnMmInput({ label, value, onChange }: { label: string; value: number | undefined; onChange: (v: number | undefined) => void }) {
  const [text, setText] = useState(typeof value === "number" && value > 0 ? formatMeasurementRu(value) : "");
  return (
    <TextInput
      value={text}
      accessibilityLabel={`${label}, мм`}
      onChangeText={(t) => {
        setText(t);
        onChange(t.trim() ? parseMeasurementMm(t) : undefined);
      }}
      keyboardType="decimal-pad"
      placeholder={label}
      style={[s.input, { width: 140 }]}
    />
  );
}

/** Same engine, options and report as the web LN-RADS wizard (@repo/ln-rads-us). */
export function ScreenLnRads({ setPage }: { setPage: (p: PageType) => void }) {
  const [input, setInput] = useState<LnRadsInput>(() => defaultLnRadsInput());
  const setField = <K extends keyof LnRadsInput>(key: K, value: LnRadsInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const sizeOk = input.longAxisMm > 0 && input.shortAxisMm > 0;
  const engine = useMemo(() => (sizeOk ? enrichEngineResult(input) : null), [input, sizeOk]);
  const report = useMemo(() => (sizeOk ? generateStructuredReport(input, { level: "standard" }) : null), [input, sizeOk]);

  return (
    <View style={s.card}>
      <GynBackToHub onPress={() => setPage("gyn_hub")} />
      <Text style={s.title}>LN-RADS — оценка лимфоузлов</Text>
      <Text style={s.meta}>{LN_RADS_VERSION}</Text>

      <LnChips title="Регион" field="region" options={lnRadsOptions.region} input={input} setField={setField} />

      <Text style={s.label}>Размеры, мм (длинная и короткая ось)</Text>
      <View style={s.rowWrap}>
        <LnMmInput label="Длинная ось" value={input.longAxisMm} onChange={(v) => setField("longAxisMm", v ?? 0)} />
        <LnMmInput label="Короткая ось" value={input.shortAxisMm} onChange={(v) => setField("shortAxisMm", v ?? 0)} />
      </View>
      <Text style={s.meta}>Размеры: {formatLnAxesRu(input.longAxisMm, input.shortAxisMm)}</Text>
      <Text style={s.label}>Толщина коры, мм (необязательно)</Text>
      <LnMmInput label="Кора" value={input.cortexThicknessMm} onChange={(v) => setField("cortexThicknessMm", v)} />

      <LnChips title="Форма" field="shape" options={lnRadsOptions.shape} input={input} setField={setField} />
      <LnChips title="Капсула" field="capsule" options={lnRadsOptions.capsule} input={input} setField={setField} />
      <LnChips title="Ворота (хилус)" field="hilum" options={lnRadsOptions.hilum} input={input} setField={setField} />
      <LnChips title="Кора" field="cortex" options={lnRadsOptions.cortex} input={input} setField={setField} />
      <LnChips title="Эхогенность" field="echogenicity" options={lnRadsOptions.echogenicity} input={input} setField={setField} />
      <LnChips title="Архитектура" field="architecture" options={lnRadsOptions.architecture} input={input} setField={setField} />
      <LnChips title="Кровоток (ЦДК)" field="vascularity" options={DOPPLER_OPTIONS} input={input} setField={setField} />
      <LnChips title="Кальцинаты" field="calcifications" options={lnRadsOptions.calcifications} input={input} setField={setField} />
      <LnChips title="Некроз" field="necrosis" options={lnRadsOptions.necrosis} input={input} setField={setField} />
      <LnChips title="Кистозная дегенерация" field="cysticDegeneration" options={lnRadsOptions.cysticDegeneration} input={input} setField={setField} />
      <LnChips title="Экстракапсулярное распространение" field="extracapsularExtension" options={lnRadsOptions.extracapsularExtension} input={input} setField={setField} />
      <LnChips title="Конгломераты (matting)" field="matting" options={lnRadsOptions.matting} input={input} setField={setField} />
      <LnChips title="Эластография" field="elastography" options={lnRadsOptions.elastography} input={input} setField={setField} />
      <LnChips title="CEUS" field="ceus" options={lnRadsOptions.ceus} input={input} setField={setField} />

      {!engine || !report ? (
        <Text style={s.result}>Укажите длинную и короткую ось (мм, с десятыми).</Text>
      ) : (
        <>
          <Text style={s.result}>
            LN-RADS {engine.category} | Балл: {engine.score} | Риск: {engine.malignancyRisk}
          </Text>
          <Text style={s.result}>Интерпретация: {engine.title}</Text>
          <Text style={s.result}>Соотношение L/S: {formatLnRatio(engine.sizeAnalysis.lsRatio)}</Text>
          <Text style={s.result}>Тактика: {engine.management}</Text>
          {engine.redFlags.length ? <Text style={s.result}>Красные флаги: {engine.redFlags.join(" • ")}</Text> : null}
          <Text style={s.result}>Путь решения: {engine.decisionPath.join(" • ")}</Text>
          <Text style={s.result}>{report.plainText}</Text>
        </>
      )}
    </View>
  );
}
