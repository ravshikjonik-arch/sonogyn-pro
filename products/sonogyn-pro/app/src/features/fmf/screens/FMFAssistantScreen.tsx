import { useMemo, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import type { RootStackParamList } from "../../../navigation/AppStack";
import type { EarlyInput, FMFSection, FirstTrimesterInput, SecondThirdInput } from "../types";
import { analyzeCervix, analyzeDoppler, analyzeEarly, analyzeFirst, analyzeScar, analyzeSecondThird } from "../logic/assistantEngine";
import { parseVoiceProtocol } from "../logic/voiceNlp";
import SelectChip from "../../oradsPro/components/SelectChip";
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
  const [early, setEarly] = useState<EarlyInput>({ localization: undefined } as unknown as EarlyInput);
  const [first, setFirst] = useState<FirstTrimesterInput>({});
  const [st, setSt] = useState<SecondThirdInput>({});
  const [doppler, setDoppler] = useState<{ piRight?: number; piLeft?: number; piUmb?: number; piMca?: number }>({});
  const [cervix, setCervix] = useState<{ lengthMm?: number; funneling?: boolean }>({});
  const [scar, setScar] = useState<{ thicknessMm?: number; structure?: "homogeneous" | "heterogeneous" }>({});
  const [voiceText, setVoiceText] = useState("");
  const [calcMode, setCalcMode] = useState<"quick" | "strict">("strict");

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
      `- ИАЖ: ${f(st.afiCm, " см")} (норма/маловодие/многоводие).`,
      "- Пуповина: 3 сосуда, обвитие: ___",
      "",
      "7. ШЕЙКА МАТКИ",
      `- Длина шейки: ${f(st.cervixLengthMm, " мм")}, funneling: ___`,
      "",
      "8. ДОППЛЕР",
      `- Маточные артерии PI (среднее): ${f(st.uterinePiMean)}`,
      `- Артерия пуповины PI: ${f(st.uaPi)}`,
      `- Среднемозговая артерия PI: ${f(st.mcaPi)}`,
      `- Венозный проток PI: ${f(st.dvPi)}`,
      "- ЦПО: ___",
      "",
      "9. ЗАКЛЮЧЕНИЕ",
      out.conclusion,
      "",
      "10. РЕКОМЕНДАЦИИ",
      ...out.recommendations.map((r) => `- ${r}`),
    ].join("\n");
  }, [section, st, out.conclusion, out.recommendations]);
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
      `Режим расчета: ${calcMode === "strict" ? "Строгий FMF" : "Быстрый"}`,
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
          <View style={styles.rowWrap}>
            <SelectChip label="Строгий FMF" selected={calcMode === "strict"} onPress={() => setCalcMode("strict")} />
            <SelectChip label="Быстрый режим" selected={calcMode === "quick"} onPress={() => setCalcMode("quick")} />
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
          <Card title="Входные данные: малый срок">
            <TextInput style={styles.input} placeholder="ДПМ (YYYY-MM-DD)" value={early.lmpDate ?? ""} onChangeText={(v) => setEarly((p) => ({ ...p, lmpDate: v }))} />
            <TextInput style={styles.input} placeholder="КТР (мм)" keyboardType="numeric" onChangeText={(v) => setEarly((p) => ({ ...p, crlMm: num(v) }))} />
            <TextInput style={styles.input} placeholder="ЧСС (уд/мин)" keyboardType="numeric" onChangeText={(v) => setEarly((p) => ({ ...p, fhr: num(v) }))} />
            <TextInput style={styles.input} placeholder="Средний диаметр плодного яйца (мм)" keyboardType="numeric" onChangeText={(v) => setEarly((p) => ({ ...p, msdMm: num(v) }))} />
            <View style={styles.rowWrap}>
              <SelectChip label="Эмбрион: да" selected={early.embryoPresent === true} onPress={() => setEarly((p) => ({ ...p, embryoPresent: true }))} />
              <SelectChip label="Эмбрион: нет" selected={early.embryoPresent === false} onPress={() => setEarly((p) => ({ ...p, embryoPresent: false }))} />
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
                placeholder="PI СМА"
                keyboardType="numeric"
                value={st.mcaPi != null ? String(st.mcaPi) : ""}
                onChangeText={(v) => setSt((p) => ({ ...p, mcaPi: num(v) }))}
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
              <TextInput style={styles.inputFlex} placeholder="PI маточной справа" keyboardType="numeric" onChangeText={(v) => setDoppler((p) => ({ ...p, piRight: num(v) }))} />
              <TextInput style={styles.inputFlex} placeholder="PI маточной слева" keyboardType="numeric" onChangeText={(v) => setDoppler((p) => ({ ...p, piLeft: num(v) }))} />
            </View>
            <View style={styles.row}>
              <TextInput style={styles.inputFlex} placeholder="PI АП" keyboardType="numeric" onChangeText={(v) => setDoppler((p) => ({ ...p, piUmb: num(v) }))} />
              <TextInput style={styles.inputFlex} placeholder="PI СМА" keyboardType="numeric" onChangeText={(v) => setDoppler((p) => ({ ...p, piMca: num(v) }))} />
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

        <Card title="Клиническое мышление">
          <Text style={styles.next}>Следующий шаг: {out.nextPrompt}</Text>
          {out.missingQuestions.length ? <Text style={styles.subtitle}>Нужно уточнить</Text> : null}
          {out.missingQuestions.map((q) => (
            <Text key={q} style={styles.missing}>
              ? {q}
            </Text>
          ))}
          {out.alerts.length ? <Text style={styles.subtitle}>⚠️ Отклонения</Text> : null}
          {out.alerts.map((a) => (
            <Text key={a} style={styles.alert}>
              {a}
            </Text>
          ))}
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
          <Card title="Полный протокол (II/III скрининг)">
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
