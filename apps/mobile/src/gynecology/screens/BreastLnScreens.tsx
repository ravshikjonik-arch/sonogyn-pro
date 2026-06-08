import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { PageType } from "../../navigationTypes";
import {
  BREAST_RISK_TOOL_VERSION,
  evaluateBreastRiskEducation,
} from "../breastRiskTool";
import { GynBackToHub } from "../components/GynBackToHub";
import { evaluateLnRads, LN_RADS_VERSION } from "../lnrads";
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

export function ScreenLnRads({ setPage }: { setPage: (p: PageType) => void }) {
  const [location, setLocation] = useState<"neck" | "axillary" | "inguinal" | "abdominal">("neck");
  const [lengthMm, setLengthMm] = useState("18");
  const [shortAxisMm, setShortAxisMm] = useState("7");
  const [hilum, setHilum] = useState<"present" | "absent">("present");
  const [cortexMm, setCortexMm] = useState("2");
  const [shape, setShape] = useState<"oval" | "round">("oval");
  const [echogenicity, setEchogenicity] = useState<"normal" | "hypoechoic" | "heterogeneous">("normal");
  const [vascularity, setVascularity] = useState<"hilar" | "peripheral" | "mixed" | "absent">("hilar");
  const [borders, setBorders] = useState<"clear" | "irregular">("clear");
  const [calcifications, setCalcifications] = useState(false);
  const [necrosis, setNecrosis] = useState(false);
  const [conglomerate, setConglomerate] = useState(false);

  const result = useMemo(() => {
    const l = parseFloat(lengthMm.replace(",", "."));
    const sAxis = parseFloat(shortAxisMm.replace(",", "."));
    const c = parseFloat(cortexMm.replace(",", "."));
    if (!Number.isFinite(l) || !Number.isFinite(sAxis) || !Number.isFinite(c) || l <= 0 || sAxis <= 0 || c < 0) {
      return null;
    }
    return evaluateLnRads({
      location,
      length_mm: l,
      short_axis_mm: sAxis,
      hilum,
      cortex_thickness_mm: c,
      shape,
      echogenicity,
      vascularity,
      borders,
      calcifications,
      necrosis,
      conglomerate,
    });
  }, [
    borders,
    calcifications,
    conglomerate,
    cortexMm,
    echogenicity,
    hilum,
    lengthMm,
    location,
    necrosis,
    shape,
    shortAxisMm,
    vascularity,
  ]);

  return (
    <View style={s.card}>
      <GynBackToHub onPress={() => setPage("gyn_hub")} />
      <Text style={s.title}>LN-RADS — оценка лимфоузлов</Text>
      <Text style={s.meta}>{LN_RADS_VERSION}</Text>

      <Text style={s.label}>Локализация</Text>
      <View style={s.rowWrap}>
        {[
          ["neck", "Шейные"],
          ["axillary", "Подмышечные"],
          ["inguinal", "Паховые"],
          ["abdominal", "Абдоминальные"],
        ].map(([v, label]) => (
          <Pressable
            key={v}
            style={[s.backBtn, location === v && { backgroundColor: "#ccfbf1" }]}
            onPress={() => setLocation(v as "neck" | "axillary" | "inguinal" | "abdominal")}
          >
            <Text style={s.backBtnText}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.label}>Размеры, мм (длина и короткая ось)</Text>
      <View style={s.rowWrap}>
        <TextInput value={lengthMm} onChangeText={setLengthMm} keyboardType="decimal-pad" placeholder="Длина" style={[s.input, { width: 110 }]} />
        <TextInput value={shortAxisMm} onChangeText={setShortAxisMm} keyboardType="decimal-pad" placeholder="Короткая ось" style={[s.input, { width: 140 }]} />
      </View>

      <Text style={s.label}>Хилус</Text>
      <View style={s.rowWrap}>
        {[
          ["present", "Сохранён"],
          ["absent", "Отсутствует"],
        ].map(([v, label]) => (
          <Pressable key={v} style={[s.backBtn, hilum === v && { backgroundColor: "#fee2e2" }]} onPress={() => setHilum(v as "present" | "absent")}>
            <Text style={s.backBtnText}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.label}>Толщина коры, мм</Text>
      <TextInput value={cortexMm} onChangeText={setCortexMm} keyboardType="decimal-pad" placeholder="2.5" style={s.input} />

      <Text style={s.label}>Форма</Text>
      <View style={s.rowWrap}>
        {[
          ["oval", "Овальная"],
          ["round", "Округлая"],
        ].map(([v, label]) => (
          <Pressable key={v} style={[s.backBtn, shape === v && { backgroundColor: "#fef3c7" }]} onPress={() => setShape(v as "oval" | "round")}>
            <Text style={s.backBtnText}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.label}>Эхогенность</Text>
      <View style={s.rowWrap}>
        {[
          ["normal", "Нормальная"],
          ["hypoechoic", "Гипоэхогенная"],
          ["heterogeneous", "Гетерогенная"],
        ].map(([v, label]) => (
          <Pressable
            key={v}
            style={[s.backBtn, echogenicity === v && { backgroundColor: "#fce7f3" }]}
            onPress={() => setEchogenicity(v as "normal" | "hypoechoic" | "heterogeneous")}
          >
            <Text style={s.backBtnText}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.label}>Кровоток (ЦДК)</Text>
      <View style={s.rowWrap}>
        {[
          ["hilar", "Hilar"],
          ["peripheral", "Peripheral"],
          ["mixed", "Mixed"],
          ["absent", "Absent"],
        ].map(([v, label]) => (
          <Pressable
            key={v}
            style={[s.backBtn, vascularity === v && { backgroundColor: "#e0e7ff" }]}
            onPress={() => setVascularity(v as "hilar" | "peripheral" | "mixed" | "absent")}
          >
            <Text style={s.backBtnText}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.label}>Контуры</Text>
      <View style={s.rowWrap}>
        {[
          ["clear", "Чёткие"],
          ["irregular", "Неровные"],
        ].map(([v, label]) => (
          <Pressable key={v} style={[s.backBtn, borders === v && { backgroundColor: "#fed7aa" }]} onPress={() => setBorders(v as "clear" | "irregular")}>
            <Text style={s.backBtnText}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.label}>Доп. признаки</Text>
      <View style={s.rowWrap}>
        {[
          { label: "Кальцинаты", value: calcifications, setter: setCalcifications },
          { label: "Некроз", value: necrosis, setter: setNecrosis },
          { label: "Конгломераты", value: conglomerate, setter: setConglomerate },
        ].map((item) => (
          <Pressable key={item.label} style={[s.backBtn, item.value && { backgroundColor: "#fee2e2" }]} onPress={() => item.setter(!item.value)}>
            <Text style={s.backBtnText}>
              {item.label}: {item.value ? "да" : "нет"}
            </Text>
          </Pressable>
        ))}
      </View>

      {!result ? (
        <Text style={s.result}>Введите корректные размеры (положительные числа).</Text>
      ) : (
        <>
          <Text style={s.result}>
            LN-RADS {result.category} | Балл: {result.score} | Риск: {result.risk}
          </Text>
          <Text style={s.result}>Интерпретация: {result.title}</Text>
          <Text style={s.result}>Соотношение L/S: {result.lOverS?.toFixed(2) ?? "н/д"}</Text>
          <Text style={s.result}>Путь решения: {result.decisionPath.join(" • ")}</Text>
          <Text style={s.result}>{result.protocol}</Text>
        </>
      )}
    </View>
  );
}
