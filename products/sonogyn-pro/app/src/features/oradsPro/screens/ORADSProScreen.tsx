import * as Clipboard from "expo-clipboard";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import StepCard from "../components/StepCard";
import SelectChip from "../components/SelectChip";
import ResultPanel from "../components/ResultPanel";
import IotaConsensusPanel from "../components/IotaConsensusPanel";
import IotaVisualGuide from "../components/IotaVisualGuide";
import type {
  BloodFlow,
  Echogenicity,
  IotaCenterType,
  IotaColorScore,
  IotaLesionType,
  LesionKind,
  Localization,
  Menopause,
  OradsInput,
  PapillaryProjectionCount,
  PapillaryProjectionSurface,
  PhysiologicalType,
  SeptaCount,
  SeptaThickness,
  SolidType,
  Structure,
  UnilocularSubtype,
} from "../types";
import { buildReportText, calculateORADS } from "../logic/oradsCalculator";
import { buildIotaConsensusReportText, evaluateIotaConsensus2026 } from "../consensus/iotaConsensus2026";
import { appendCaseToHistory, loadUXMetric, pushTimeToResult } from "../storage/oradsStorage";
import { flushAIQueue, getAIQueueSize, getAIQueueStatus, requestAIOrQueue } from "../ai/aiService";
import type { RootStackParamList } from "../../../navigation/AppStack";

type Props = NativeStackScreenProps<RootStackParamList, "ORADSPro">;

export default function ORADSProScreen({ navigation, route }: Props) {
  const [localization, setLocalization] = useState<Localization | undefined>("ovarian");
  const [menopause, setMenopause] = useState<Menopause | undefined>(undefined);
  const [lesionKind, setLesionKind] = useState<LesionKind | undefined>(undefined);
  const [physType, setPhysType] = useState<PhysiologicalType | undefined>(undefined);
  const [structure, setStructure] = useState<Structure | undefined>(undefined);
  const [unilocularSubtype, setUnilocularSubtype] = useState<UnilocularSubtype | undefined>(undefined);
  const [customDescription, setCustomDescription] = useState("");
  const [septaCount, setSeptaCount] = useState<SeptaCount | undefined>(undefined);
  const [septaThickness, setSeptaThickness] = useState<SeptaThickness | undefined>(undefined);
  const [solidComponent, setSolidComponent] = useState<boolean | undefined>(undefined);
  const [solidType, setSolidType] = useState<SolidType | undefined>(undefined);
  const [echogenicity, setEchogenicity] = useState<Echogenicity | undefined>(undefined);
  const [lengthMm, setLengthMm] = useState("");
  const [widthMm, setWidthMm] = useState("");
  const [heightMm, setHeightMm] = useState("");
  const [ascites, setAscites] = useState(false);
  const [bloodFlow, setBloodFlow] = useState<BloodFlow | undefined>(undefined);
  const [peritonealNodules, setPeritonealNodules] = useState(false);
  const [iotaLesionType, setIotaLesionType] = useState<IotaLesionType | undefined>(undefined);
  const [papillaryProjectionCount, setPapillaryProjectionCount] = useState<PapillaryProjectionCount | undefined>(undefined);
  const [papillaryProjectionSurface, setPapillaryProjectionSurface] = useState<PapillaryProjectionSurface | undefined>(undefined);
  const [largestSolidDiameterMm, setLargestSolidDiameterMm] = useState("");
  const [cystLoculesOver10, setCystLoculesOver10] = useState<boolean | undefined>(undefined);
  const [acousticShadows, setAcousticShadows] = useState<boolean | undefined>(undefined);
  const [iotaColorScore, setIotaColorScore] = useState<IotaColorScore | undefined>(undefined);
  const [iotaCenterType, setIotaCenterType] = useState<IotaCenterType | undefined>(undefined);
  const [aiText, setAiText] = useState("AI-подсказка не запрошена.");
  const [onlineDot, setOnlineDot] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [queueHint, setQueueHint] = useState("");
  const [queueBadge, setQueueBadge] = useState<"idle" | "pending" | "failed" | "success">("idle");
  const [avgTimeToResult, setAvgTimeToResult] = useState<number | null>(null);
  const [lastTimeToResult, setLastTimeToResult] = useState<number | null>(null);
  const [aiSource, setAiSource] = useState<"none" | "live" | "queued_flush" | "queued_store">("none");
  const [aiUpdatedAt, setAiUpdatedAt] = useState<number | null>(null);
  const firstInteractionAtRef = useRef<number | null>(null);
  const firstResultTrackedRef = useRef(false);

  const input = useMemo<OradsInput>(
    () => ({
      localization,
      menopause,
      lesionKind,
      physiologicalType: physType,
      structure,
      unilocularSubtype,
      customDescription: customDescription.trim() || undefined,
      septaCount,
      septaThickness,
      solidComponent,
      solidType,
      echogenicity,
      lengthMm: Number(lengthMm) > 0 ? Number(lengthMm) : undefined,
      widthMm: Number(widthMm) > 0 ? Number(widthMm) : undefined,
      heightMm: Number(heightMm) > 0 ? Number(heightMm) : undefined,
      ascites,
      bloodFlow,
      peritonealNodules,
      iotaLesionType,
      papillaryProjectionCount,
      papillaryProjectionSurface,
      largestSolidDiameterMm: Number(largestSolidDiameterMm) > 0 ? Number(largestSolidDiameterMm) : undefined,
      cystLoculesOver10,
      acousticShadows,
      iotaColorScore,
      iotaCenterType,
    }),
    [
      localization,
      menopause,
      lesionKind,
      physType,
      structure,
      unilocularSubtype,
      customDescription,
      septaCount,
      septaThickness,
      solidComponent,
      solidType,
      echogenicity,
      lengthMm,
      widthMm,
      heightMm,
      ascites,
      bloodFlow,
      peritonealNodules,
      iotaLesionType,
      papillaryProjectionCount,
      papillaryProjectionSurface,
      largestSolidDiameterMm,
      cystLoculesOver10,
      acousticShadows,
      iotaColorScore,
      iotaCenterType,
    ]
  );

  const result = useMemo(() => calculateORADS(input), [input]);
  const iotaConsensus = useMemo(() => evaluateIotaConsensus2026(input, result), [input, result]);

  function markInteraction() {
    if (!firstInteractionAtRef.current) firstInteractionAtRef.current = Date.now();
  }

  useEffect(() => {
    void appendCaseToHistory(input, result);
  }, [input, result]);

  useEffect(() => {
    const p = route.params?.prefill;
    if (p) {
      setLocalization(p.localization ?? "ovarian");
      setMenopause(p.menopause);
      setLesionKind(p.lesionKind);
      setPhysType(p.physiologicalType);
      setStructure(p.structure);
      setUnilocularSubtype(p.unilocularSubtype);
      setCustomDescription(p.customDescription ?? "");
      setSeptaCount(p.septaCount);
      setSeptaThickness(p.septaThickness);
      setSolidComponent(p.solidComponent);
      setSolidType(p.solidType);
      setEchogenicity(p.echogenicity);
      setLengthMm(p.lengthMm ? String(p.lengthMm) : "");
      setWidthMm(p.widthMm ? String(p.widthMm) : "");
      setHeightMm(p.heightMm ? String(p.heightMm) : "");
      setAscites(!!p.ascites);
      setBloodFlow(p.bloodFlow);
      setPeritonealNodules(!!p.peritonealNodules);
      setIotaLesionType(p.iotaLesionType);
      setPapillaryProjectionCount(p.papillaryProjectionCount);
      setPapillaryProjectionSurface(p.papillaryProjectionSurface);
      setLargestSolidDiameterMm(p.largestSolidDiameterMm ? String(p.largestSolidDiameterMm) : "");
      setCystLoculesOver10(p.cystLoculesOver10);
      setAcousticShadows(p.acousticShadows);
      setIotaColorScore(p.iotaColorScore);
      setIotaCenterType(p.iotaCenterType);
    }
  }, [route.params?.prefill]);

  useEffect(() => {
    void loadUXMetric().then((m) => setAvgTimeToResult(m.samples > 0 ? m.avgTimeToResultSec : null));
    void getAIQueueSize().then(setQueueSize);
    const t = setInterval(async () => {
      try {
        const { done, failedCount } = await flushAIQueue();
        setQueueSize(failedCount);
        if (failedCount > 0) setQueueBadge("failed");
        else if (done.length > 0) setQueueBadge("success");
        else setQueueBadge("idle");
        if (failedCount > 0) {
          const status = await getAIQueueStatus();
          setQueueHint(
            status.lastError
              ? `Следующая попытка через ~${status.nextRetryInSec ?? 0}с. Последняя ошибка: ${status.lastError}`
              : `Следующая попытка через ~${status.nextRetryInSec ?? 0}с.`
          );
        } else {
          setQueueHint("");
        }
        if (done.length > 0) {
          setAiText(`Обработано отложенных AI-запросов: ${done.length}. Последний: ${done[done.length - 1].text}`);
          setOnlineDot(true);
          setAiSource("queued_flush");
          setAiUpdatedAt(Date.now());
        }
      } catch {
        setOnlineDot(false);
      }
    }, 12000);
    return () => clearInterval(t);
  }, []);

  async function onAskAI() {
    setQueueBadge("pending");
    markInteraction();
    const out = await requestAIOrQueue(input);
    if (out.queued) {
      setQueueSize(await getAIQueueSize());
      setAiText("Нет сети/API недоступен. Запрос сохранен и будет отправлен при подключении.");
      setOnlineDot(false);
      setQueueBadge("failed");
      setAiSource("queued_store");
      setAiUpdatedAt(Date.now());
      return;
    }
    setAiText(out.result?.text ?? "AI вернул пустой ответ.");
    setOnlineDot(true);
    setQueueBadge("success");
    setAiSource("live");
    setAiUpdatedAt(Date.now());
  }

  async function onExport() {
    const report = `${buildReportText(input, result)}\n\n${buildIotaConsensusReportText(iotaConsensus)}`;
    await Clipboard.setStringAsync(report);
    Alert.alert("Скопировано", "Заключение скопировано в буфер обмена.");
  }

  function onSaveToCase() {
    navigation.navigate("Case", {
      draftDescription: `${buildReportText(input, result)}\n\n${buildIotaConsensusReportText(iotaConsensus)}`,
      draftOrgan: "ovary",
      draftResultCategory: `O-RADS ${result.category} · IOTA 2026`,
      draftTimestamp: Date.now(),
      draftOradsInput: input,
    });
  }

  function onReset() {
    setLocalization("ovarian");
    setMenopause(undefined);
    setLesionKind(undefined);
    setPhysType(undefined);
    setStructure(undefined);
    setUnilocularSubtype(undefined);
    setCustomDescription("");
    setSeptaCount(undefined);
    setSeptaThickness(undefined);
    setSolidComponent(undefined);
    setSolidType(undefined);
    setEchogenicity(undefined);
    setLengthMm("");
    setWidthMm("");
    setHeightMm("");
    setAscites(false);
    setBloodFlow(undefined);
    setPeritonealNodules(false);
    setIotaLesionType(undefined);
    setPapillaryProjectionCount(undefined);
    setPapillaryProjectionSurface(undefined);
    setLargestSolidDiameterMm("");
    setCystLoculesOver10(undefined);
    setAcousticShadows(undefined);
    setIotaColorScore(undefined);
    setIotaCenterType(undefined);
    firstInteractionAtRef.current = null;
    firstResultTrackedRef.current = false;
    setLastTimeToResult(null);
  }

  useEffect(() => {
    if (firstResultTrackedRef.current) return;
    if (!localization || !menopause || !lesionKind) return;
    if (!firstInteractionAtRef.current) firstInteractionAtRef.current = Date.now();
    const sec = Number(((Date.now() - firstInteractionAtRef.current) / 1000).toFixed(2));
    firstResultTrackedRef.current = true;
    setLastTimeToResult(sec);
    void pushTimeToResult(sec).then((m) => setAvgTimeToResult(m.avgTimeToResultSec));
  }, [localization, menopause, lesionKind]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Назад</Text>
        </Pressable>
        <Text style={styles.title}>O-RADS + IOTA</Text>
        <View style={styles.rightHeader}>
          <Pressable onPress={() => navigation.navigate("ORADSHistory")}>
            <Text style={styles.history}>История</Text>
          </Pressable>
          <Pressable onPress={onReset}>
            <Text style={styles.reset}>Сбросить</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.offlineRow}>
        <View style={[styles.dot, { backgroundColor: onlineDot ? "#10B981" : "#DC2626" }]} />
        <Text style={styles.offlineText}>{onlineDot ? "Online" : "Offline"}</Text>
        <Text style={styles.queue}>AI очередь: {queueSize}</Text>
        <View
          style={[
            styles.badge,
            queueBadge === "pending" && styles.badgePending,
            queueBadge === "success" && styles.badgeSuccess,
            queueBadge === "failed" && styles.badgeFailed,
          ]}
        >
          <Text style={styles.badgeText}>
            {queueBadge === "pending"
              ? "pending"
              : queueBadge === "success"
                ? "success"
                : queueBadge === "failed"
                  ? "failed"
                  : "idle"}
          </Text>
        </View>
      </View>
      {queueHint ? <Text style={styles.queueHint}>{queueHint}</Text> : null}
      <View style={styles.metricsRow}>
        <Text style={styles.metricText}>TTFR: {lastTimeToResult == null ? "—" : `${lastTimeToResult}с`}</Text>
        <Text style={styles.metricText}>Среднее: {avgTimeToResult == null ? "—" : `${avgTimeToResult}с`}</Text>
        <Text style={styles.metricText}>
          AI: {aiSource === "none" ? "—" : aiSource}
          {aiUpdatedAt ? ` @ ${new Date(aiUpdatedAt).toLocaleTimeString()}` : ""}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <StepCard title="ШАГ 1 — Локализация" required={!localization}>
          <View style={styles.rowWrap}>
            <SelectChip
              label="Овариальное/аднексальное"
              selected={localization === "ovarian"}
              onPress={() => {
                markInteraction();
                setLocalization("ovarian");
              }}
            />
            <SelectChip
              label="Экстраовариальное"
              selected={localization === "extraovarian"}
              onPress={() => {
                markInteraction();
                setLocalization("extraovarian");
              }}
            />
          </View>
          {localization === "extraovarian" ? <Text style={styles.warn}>Этот калькулятор только для яичников/придатков.</Text> : null}
        </StepCard>

        <StepCard title="ШАГ 2 — Статус пациентки" required={!menopause}>
          <View style={styles.rowWrap}>
            <SelectChip
              label="Пременопауза"
              selected={menopause === "pre"}
              onPress={() => {
                markInteraction();
                setMenopause("pre");
              }}
            />
            <SelectChip
              label="Постменопауза"
              selected={menopause === "post"}
              onPress={() => {
                markInteraction();
                setMenopause("post");
              }}
            />
          </View>
        </StepCard>

        {menopause ? (
          <StepCard title="ШАГ 3 — Тип образования" required={!lesionKind}>
            <View style={styles.rowWrap}>
              <SelectChip
                label="Физиологическое"
                selected={lesionKind === "physiological"}
                onPress={() => {
                  markInteraction();
                  setLesionKind("physiological");
                }}
              />
              <SelectChip
                label="Нефизиологическое"
                selected={lesionKind === "nonphysiological"}
                onPress={() => {
                  markInteraction();
                  setLesionKind("nonphysiological");
                }}
              />
            </View>
            {lesionKind === "physiological" && menopause === "pre" ? (
              <View style={styles.rowWrap}>
                <SelectChip label="Фолликул" selected={physType === "follicle"} onPress={() => setPhysType("follicle")} />
                <SelectChip label="Желтое тело" selected={physType === "corpus_luteum"} onPress={() => setPhysType("corpus_luteum")} />
              </View>
            ) : null}
          </StepCard>
        ) : null}

        {lesionKind === "nonphysiological" ? (
          <>
            <StepCard title="ШАГ 4 — Камерность и структура" required={!structure}>
              <View style={styles.rowWrap}>
                <SelectChip label="Однокамерное" selected={structure === "unilocular"} onPress={() => setStructure("unilocular")} />
                <SelectChip label="Многокамерное" selected={structure === "multilocular"} onPress={() => setStructure("multilocular")} />
                <SelectChip label="Солидное" selected={structure === "solid"} onPress={() => setStructure("solid")} />
              </View>
            </StepCard>

            {structure === "unilocular" ? (
              <StepCard title="ШАГ 5 — Детали (однокамерное)" required={!unilocularSubtype}>
                <View style={styles.rowWrap}>
                  {[
                    ["simple_cyst", "Простая киста"],
                    ["hemorrhagic", "Геморрагическая"],
                    ["endometrioma", "Эндометриома"],
                    ["dermoid", "Дермоидная"],
                    ["paraovarian", "Параовариальная"],
                    ["peritoneal_inclusion", "Перитонеальная инклюзия"],
                    ["hydrosalpinx", "Гидросальпинкс"],
                    ["other", "Другое"],
                  ].map(([v, label]) => (
                    <SelectChip
                      key={v}
                      label={label}
                      selected={unilocularSubtype === (v as UnilocularSubtype)}
                      onPress={() => setUnilocularSubtype(v as UnilocularSubtype)}
                    />
                  ))}
                </View>
                {unilocularSubtype === "other" ? (
                  <TextInput
                    value={customDescription}
                    onChangeText={setCustomDescription}
                    style={styles.input}
                    placeholder="Ручное описание..."
                  />
                ) : null}
              </StepCard>
            ) : null}

            {structure === "multilocular" || structure === "solid" ? (
              <StepCard title="ШАГ 5 — Детали (многокамерное/солидное)">
                <Text style={styles.sub}>Количество перегородок</Text>
                <View style={styles.rowWrap}>
                  {["0", "1-3", ">3"].map((v) => (
                    <SelectChip key={v} label={v} selected={septaCount === v} onPress={() => setSeptaCount(v as SeptaCount)} />
                  ))}
                </View>
                <Text style={styles.sub}>Толщина перегородок</Text>
                <View style={styles.rowWrap}>
                  <SelectChip label="Тонкие <3мм" selected={septaThickness === "thin"} onPress={() => setSeptaThickness("thin")} />
                  <SelectChip label="Толстые ≥3мм" selected={septaThickness === "thick"} onPress={() => setSeptaThickness("thick")} />
                </View>
                <Text style={styles.sub}>Солидный компонент</Text>
                <View style={styles.rowWrap}>
                  <SelectChip label="Нет" selected={solidComponent === false} onPress={() => setSolidComponent(false)} />
                  <SelectChip label="Есть" selected={solidComponent === true} onPress={() => setSolidComponent(true)} />
                </View>
                {solidComponent ? (
                  <>
                    <Text style={styles.sub}>Тип солидного компонента</Text>
                    <View style={styles.rowWrap}>
                      <SelectChip label="Гладкий" selected={solidType === "smooth"} onPress={() => setSolidType("smooth")} />
                      <SelectChip label="Неровный" selected={solidType === "irregular"} onPress={() => setSolidType("irregular")} />
                      <SelectChip label="Папиллярный" selected={solidType === "papillary"} onPress={() => setSolidType("papillary")} />
                    </View>
                    <Text style={styles.sub}>Эхогенность</Text>
                    <View style={styles.rowWrap}>
                      <SelectChip label="Анэхогенный" selected={echogenicity === "anechoic"} onPress={() => setEchogenicity("anechoic")} />
                      <SelectChip label="Гипоэхогенный" selected={echogenicity === "hypo"} onPress={() => setEchogenicity("hypo")} />
                      <SelectChip label="Изоэхогенный" selected={echogenicity === "iso"} onPress={() => setEchogenicity("iso")} />
                      <SelectChip label="Гиперэхогенный" selected={echogenicity === "hyper"} onPress={() => setEchogenicity("hyper")} />
                    </View>
                  </>
                ) : null}
              </StepCard>
            ) : null}
          </>
        ) : null}

        <StepCard title="ШАГ 6 — Дополнительные признаки">
          <Text style={styles.sub}>Размеры (мм)</Text>
          <View style={styles.row}>
            <TextInput value={lengthMm} onChangeText={setLengthMm} placeholder="Длина" keyboardType="numeric" style={styles.inputFlex} />
            <TextInput value={widthMm} onChangeText={setWidthMm} placeholder="Ширина" keyboardType="numeric" style={styles.inputFlex} />
            <TextInput value={heightMm} onChangeText={setHeightMm} placeholder="Высота" keyboardType="numeric" style={styles.inputFlex} />
          </View>
          <Text style={styles.sub}>Асцит</Text>
          <View style={styles.rowWrap}>
            <SelectChip label="Нет" selected={!ascites} onPress={() => setAscites(false)} />
            <SelectChip label="Да" selected={ascites} onPress={() => setAscites(true)} />
          </View>
          <Text style={styles.sub}>Кровоток ЦДК</Text>
          <View style={styles.rowWrap}>
            {[
              ["none", "Нет"],
              ["minimal", "Минимальный"],
              ["moderate", "Умеренный"],
              ["marked", "Выраженный"],
            ].map(([v, label]) => (
              <SelectChip key={v} label={label} selected={bloodFlow === v} onPress={() => setBloodFlow(v as BloodFlow)} />
            ))}
          </View>
          <Text style={styles.sub}>Перитонеальные высыпания</Text>
          <View style={styles.rowWrap}>
            <SelectChip label="Нет" selected={!peritonealNodules} onPress={() => setPeritonealNodules(false)} />
            <SelectChip label="Да" selected={peritonealNodules} onPress={() => setPeritonealNodules(true)} />
          </View>
        </StepCard>

        <StepCard title="ШАГ 7 — IOTA 2026 / переменные ADNEX">
          <Text style={styles.iotaHint}>
            {"Термины по предоставленным данным консенсуса: тип образования, солидный компонент >=3 мм, папиллярные проекции, камеры кисты, акустические тени, асцит, цветовой балл и тип центра."}
          </Text>
          <Text style={styles.sub}>Тип образования</Text>
          <View style={styles.rowWrap}>
            {[
              ["unilocular_cyst", "Однокамерная киста"],
              ["unilocular_solid_cyst", "Однокамерно-солидное"],
              ["multilocular_cyst", "Многокамерная киста"],
              ["multilocular_solid_cyst", "Многокамерно-солидное"],
              ["solid_tumor", "Солидная опухоль"],
              ["not_classifiable", "Не классифицируется"],
            ].map(([v, label]) => (
              <SelectChip key={v} label={label} selected={iotaLesionType === v} onPress={() => setIotaLesionType(v as IotaLesionType)} />
            ))}
          </View>

          <Text style={styles.sub}>Наибольший солидный компонент (мм)</Text>
          <TextInput
            value={largestSolidDiameterMm}
            onChangeText={setLargestSolidDiameterMm}
            placeholder=">=3 мм считается солидным компонентом"
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.sub}>Количество папиллярных проекций</Text>
          <View style={styles.rowWrap}>
            {[
              ["0", "0"],
              ["1", "1"],
              ["2", "2"],
              ["3", "3"],
              ["4plus", "≥4"],
            ].map(([v, label]) => (
              <SelectChip
                key={v}
                label={label}
                selected={papillaryProjectionCount === v}
                onPress={() => setPapillaryProjectionCount(v as PapillaryProjectionCount)}
              />
            ))}
          </View>

          <Text style={styles.sub}>Поверхность папиллярной проекции</Text>
          <View style={styles.rowWrap}>
            <SelectChip label="Гладкая" selected={papillaryProjectionSurface === "smooth"} onPress={() => setPapillaryProjectionSurface("smooth")} />
            <SelectChip label="Неровная" selected={papillaryProjectionSurface === "irregular"} onPress={() => setPapillaryProjectionSurface("irregular")} />
          </View>

          <Text style={styles.sub}>Более 10 камер кисты?</Text>
          <View style={styles.rowWrap}>
            <SelectChip label="Нет" selected={cystLoculesOver10 === false} onPress={() => setCystLoculesOver10(false)} />
            <SelectChip label="Да" selected={cystLoculesOver10 === true} onPress={() => setCystLoculesOver10(true)} />
          </View>

          <Text style={styles.sub}>Акустические тени</Text>
          <View style={styles.rowWrap}>
            <SelectChip label="Нет" selected={acousticShadows === false} onPress={() => setAcousticShadows(false)} />
            <SelectChip label="Да" selected={acousticShadows === true} onPress={() => setAcousticShadows(true)} />
          </View>

          <Text style={styles.sub}>Цветовой балл IOTA</Text>
          <View style={styles.rowWrap}>
            {[
              ["1", "1 · нет кровотока"],
              ["2", "2 · минимальный"],
              ["3", "3 · умеренный"],
              ["4", "4 · выраженный"],
            ].map(([v, label]) => (
              <SelectChip key={v} label={label} selected={iotaColorScore === v} onPress={() => setIotaColorScore(v as IotaColorScore)} />
            ))}
          </View>

          <Text style={styles.sub}>Тип центра</Text>
          <View style={styles.rowWrap}>
            <SelectChip label="Онкологический центр" selected={iotaCenterType === "oncology"} onPress={() => setIotaCenterType("oncology")} />
            <SelectChip label="Другой центр" selected={iotaCenterType === "other"} onPress={() => setIotaCenterType("other")} />
          </View>
        </StepCard>

        <IotaVisualGuide input={input} />

        <IotaConsensusPanel consensus={iotaConsensus} />

        <Pressable style={styles.export} onPress={onExport}>
          <Text style={styles.exportText}>Экспорт O-RADS + IOTA (копировать)</Text>
        </Pressable>
        <Pressable style={styles.saveCaseBtn} onPress={onSaveToCase}>
          <Text style={styles.saveCaseText}>Сохранить как кейс</Text>
        </Pressable>
      </ScrollView>

      <ResultPanel result={result} aiText={aiText} onAskAI={onAskAI} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FB" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
  },
  rightHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  back: { color: "#2563EB", fontWeight: "700" },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  history: { color: "#2563EB", fontWeight: "700" },
  reset: { color: "#ea580c", fontWeight: "700" },
  offlineRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingBottom: 6 },
  dot: { width: 10, height: 10, borderRadius: 999 },
  offlineText: { color: "#64748B", fontSize: 12 },
  queue: { color: "#475569", fontSize: 12, marginLeft: 8, fontWeight: "700" },
  badge: {
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: "#e2e8f0",
    marginLeft: 8,
  },
  badgePending: { backgroundColor: "#fde68a" },
  badgeSuccess: { backgroundColor: "#bbf7d0" },
  badgeFailed: { backgroundColor: "#fecaca" },
  badgeText: { fontSize: 11, fontWeight: "800", color: "#334155" },
  queueHint: { color: "#64748B", fontSize: 11, paddingHorizontal: 14, paddingBottom: 4 },
  metricsRow: { paddingHorizontal: 14, paddingBottom: 4, gap: 2 },
  metricText: { color: "#64748B", fontSize: 11 },
  content: { padding: 14, gap: 12, paddingBottom: 230 },
  rowWrap: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  row: { flexDirection: "row", gap: 8 },
  sub: { color: "#475569", fontSize: 12, fontWeight: "700", marginTop: 2 },
  iotaHint: { color: "#64748b", fontSize: 12, lineHeight: 17 },
  warn: { color: "#b91c1c", fontSize: 12, fontWeight: "700" },
  input: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  inputFlex: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  export: {
    borderRadius: 10,
    backgroundColor: "#2563EB",
    alignItems: "center",
    paddingVertical: 12,
  },
  exportText: { color: "#fff", fontWeight: "800" },
  saveCaseBtn: {
    borderRadius: 10,
    backgroundColor: "#0f766e",
    alignItems: "center",
    paddingVertical: 12,
  },
  saveCaseText: { color: "#fff", fontWeight: "800" },
});
