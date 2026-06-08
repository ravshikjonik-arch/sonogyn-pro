import { useMemo, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import type { RootStackParamList } from "../../../navigation/AppStack";
import type { EarlyInput, FMFSection, FirstTrimesterInput, SecondThirdInput } from "../types";
import { analyzeCervix, analyzeDoppler, analyzeEarly, analyzeFirst, analyzeScar, analyzeSecondThird } from "../logic/assistantEngine";
import { parseVoiceProtocol } from "../logic/voiceNlp";
import SelectChip from "../../oradsPro/components/SelectChip";
import { AlertWithTeach, MedvedevPanel } from "../components/MedvedevPanel";
import { pregnancyUltrasoundModule } from "../core/pregnancyModule";
import { FMF_SCREENING_3034_SOURCE_NOTE, fmfScreening3034Examples } from "../data/fmfScreening3034Examples";

type Props = NativeStackScreenProps<RootStackParamList, "FMFAssistant">;

function num(v: string): number | undefined {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function f(v: string | number | undefined, suffix = ""): string {
  if (v === undefined || v === "") return "___";
  return `${v}${suffix}`;
}

function presentText(v: boolean | undefined, yes = "визуализируется", no = "не визуализируется"): string {
  if (v === undefined) return "___";
  return v ? yes : no;
}

function presentationText(v: SecondThirdInput["fetusPresentation"]): string {
  if (v === "cephalic") return "головное";
  if (v === "breech") return "тазовое";
  if (v === "transverse") return "поперечное";
  return "___";
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function FMFAssistantScreen({ navigation }: Props) {
  const [section, setSection] = useState<FMFSection | "doppler" | "cervix" | "scar">("early");
  const [early, setEarly] = useState<EarlyInput>({});
  const [first, setFirst] = useState<FirstTrimesterInput>({});
  const [st, setSt] = useState<SecondThirdInput>({});
  const [doppler, setDoppler] = useState<{
    piRight?: number;
    piLeft?: number;
    piUmb?: number;
    uaRi?: number;
    piMca?: number;
    mcaPsv?: number;
    dvPi?: number;
    gaWeeks?: number;
    gaDays?: number;
  }>({});
  const [cervix, setCervix] = useState<{ lengthMm?: number; funneling?: boolean }>({});
  const [scar, setScar] = useState<{ thicknessMm?: number; structure?: "homogeneous" | "heterogeneous" }>({});
  const [voiceText, setVoiceText] = useState("");
  const [calcMode, setCalcMode] = useState<"quick" | "strict">("strict");
  const [teachMode, setTeachMode] = useState(true);

  const out = useMemo(() => {
    if (section === "early") return analyzeEarly(early);
    if (section === "first") return analyzeFirst(first);
    if (section === "second") return analyzeSecondThird(st, "second", calcMode);
    if (section === "third") return analyzeSecondThird(st, "third", calcMode);
    if (section === "doppler") return analyzeDoppler(doppler);
    if (section === "cervix") return analyzeCervix(cervix);
    return analyzeScar(scar);
  }, [section, early, first, st, doppler, cervix, scar, calcMode]);

  const protocolText = useMemo(() => {
    if (section === "early") {
      return [
        "УЗИ БЕРЕМЕННОСТИ МАЛОГО СРОКА (до 11 недель)",
        "",
        "1. ОБЩИЕ ДАННЫЕ",
        `- ДПМ: ${f(early.lmpDate)}`,
        `- Срок гестации: ${early.crlMm ? "по КТР" : early.lmpDate ? "по ДПМ" : "___"}`,
        "",
        "2. МАТКА",
        `- Плодное яйцо: ${presentText(early.gestationalSacPresent)}`,
        `- Средний диаметр плодного яйца (СДП): ${f(early.msdMm, " мм")}`,
        `- Контуры плодного яйца: ${early.sacContourNormal === false ? "неровные" : early.sacContourNormal === true ? "ровные" : "___"}`,
        `- Желточный мешок: ${presentText(early.yolkSacSeen)}`,
        `- Эмбрион: ${presentText(early.embryoPresent)}`,
        `- КТР: ${f(early.crlMm, " мм")}`,
        `- ЧСС: ${f(early.fhr, " уд/мин")}`,
        `- Локализация: ${early.pregnancyLocation === "ectopic" ? "подозрение на внематочную" : early.pregnancyLocation === "uterine" ? "маточная" : "___"}`,
        `- Ретрохориальная гематома: ${early.retrochorionicHematoma === true ? "да" : early.retrochorionicHematoma === false ? "нет" : "___"}`,
        "",
        "3. ЯИЧНИКИ",
        `- Желтое тело: ${presentText(early.corpusLuteumPresent)}`,
        `- Локализация: ${early.corpusLuteumSide === "right" ? "правый яичник" : early.corpusLuteumSide === "left" ? "левый яичник" : "___"}`,
        `- Диаметр желтого тела: ${f(early.corpusLuteumSizeMm, " мм")}`,
        "",
        "4. ЗАКЛЮЧЕНИЕ",
        out.conclusion,
        "",
        "5. РЕКОМЕНДАЦИИ",
        ...out.recommendations.map((r) => `- ${r}`),
        "",
        "Не диагноз. Интерпретация — лечащим специалистом.",
      ].join("\n");
    }
    if (section !== "second" && section !== "third") return null;
    const trimesterTitle = section === "second" ? "ВО ВТОРОМ ТРИМЕСТРЕ" : "В ТРЕТЬЕМ ТРИМЕСТРЕ";
    const ga = `${f(st.gaWeeksByLmp)} недель ${f(st.gaDaysByLmp)} дней`;
    return [
      "СКРИНИНГОВОЕ УЛЬТРАЗВУКОВОЕ ИССЛЕДОВАНИЕ",
      trimesterTitle,
      "",
      "1. ОБЩИЕ ДАННЫЕ",
      `- Срок беременности: ${ga}`,
      "",
      "2. ПОЛОЖЕНИЕ ПЛОДА",
      `- Один живой плод, положение: ${presentationText(st.fetusPresentation)}, предлежание: ${presentationText(st.fetusPresentation)}.`,
      "- Подвижность: сохранена.",
      "",
      "3. ФЕТОМЕТРИЯ",
      `- BPD: ${f(st.bpd, " мм")}`,
      `- OFD: ${f(st.ofd, " мм")}`,
      `- HC: ${f(st.hc, " мм")}`,
      `- AC: ${f(st.ac, " мм")}`,
      `- FL: ${f(st.fl, " мм")}`,
      "- Размеры плода пропорциональны/непропорциональны (уточнить по перцентилям).",
      "",
      "4. СЕРДЦЕ ПЛОДА",
      `- ЧСС: ${f(st.fhr, " уд/мин")}, ритм: ___`,
      "",
      "5. АНАТОМИЯ ПЛОДА",
      `- Боковые желудочки: ${f(st.lateralVentriclesMm, " мм")}`,
      `- Мозжечок: ${f(st.cerebellumMm, " мм")}`,
      `- Большая цистерна: ${f(st.cisternaMagnaMm, " мм")}`,
      "- Полость прозрачной перегородки: ___",
      "- Мозолистое тело: б/о",
      "- Лицевые структуры, позвоночник, грудная клетка, конечности: б/о/уточнить",
      `- Носовые кости: ${presentText(st.nasalBoneSeen)}`,
      `- Желудок: ${presentText(st.stomachSeen)}`,
      `- Мочевой пузырь: ${presentText(st.bladderSeen)}`,
      "- Situs solitus.",
      "",
      "6. ПЛАЦЕНТА И ВОДЫ",
      `- Расстояние от плаценты до внутреннего зева: ${f(st.placentaDistanceToOsCm, " см")}`,
      "- Структура плаценты: б/о/уточнить.",
      `- Толщина плаценты: ${f(st.placentaThicknessMm, " мм")}`,
      `- ИАЖ: ${f(st.afiCm, " см")} (норма/маловодие/многоводие).`,
      "- Пуповина: 3 сосуда, обвитие: ___",
      "",
      "7. ШЕЙКА МАТКИ",
      `- Длина шейки: ${f(st.cervixLengthMm, " мм")}, funneling: ___`,
      "",
      "8. ДОППЛЕР",
      `- Маточные артерии PI (среднее): ${f(st.uterinePiMean)}`,
      `- Артерия пуповины RI (Прил. 37): ${f(st.uaRi)}`,
      `- Артерия пуповины PI: ${f(st.uaPi)}`,
      `- Среднемозговая артерия PI: ${f(st.mcaPi)}`,
      `- Среднемозговая артерия PSV (Прил. 38): ${f(st.mcaPsv, " см/с")}`,
      `- Венозный проток PI: ${f(st.dvPi)}`,
      "- ЦПО: ___",
      "",
      "9. ЗАКЛЮЧЕНИЕ",
      out.conclusion,
      "",
      "10. РЕКОМЕНДАЦИИ",
      ...out.recommendations.map((r) => `- ${r}`),
    ].join("\n");
  }, [section, early, st, out.conclusion, out.recommendations]);
  const voiceResult = useMemo(() => parseVoiceProtocol(voiceText), [voiceText]);

  async function onCopyProtocol() {
    const txt = protocolText ?? [
      `Раздел: ${
        section === "early"
          ? "Малый срок"
          : section === "first"
            ? "I скрининг"
            : section === "second"
              ? "II скрининг"
              : section === "third"
                ? "III скрининг"
                : section === "doppler"
                  ? "Допплер"
                  : section === "cervix"
                    ? "Шейка матки"
                    : "Рубец на матке"
      }`,
      `Режим расчета: ${calcMode === "strict" ? "Медведев (Прил. 1)" : "Быстрая оценка"}`,
      `Следующий шаг: ${out.nextPrompt}`,
      out.alerts.length ? `Отклонения: ${out.alerts.join("; ")}` : "Отклонения: не выявлены",
      out.hypotheses.length ? `Клинические гипотезы: ${out.hypotheses.join("; ")}` : "Клинические гипотезы: нет",
      `Заключение: ${out.conclusion}`,
      `Рекомендации: ${out.recommendations.join("; ")}`,
    ].join("\n");
    await Clipboard.setStringAsync(txt);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Назад</Text>
        </Pressable>
        <Text style={styles.title}>FMF Ассистент</Text>
        <View />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card title={`Примеры: III скрининг 30–34 н. (Uzicenter)`}>
          <Text style={styles.exampleNote}>{FMF_SCREENING_3034_SOURCE_NOTE}</Text>
          <View style={styles.rowWrap}>
            {fmfScreening3034Examples.map((ex) => (
              <Pressable
                key={ex.id}
                style={styles.exampleChip}
                onPress={() => {
                  setSection("third");
                  setSt(ex.input);
                  setVoiceText(ex.voiceHint);
                }}
              >
                <Text style={styles.exampleChipTitle}>{ex.title}</Text>
                <Text style={styles.exampleChipSub}>{ex.subtitle}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card title={`Раздел: ${pregnancyUltrasoundModule.title}`}>
          <Text style={styles.subtitle}>Помощник врача и учитель: перцентили Медведева + подсказки «как мерить».</Text>
          <View style={styles.rowWrap}>
            <SelectChip label="Медведев (Прил. 1)" selected={calcMode === "strict"} onPress={() => setCalcMode("strict")} />
            <SelectChip label="Быстрая оценка" selected={calcMode === "quick"} onPress={() => setCalcMode("quick")} />
            <SelectChip label="Учебник: вкл" selected={teachMode} onPress={() => setTeachMode(true)} />
            <SelectChip label="Учебник: выкл" selected={!teachMode} onPress={() => setTeachMode(false)} />
          </View>
          <View style={styles.rowWrap}>
            <SelectChip label="До 11 недель" selected={section === "early"} onPress={() => setSection("early")} />
            <SelectChip label="I скрининг" selected={section === "first"} onPress={() => setSection("first")} />
            <SelectChip label="II скрининг" selected={section === "second"} onPress={() => setSection("second")} />
            <SelectChip label="III скрининг" selected={section === "third"} onPress={() => setSection("third")} />
            <SelectChip label="Допплер" selected={section === "doppler"} onPress={() => setSection("doppler")} />
            <SelectChip label="Шейка матки" selected={section === "cervix"} onPress={() => setSection("cervix")} />
            <SelectChip label="Рубец на матке" selected={section === "scar"} onPress={() => setSection("scar")} />
          </View>
        </Card>

        {section === "early" ? (
          <Card title="Входные данные: малый срок (до 11 нед.)">
            <TextInput style={styles.input} placeholder="ДПМ (YYYY-MM-DD)" value={early.lmpDate ?? ""} onChangeText={(v) => setEarly((p) => ({ ...p, lmpDate: v }))} />
            <View style={styles.rowWrap}>
              <SelectChip label="Плодное яйцо: да" selected={early.gestationalSacPresent === true} onPress={() => setEarly((p) => ({ ...p, gestationalSacPresent: true }))} />
              <SelectChip label="Плодное яйцо: нет" selected={early.gestationalSacPresent === false} onPress={() => setEarly((p) => ({ ...p, gestationalSacPresent: false }))} />
            </View>
            <TextInput style={styles.input} placeholder="Средний диаметр плодного яйца, СДП (мм)" keyboardType="numeric" value={early.msdMm != null ? String(early.msdMm) : ""} onChangeText={(v) => setEarly((p) => ({ ...p, msdMm: num(v) }))} />
            <View style={styles.rowWrap}>
              <SelectChip label="Желточный мешок: да" selected={early.yolkSacSeen === true} onPress={() => setEarly((p) => ({ ...p, yolkSacSeen: true }))} />
              <SelectChip label="Желточный мешок: нет" selected={early.yolkSacSeen === false} onPress={() => setEarly((p) => ({ ...p, yolkSacSeen: false }))} />
            </View>
            <View style={styles.rowWrap}>
              <SelectChip label="Эмбрион: да" selected={early.embryoPresent === true} onPress={() => setEarly((p) => ({ ...p, embryoPresent: true }))} />
              <SelectChip label="Эмбрион: нет" selected={early.embryoPresent === false} onPress={() => setEarly((p) => ({ ...p, embryoPresent: false }))} />
            </View>
            <TextInput style={styles.input} placeholder="КТР (мм)" keyboardType="numeric" value={early.crlMm != null ? String(early.crlMm) : ""} onChangeText={(v) => setEarly((p) => ({ ...p, crlMm: num(v) }))} />
            <TextInput style={styles.input} placeholder="ЧСС (уд/мин)" keyboardType="numeric" value={early.fhr != null ? String(early.fhr) : ""} onChangeText={(v) => setEarly((p) => ({ ...p, fhr: num(v) }))} />
            <Text style={styles.fieldLabel}>Яичники — желтое тело</Text>
            <View style={styles.rowWrap}>
              <SelectChip label="Желтое тело: да" selected={early.corpusLuteumPresent === true} onPress={() => setEarly((p) => ({ ...p, corpusLuteumPresent: true }))} />
              <SelectChip label="Желтое тело: нет" selected={early.corpusLuteumPresent === false} onPress={() => setEarly((p) => ({ ...p, corpusLuteumPresent: false, corpusLuteumSide: undefined, corpusLuteumSizeMm: undefined }))} />
            </View>
            {early.corpusLuteumPresent ? (
              <>
                <View style={styles.rowWrap}>
                  <SelectChip label="Правый яичник" selected={early.corpusLuteumSide === "right"} onPress={() => setEarly((p) => ({ ...p, corpusLuteumSide: "right" }))} />
                  <SelectChip label="Левый яичник" selected={early.corpusLuteumSide === "left"} onPress={() => setEarly((p) => ({ ...p, corpusLuteumSide: "left" }))} />
                </View>
                <TextInput style={styles.input} placeholder="Диаметр желтого тела (мм)" keyboardType="numeric" value={early.corpusLuteumSizeMm != null ? String(early.corpusLuteumSizeMm) : ""} onChangeText={(v) => setEarly((p) => ({ ...p, corpusLuteumSizeMm: num(v) }))} />
              </>
            ) : null}
            <View style={styles.rowWrap}>
              <SelectChip label="Контуры ПЯ: ровные" selected={early.sacContourNormal === true} onPress={() => setEarly((p) => ({ ...p, sacContourNormal: true }))} />
              <SelectChip label="Контуры ПЯ: неровные" selected={early.sacContourNormal === false} onPress={() => setEarly((p) => ({ ...p, sacContourNormal: false }))} />
            </View>
            <View style={styles.rowWrap}>
              <SelectChip label="Беременность маточная" selected={early.pregnancyLocation === "uterine"} onPress={() => setEarly((p) => ({ ...p, pregnancyLocation: "uterine" }))} />
              <SelectChip label="Внематочная?" selected={early.pregnancyLocation === "ectopic"} onPress={() => setEarly((p) => ({ ...p, pregnancyLocation: "ectopic" }))} />
            </View>
            <View style={styles.rowWrap}>
              <SelectChip label="Ретрохориальная гематома: да" selected={early.retrochorionicHematoma === true} onPress={() => setEarly((p) => ({ ...p, retrochorionicHematoma: true }))} />
              <SelectChip label="Ретрохориальная гематома: нет" selected={early.retrochorionicHematoma === false} onPress={() => setEarly((p) => ({ ...p, retrochorionicHematoma: false }))} />
            </View>
          </Card>
        ) : null}

        {section === "first" ? (
          <Card title="Входные данные: I скрининг">
            <TextInput style={styles.input} placeholder="КТР (мм)" keyboardType="numeric" onChangeText={(v) => setFirst((p) => ({ ...p, crlMm: num(v) }))} />
            <TextInput style={styles.input} placeholder="ТВП (мм)" keyboardType="numeric" onChangeText={(v) => setFirst((p) => ({ ...p, ntMm: num(v) }))} />
            <TextInput style={styles.input} placeholder="ЧСС (уд/мин)" keyboardType="numeric" onChangeText={(v) => setFirst((p) => ({ ...p, fhr: num(v) }))} />
            <View style={styles.rowWrap}>
              <SelectChip label="НК: визуализируется" selected={first.nasalBone === "seen"} onPress={() => setFirst((p) => ({ ...p, nasalBone: "seen" }))} />
              <SelectChip label="НК: не визуализируется" selected={first.nasalBone === "not_seen"} onPress={() => setFirst((p) => ({ ...p, nasalBone: "not_seen" }))} />
            </View>
            <View style={styles.rowWrap}>
              <SelectChip label="DV: норма" selected={first.dvFlow === "normal"} onPress={() => setFirst((p) => ({ ...p, dvFlow: "normal" }))} />
              <SelectChip label="DV: патология" selected={first.dvFlow === "abnormal"} onPress={() => setFirst((p) => ({ ...p, dvFlow: "abnormal" }))} />
            </View>
          </Card>
        ) : null}

        {section === "second" || section === "third" ? (
          <Card title={`Входные данные: ${section === "second" ? "II" : "III"} триместр`}>
            <View style={styles.rowWrap}>
              <SelectChip label="Головное" selected={st.fetusPresentation === "cephalic"} onPress={() => setSt((p) => ({ ...p, fetusPresentation: "cephalic" }))} />
              <SelectChip label="Тазовое" selected={st.fetusPresentation === "breech"} onPress={() => setSt((p) => ({ ...p, fetusPresentation: "breech" }))} />
              <SelectChip label="Поперечное" selected={st.fetusPresentation === "transverse"} onPress={() => setSt((p) => ({ ...p, fetusPresentation: "transverse" }))} />
            </View>
            <View style={styles.row}>
              <TextInput
                style={styles.inputFlex}
                placeholder="Срок по ДПМ: нед"
                keyboardType="numeric"
                value={st.gaWeeksByLmp != null ? String(st.gaWeeksByLmp) : ""}
                onChangeText={(v) => setSt((p) => ({ ...p, gaWeeksByLmp: num(v) }))}
              />
              <TextInput
                style={styles.inputFlex}
                placeholder="Срок по ДПМ: дни"
                keyboardType="numeric"
                value={st.gaDaysByLmp != null ? String(st.gaDaysByLmp) : ""}
                onChangeText={(v) => setSt((p) => ({ ...p, gaDaysByLmp: num(v) }))}
              />
            </View>
            <View style={styles.row}>
              <TextInput
                style={styles.inputFlex}
                placeholder="BPD"
                keyboardType="numeric"
                value={st.bpd != null ? String(st.bpd) : ""}
                onChangeText={(v) => setSt((p) => ({ ...p, bpd: num(v) }))}
              />
              <TextInput
                style={styles.inputFlex}
                placeholder="HC"
                keyboardType="numeric"
                value={st.hc != null ? String(st.hc) : ""}
                onChangeText={(v) => setSt((p) => ({ ...p, hc: num(v) }))}
              />
              <TextInput
                style={styles.inputFlex}
                placeholder="AC"
                keyboardType="numeric"
                value={st.ac != null ? String(st.ac) : ""}
                onChangeText={(v) => setSt((p) => ({ ...p, ac: num(v) }))}
              />
              <TextInput
                style={styles.inputFlex}
                placeholder="FL"
                keyboardType="numeric"
                value={st.fl != null ? String(st.fl) : ""}
                onChangeText={(v) => setSt((p) => ({ ...p, fl: num(v) }))}
              />
            </View>
            <View style={styles.row}>
              <TextInput
                style={styles.inputFlex}
                placeholder="Лат. желудочки (мм)"
                keyboardType="numeric"
                value={st.lateralVentriclesMm != null ? String(st.lateralVentriclesMm) : ""}
                onChangeText={(v) => setSt((p) => ({ ...p, lateralVentriclesMm: num(v) }))}
              />
              <TextInput
                style={styles.inputFlex}
                placeholder="ИАЖ (см)"
                keyboardType="numeric"
                value={st.afiCm != null ? String(st.afiCm) : ""}
                onChangeText={(v) => setSt((p) => ({ ...p, afiCm: num(v) }))}
              />
              <TextInput
                style={styles.inputFlex}
                placeholder="Толщ. плаценты мм"
                keyboardType="numeric"
                value={st.placentaThicknessMm != null ? String(st.placentaThicknessMm) : ""}
                onChangeText={(v) => setSt((p) => ({ ...p, placentaThicknessMm: num(v) }))}
              />
              <TextInput
                style={styles.inputFlex}
                placeholder="ЧСС"
                keyboardType="numeric"
                value={st.fhr != null ? String(st.fhr) : ""}
                onChangeText={(v) => setSt((p) => ({ ...p, fhr: num(v) }))}
              />
            </View>
            <View style={styles.row}>
              <TextInput
                style={styles.inputFlex}
                placeholder="PI мат. артерий (ср.)"
                keyboardType="numeric"
                value={st.uterinePiMean != null ? String(st.uterinePiMean) : ""}
                onChangeText={(v) => setSt((p) => ({ ...p, uterinePiMean: num(v) }))}
              />
              <TextInput
                style={styles.inputFlex}
                placeholder="PI АП"
                keyboardType="numeric"
                value={st.uaPi != null ? String(st.uaPi) : ""}
                onChangeText={(v) => setSt((p) => ({ ...p, uaPi: num(v) }))}
              />
              <TextInput
                style={styles.inputFlex}
                placeholder="ИР АП (RI) · Прил. 37"
                keyboardType="numeric"
                value={st.uaRi != null ? String(st.uaRi) : ""}
                onChangeText={(v) => setSt((p) => ({ ...p, uaRi: num(v) }))}
              />
            </View>
            <View style={styles.row}>
              <TextInput
                style={styles.inputFlex}
                placeholder="PI СМА"
                keyboardType="numeric"
                value={st.mcaPi != null ? String(st.mcaPi) : ""}
                onChangeText={(v) => setSt((p) => ({ ...p, mcaPi: num(v) }))}
              />
              <TextInput
                style={styles.inputFlex}
                placeholder="PSV СМА · Прил. 38"
                keyboardType="numeric"
                value={st.mcaPsv != null ? String(st.mcaPsv) : ""}
                onChangeText={(v) => setSt((p) => ({ ...p, mcaPsv: num(v) }))}
              />
            </View>
            <View style={styles.rowWrap}>
              <SelectChip label="Носовые кости: да" selected={st.nasalBoneSeen === true} onPress={() => setSt((p) => ({ ...p, nasalBoneSeen: true }))} />
              <SelectChip label="Носовые кости: нет" selected={st.nasalBoneSeen === false} onPress={() => setSt((p) => ({ ...p, nasalBoneSeen: false }))} />
              <SelectChip label="Желудок: да" selected={st.stomachSeen === true} onPress={() => setSt((p) => ({ ...p, stomachSeen: true }))} />
              <SelectChip label="Желудок: нет" selected={st.stomachSeen === false} onPress={() => setSt((p) => ({ ...p, stomachSeen: false }))} />
            </View>
            <View style={styles.rowWrap}>
              <SelectChip label="Мочевой пузырь: да" selected={st.bladderSeen === true} onPress={() => setSt((p) => ({ ...p, bladderSeen: true }))} />
              <SelectChip label="Мочевой пузырь: нет" selected={st.bladderSeen === false} onPress={() => setSt((p) => ({ ...p, bladderSeen: false }))} />
            </View>
          </Card>
        ) : null}

        <Card title="Голосовой ввод (NLP)">
          <TextInput
            style={[styles.input, styles.voiceInput]}
            multiline
            placeholder='Пример: "бпр 52 ож 180 бедро 36 желудочки 11 мм"'
            value={voiceText}
            onChangeText={setVoiceText}
          />
          <Text style={styles.subtitle}>JSON</Text>
          <Text style={styles.protocol}>{JSON.stringify(voiceResult.data, null, 2)}</Text>
          {voiceResult.need_clarification ? <Text style={styles.alert}>⚠️ {voiceResult.clarification_question}</Text> : null}
          {voiceResult.alerts.map((a) => (
            <Text key={`v_${a}`} style={styles.alert}>
              {a}
            </Text>
          ))}
          <Text style={styles.item}>{voiceResult.report}</Text>
        </Card>

        {section === "doppler" ? (
          <Card title="Входные данные: Допплер">
            <View style={styles.row}>
              <TextInput style={styles.inputFlex} placeholder="Срок, нед" keyboardType="numeric" onChangeText={(v) => setDoppler((p) => ({ ...p, gaWeeks: num(v) }))} />
              <TextInput style={styles.inputFlex} placeholder="Срок, дни" keyboardType="numeric" onChangeText={(v) => setDoppler((p) => ({ ...p, gaDays: num(v) }))} />
            </View>
            <View style={styles.row}>
              <TextInput style={styles.inputFlex} placeholder="PI маточной справа" keyboardType="numeric" onChangeText={(v) => setDoppler((p) => ({ ...p, piRight: num(v) }))} />
              <TextInput style={styles.inputFlex} placeholder="PI маточной слева" keyboardType="numeric" onChangeText={(v) => setDoppler((p) => ({ ...p, piLeft: num(v) }))} />
            </View>
            <View style={styles.row}>
              <TextInput style={styles.inputFlex} placeholder="ИР АП (RI) · Прил. 37" keyboardType="decimal-pad" onChangeText={(v) => setDoppler((p) => ({ ...p, uaRi: num(v) }))} />
              <TextInput style={styles.inputFlex} placeholder="PI СМА · Прил. 39" keyboardType="decimal-pad" onChangeText={(v) => setDoppler((p) => ({ ...p, piMca: num(v) }))} />
              <TextInput style={styles.inputFlex} placeholder="PSV СМА · Прил. 38" keyboardType="decimal-pad" onChangeText={(v) => setDoppler((p) => ({ ...p, mcaPsv: num(v) }))} />
            </View>
            <View style={styles.row}>
              <TextInput style={styles.inputFlex} placeholder="PI DV" keyboardType="decimal-pad" onChangeText={(v) => setDoppler((p) => ({ ...p, dvPi: num(v) }))} />
              <TextInput style={styles.inputFlex} placeholder="PI АП (legacy)" keyboardType="decimal-pad" onChangeText={(v) => setDoppler((p) => ({ ...p, piUmb: num(v) }))} />
            </View>
          </Card>
        ) : null}

        {section === "cervix" ? (
          <Card title="Входные данные: Шейка матки">
            <TextInput style={styles.input} placeholder="Длина шейки (мм)" keyboardType="numeric" onChangeText={(v) => setCervix((p) => ({ ...p, lengthMm: num(v) }))} />
            <View style={styles.rowWrap}>
              <SelectChip label="Funneling: нет" selected={cervix.funneling === false} onPress={() => setCervix((p) => ({ ...p, funneling: false }))} />
              <SelectChip label="Funneling: есть" selected={cervix.funneling === true} onPress={() => setCervix((p) => ({ ...p, funneling: true }))} />
            </View>
          </Card>
        ) : null}

        {section === "scar" ? (
          <Card title="Входные данные: Рубец на матке">
            <TextInput style={styles.input} placeholder="Толщина рубца (мм)" keyboardType="numeric" onChangeText={(v) => setScar((p) => ({ ...p, thicknessMm: num(v) }))} />
            <View style={styles.rowWrap}>
              <SelectChip label="Структура: однородный" selected={scar.structure === "homogeneous"} onPress={() => setScar((p) => ({ ...p, structure: "homogeneous" }))} />
              <SelectChip label="Структура: неоднородный" selected={scar.structure === "heterogeneous"} onPress={() => setScar((p) => ({ ...p, structure: "heterogeneous" }))} />
            </View>
          </Card>
        ) : null}

        {section === "first" && out.medvedevMarkers?.length ? (
          <Card title="Медведев · I скрининг">
            <MedvedevPanel title="Перцентили · Прил. 11" markers={out.medvedevMarkers} teachMode={teachMode} />
            {out.medvedevDoppler?.length ? (
              <MedvedevPanel title="Допплер · Прил. 40 / 36" doppler={out.medvedevDoppler} teachMode={teachMode} />
            ) : null}
          </Card>
        ) : null}

        {(section === "second" || section === "third") && out.medvedevBiometry?.length ? (
          <Card title="Медведев · фетометрия и анатомия">
            <MedvedevPanel
              title={section === "second" ? "Перцентили · Прил. 1 + 5–20" : "Перцентили · Прил. 1"}
              biometry={out.medvedevBiometry}
              teachMode={teachMode}
            />
          </Card>
        ) : null}

        {(section === "second" || section === "third") && out.medvedevPlacentaAfi?.length ? (
          <Card title="Медведев · плацента и воды">
            <MedvedevPanel title="Прил. 34 / 35" placentaAfi={out.medvedevPlacentaAfi} teachMode={teachMode} />
          </Card>
        ) : null}

        {(section === "second" || section === "third") && out.medvedevDoppler?.length ? (
          <Card title="Медведев · допплер">
            <MedvedevPanel title="Допплер · Прил. 36 / 37 / 38 / 39 / 41" doppler={out.medvedevDoppler} teachMode={teachMode} />
          </Card>
        ) : null}

        {section === "doppler" && out.medvedevDoppler?.length ? (
          <Card title="Медведев · допплер">
            <MedvedevPanel title="Допплер" doppler={out.medvedevDoppler} teachMode={teachMode} />
          </Card>
        ) : null}

        <Card title="Клиническое мышление">
          <Text style={styles.next}>Следующий шаг: {out.nextPrompt}</Text>
          {out.missingQuestions.length ? <Text style={styles.subtitle}>Нужно уточнить</Text> : null}
          {out.missingQuestions.map((q) => (
            <Text key={q} style={styles.missing}>
              ? {q}
            </Text>
          ))}
          {out.alerts.length ? <Text style={styles.subtitle}>⚠️ Отклонения</Text> : null}
          {out.alerts.map((a) =>
            teachMode ? <AlertWithTeach key={a} alert={a} /> : (
              <Text key={a} style={styles.alert}>
                {a}
              </Text>
            ),
          )}
          {out.hypotheses.length ? <Text style={styles.subtitle}>Гипотезы</Text> : null}
          {out.hypotheses.map((h) => (
            <Text key={h} style={styles.item}>
              • {h}
            </Text>
          ))}
          <Text style={styles.subtitle}>Визуальные подсказки</Text>
          {out.visualHints.map((h) => (
            <Text key={h} style={styles.item}>
              • {h}
            </Text>
          ))}
        </Card>

        <Card title="Автозаключение">
          {out.missingQuestions.length ? (
            <Text style={styles.alert}>⚠️ Данных недостаточно для финального заключения. Закройте блок "Нужно уточнить".</Text>
          ) : (
            <Text style={styles.conclusion}>{out.conclusion}</Text>
          )}
          <Text style={styles.subtitle}>Рекомендации</Text>
          {out.recommendations.map((r) => (
            <Text key={r} style={styles.item}>
              • {r}
            </Text>
          ))}
          <Pressable style={styles.copyBtn} onPress={onCopyProtocol}>
            <Text style={styles.copyBtnText}>Скопировать протокол</Text>
          </Pressable>
        </Card>
        {protocolText ? (
          <Card title={section === "early" ? "Полный протокол (малый срок)" : "Полный протокол (II/III скрининг)"}>
            <Text style={styles.protocol}>{protocolText}</Text>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  back: { color: "#2563EB", fontWeight: "700" },
  title: { color: "#0f172a", fontSize: 20, fontWeight: "800" },
  content: { padding: 14, gap: 12, paddingBottom: 28 },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  fieldLabel: { color: "#475569", fontSize: 13, fontWeight: "700", marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: "#fff",
  },
  row: { flexDirection: "row", gap: 8 },
  inputFlex: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: "#fff",
  },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  next: { color: "#334155", fontSize: 14, fontWeight: "700" },
  subtitle: { color: "#0f172a", fontSize: 14, fontWeight: "800", marginTop: 4 },
  alert: { color: "#b91c1c", fontWeight: "700", fontSize: 13 },
  missing: { color: "#0369a1", fontWeight: "700", fontSize: 13 },
  item: { color: "#334155", fontSize: 13 },
  conclusion: { color: "#0f172a", fontSize: 14, lineHeight: 21 },
  copyBtn: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    alignItems: "center",
    paddingVertical: 10,
  },
  copyBtnText: { color: "#fff", fontWeight: "800" },
  protocol: {
    color: "#0f172a",
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Courier",
  },
  voiceInput: {
    minHeight: 76,
    textAlignVertical: "top",
  },
  exampleNote: { color: "#64748b", fontSize: 12, lineHeight: 17, marginBottom: 6 },
  exampleChip: {
    flex: 1,
    minWidth: 148,
    borderWidth: 1,
    borderColor: "#c4b5fd",
    backgroundColor: "#f5f3ff",
    borderRadius: 10,
    padding: 10,
  },
  exampleChipTitle: { color: "#4c1d95", fontWeight: "800", fontSize: 13 },
  exampleChipSub: { color: "#5b21b6", fontSize: 11, marginTop: 4, lineHeight: 15 },
});
