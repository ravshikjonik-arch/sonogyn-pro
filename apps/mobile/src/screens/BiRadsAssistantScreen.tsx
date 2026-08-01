import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import {
  type GestureResponderEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, Ellipse, Line, Path, Text as SvgText } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { BiRadsMmgMobilePanel } from "../components/birads/BiRadsMmgMobilePanel";
import { branding } from "../config/branding";
import {
  BI_RADS_VERSION,
  biradsOptions,
  buildBiradsBrochureProtocol,
  defaultBiradsBrochureInput,
  evaluateBirads,
  type BiradsInput,
  type BiradsBrochureInput,
} from "../guidelines/birads";
import {
  BIRADS_MMG_CATEGORY_RECOMMENDATIONS,
  combineBiradsCategories,
  type BiradsCategoryCode,
} from "@repo/birads-mmg";
import type { RootStackParamList } from "../navigation/paramLists";
import { theme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "BiRadsAssistant">;
type BreastSide = "right" | "left";
type BreastPoint = { x: number; y: number };
type Modality = "us" | "mmg" | "combo";

const FIELD_ORDER: (keyof BiradsInput)[] = [
  "findingType",
  "shape",
  "orientation",
  "margin",
  "echoPattern",
  "posteriorFeatures",
  "vascularity",
];

const NON_MASS_FIELD_ORDER: (keyof BiradsInput)[] = [
  "nonMassEchogenicity",
  "nonMassDistribution",
  "nonMassAssociatedFeatures",
];

const FIELD_TITLE: Record<keyof BiradsInput, string> = {
  findingType: "Тип находки",
  shape: "Форма",
  orientation: "Ориентация",
  margin: "Контур (margin)",
  echoPattern: "Эхо-структура",
  posteriorFeatures: "Признаки позади очагового образования",
  vascularity: "Васкуляризация (ЦДК)",
  nonMassEchogenicity: "Non-mass: эхогенность / вид",
  nonMassDistribution: "Non-mass: распределение",
  nonMassAssociatedFeatures: "Non-mass: ассоциированные признаки",
};

const defaultInput: BiradsInput = {
  findingType: "mass",
  shape: "oval",
  margin: "circumscribed",
  echoPattern: "anechoic",
  vascularity: "none",
  orientation: "parallel",
  posteriorFeatures: "none",
  nonMassEchogenicity: "not_applicable",
  nonMassDistribution: "not_applicable",
  nonMassAssociatedFeatures: "not_applicable",
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatHour(point: BreastPoint) {
  const dx = point.x - 0.5;
  const dy = point.y - 0.5;
  const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
  const normalized = (angle + 360) % 360;
  const rounded = Math.round(normalized / 30) % 12;
  return rounded === 0 ? 12 : rounded;
}

function getBreastLocation(point: BreastPoint, side: BreastSide) {
  const dx = point.x - 0.5;
  const dy = point.y - 0.5;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const distanceCm = Math.round(clamp((dist / 0.43) * 8, 0, 12) * 10) / 10;
  const upper = dy < 0;
  const outer = side === "right" ? dx < 0 : dx > 0;
  const quadrant =
    dist < 0.08
      ? "центральная / ретроареолярная зона"
      : upper && outer
        ? "ВНК"
        : upper && !outer
          ? "ВВК"
          : !upper && outer
            ? "ННК"
            : "НВК";
  const quadrantFull =
    quadrant === "ВНК"
      ? "верхне-наружный квадрант"
      : quadrant === "ВВК"
        ? "верхне-внутренний квадрант"
        : quadrant === "ННК"
          ? "нижне-наружный квадрант"
          : quadrant === "НВК"
            ? "нижне-внутренний квадрант"
            : quadrant;

  return {
    sideLabel: side === "right" ? "Правая молочная железа" : "Левая молочная железа",
    quadrant,
    quadrantFull,
    hour: formatHour(point),
    distanceCm,
  };
}

function formatBreastLocation(point: BreastPoint, side: BreastSide) {
  const loc = getBreastLocation(point, side);
  return `${loc.sideLabel}: ${loc.quadrant} (${loc.quadrantFull}), на ${loc.hour} часах, ${loc.distanceCm} см от соска.`;
}

function BreastLocator({
  side,
  point,
  size,
  onChangeSide,
  onChangePoint,
}: {
  side: BreastSide;
  point: BreastPoint;
  size: number;
  onChangeSide: (side: BreastSide) => void;
  onChangePoint: (point: BreastPoint) => void;
}) {
  const loc = getBreastLocation(point, side);
  const cx = point.x * 300;
  const cy = point.y * 300;
  const lateralLeft = side === "right";
  const cursorStyle: ViewStyle | null =
    Platform.OS === "web"
      ? ({
          cursor: "crosshair",
          touchAction: "none",
          userSelect: "none",
        } as unknown as ViewStyle)
      : null;

  function setFromEvent(event: GestureResponderEvent) {
    const { locationX, locationY } = event.nativeEvent;
    onChangePoint({
      x: clamp(locationX / size, 0.08, 0.92),
      y: clamp(locationY / size, 0.08, 0.92),
    });
  }

  return (
    <View style={styles.locatorCard}>
      <View style={styles.locatorTop}>
        <View style={styles.locatorTitleBlock}>
          <Text style={styles.locatorKicker}>Локализация BI-RADS</Text>
          <Text style={styles.locatorTitle}>Схема молочной железы</Text>
        </View>
        <View style={styles.sideChips}>
          <Pressable style={[styles.sideChip, side === "right" && styles.sideChipOn]} onPress={() => onChangeSide("right")}>
            <Text style={[styles.sideChipText, side === "right" && styles.sideChipTextOn]}>Правая</Text>
          </Pressable>
          <Pressable style={[styles.sideChip, side === "left" && styles.sideChipOn]} onPress={() => onChangeSide("left")}>
            <Text style={[styles.sideChipText, side === "left" && styles.sideChipTextOn]}>Левая</Text>
          </Pressable>
        </View>
      </View>

      <View
        style={[styles.breastCanvas, { width: size, height: size }, cursorStyle]}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={setFromEvent}
        onResponderMove={setFromEvent}
      >
        <Svg width="100%" height="100%" viewBox="0 0 300 300">
          <Ellipse cx="150" cy="150" rx="118" ry="128" fill="#FFF1F2" stroke="#BE123C" strokeWidth="3" />
          <Path d="M72 70 C115 32 188 30 230 72" stroke="#FDA4AF" strokeWidth="12" strokeLinecap="round" opacity={0.5} />
          <Line x1="150" y1="28" x2="150" y2="272" stroke="#F43F5E" strokeWidth="2" strokeDasharray="6 7" opacity={0.75} />
          <Line x1="35" y1="150" x2="265" y2="150" stroke="#F43F5E" strokeWidth="2" strokeDasharray="6 7" opacity={0.75} />
          <Circle cx="150" cy="150" r="22" fill="#F97316" stroke="#9A3412" strokeWidth="3" />
          <Circle cx="150" cy="150" r="7" fill="#7C2D12" />
          <SvgText x="150" y="20" textAnchor="middle" fontSize="12" fontWeight="900" fill="#9F1239">
            12
          </SvgText>
          <SvgText x="282" y="154" textAnchor="middle" fontSize="12" fontWeight="900" fill="#9F1239">
            3
          </SvgText>
          <SvgText x="150" y="292" textAnchor="middle" fontSize="12" fontWeight="900" fill="#9F1239">
            6
          </SvgText>
          <SvgText x="18" y="154" textAnchor="middle" fontSize="12" fontWeight="900" fill="#9F1239">
            9
          </SvgText>
          <SvgText x={lateralLeft ? 64 : 212} y="68" textAnchor="middle" fontSize="13" fontWeight="900" fill="#1D4ED8">
            ВНК
          </SvgText>
          <SvgText x={lateralLeft ? 212 : 64} y="68" textAnchor="middle" fontSize="13" fontWeight="900" fill="#6D28D9">
            ВВК
          </SvgText>
          <SvgText x={lateralLeft ? 64 : 212} y="235" textAnchor="middle" fontSize="13" fontWeight="900" fill="#1D4ED8">
            ННК
          </SvgText>
          <SvgText x={lateralLeft ? 212 : 64} y="235" textAnchor="middle" fontSize="13" fontWeight="900" fill="#6D28D9">
            НВК
          </SvgText>
          <Path d={`M${cx - 15} ${cy} H${cx + 15} M${cx} ${cy - 15} V${cy + 15}`} stroke="#7C2D12" strokeWidth="2.2" strokeLinecap="round" />
          <Circle cx={cx} cy={cy} r="16" fill="#F97316" stroke="#7C2D12" strokeWidth="3" opacity={0.95} />
          <Circle cx={cx - 5} cy={cy - 5} r="5" fill="#FED7AA" opacity={0.8} />
        </Svg>
      </View>

      <View style={styles.locationResult}>
        <Text style={styles.locationMain}>{formatBreastLocation(point, side)}</Text>
        <Text style={styles.locationSub}>
          Авторасчёт: {loc.quadrant}, {loc.hour} часов, {loc.distanceCm} см от соска. Проверьте сторону груди и клинический контекст.
        </Text>
      </View>
    </View>
  );
}

export default function BiRadsAssistantScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const [modality, setModality] = useState<Modality>("us");
  const [input, setInput] = useState<BiradsInput>({ ...defaultInput });
  const [breastSide, setBreastSide] = useState<BreastSide>("right");
  const [breastPoint, setBreastPoint] = useState<BreastPoint>({ x: 0.34, y: 0.34 });
  const [comboMmg, setComboMmg] = useState("BI-RADS 2");
  const result = useMemo(() => evaluateBirads(input), [input]);
  const localizationText = useMemo(() => formatBreastLocation(breastPoint, breastSide), [breastPoint, breastSide]);
  const locatorSize = Math.min(width - theme.spacing.md * 2 - 34, 340);
  const combined = useMemo(
    () => combineBiradsCategories({ usCategory: result.category, mmgCategory: comboMmg }),
    [result.category, comboMmg],
  );

  function setField<K extends keyof BiradsInput>(key: K, value: BiradsInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function onSaveAsCase() {
    const loc = formatBreastLocation(breastPoint, breastSide);
    const brochureInput: BiradsBrochureInput = {
      ...defaultBiradsBrochureInput,
      ...input,
      localizationText: loc,
    };
    const draftDescription = buildBiradsBrochureProtocol(brochureInput);
    navigation.navigate("Case", {
      caseId: undefined,
      draftOrgan: "breast",
      draftResultCategory: result.category,
      draftDescription,
      draftTimestamp: Date.now(),
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>МЖ · BI-RADS</Text>
          <Text style={styles.version} numberOfLines={2}>
            УЗИ и ММГ молочных желёз · для врачей
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.modalityRow}>
        {(
          [
            ["us", "УЗИ"],
            ["mmg", "ММГ"],
            ["combo", "Комбо"],
          ] as const
        ).map(([id, label]) => (
          <Pressable
            key={id}
            style={[styles.modalityChip, modality === id && styles.modalityChipOn]}
            onPress={() => setModality(id)}
          >
            <Text style={[styles.modalityText, modality === id && styles.modalityTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {modality === "mmg" ? <BiRadsMmgMobilePanel /> : null}

      {modality === "combo" ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.blockTitle}>УЗИ: {result.category}</Text>
          <Text style={styles.helpText}>Категория из блока УЗИ (переключитесь и заполните дескрипторы).</Text>
          <Text style={styles.blockTitle}>ММГ (введите категорию)</Text>
          <View style={styles.chips}>
            {(["0", "1", "2", "3", "4A", "4B", "4C", "5", "6"] as BiradsCategoryCode[]).map((code) => {
              const selected = comboMmg === `BI-RADS ${code}` || comboMmg === code;
              return (
                <Pressable
                  key={code}
                  style={[styles.chip, selected && styles.chipOn]}
                  onPress={() => setComboMmg(`BI-RADS ${code}`)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextOn]}>{code}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Итог: BI-RADS {combined.suggestedCode}</Text>
            <Text style={styles.helpText}>{combined.reasonRu}</Text>
            <Text style={styles.helpText}>{BIRADS_MMG_CATEGORY_RECOMMENDATIONS[combined.suggestedCode]}</Text>
          </View>
        </ScrollView>
      ) : null}

      {modality === "us" ? (
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.helpText}>
          УЗИ молочных желёз · {BI_RADS_VERSION} · полный протокол также на web
        </Text>
        <BreastLocator
          side={breastSide}
          point={breastPoint}
          size={locatorSize}
          onChangeSide={setBreastSide}
          onChangePoint={setBreastPoint}
        />

        {[...FIELD_ORDER, ...(input.findingType === "non_mass" ? NON_MASS_FIELD_ORDER : [])].map((key) => (
          <View key={key} style={styles.block}>
            <Text style={styles.blockTitle}>{FIELD_TITLE[key]}</Text>
            {key === "findingType" ? (
              <Text style={styles.helpText}>
                Если находка описывается как non-mass, ниже появятся отдельные характеристики. Итоговую категорию всё равно подтверждает врач по полному BI-RADS атласу.
              </Text>
            ) : null}
            <View style={styles.chips}>
              {(biradsOptions[key] ?? []).map((opt) => {
                const selected = input[key] === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.chip, selected && styles.chipOn]}
                    onPress={() => setField(key, opt.value as BiradsInput[typeof key])}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextOn]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.resultCard}>
          <Text style={styles.resultCat}>{result.category}</Text>
          <Text style={styles.resultLocation}>{localizationText}</Text>
          <Text style={styles.resultRisk}>{result.riskRange}</Text>
          <Text style={styles.resultBody}>{result.description}</Text>
          <Text style={styles.resultImp}>{result.impression}</Text>
          {result.category.includes("BI-RADS 5") || result.category.includes("BI-RADS 6") ? (
            <View style={styles.premiumNote}>
              <Text style={styles.premiumNoteText}>Высокий риск · онкомаршрут · верификация</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.secondary} onPress={() => setInput({ ...defaultInput })}>
            <Text style={styles.secondaryText}>Сброс</Text>
          </Pressable>
          <Pressable style={styles.primary} onPress={onSaveAsCase}>
            <Text style={styles.primaryText}>Сохранить как кейс</Text>
          </Pressable>
        </View>
      </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: branding.colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
    backgroundColor: "#fff",
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  backText: { fontSize: 18, color: theme.colors.text, fontWeight: "600" },
  headerCenter: { flex: 1, alignItems: "center" },
  title: { fontSize: 17, fontWeight: "800", color: branding.colors.text },
  version: { fontSize: 9, color: branding.colors.textSecondary, marginTop: 2, paddingHorizontal: 8 },
  headerSpacer: { width: 40 },
  modalityRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  modalityChip: {
    flex: 1,
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  modalityChipOn: { backgroundColor: "#be123c", borderColor: "#be123c" },
  modalityText: { fontSize: 13, fontWeight: "800", color: "#64748b" },
  modalityTextOn: { color: "#fff" },
  scroll: { padding: theme.spacing.md, paddingBottom: 32 },
  locatorCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e8ecf1",
    padding: 16,
    marginBottom: 22,
    gap: 12,
    ...theme.shadow.card,
  },
  locatorTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  locatorTitleBlock: { flex: 1, minWidth: 0 },
  locatorKicker: { color: "#be123c", fontSize: 11, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  locatorTitle: { color: branding.colors.text, fontSize: 19, fontWeight: "900", marginTop: 4 },
  sideChips: { flexDirection: "row", gap: 6 },
  sideChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  sideChipOn: { borderColor: "#be123c", backgroundColor: "#fff1f2" },
  sideChipText: { color: "#64748b", fontSize: 12, fontWeight: "800" },
  sideChipTextOn: { color: "#be123c" },
  breastCanvas: {
    alignSelf: "center",
    borderRadius: 24,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    overflow: "hidden",
  },
  locationResult: { borderRadius: 16, backgroundColor: "#fff1f2", borderWidth: 1, borderColor: "#fecdd3", padding: 12, gap: 4 },
  locationMain: { color: "#9f1239", fontSize: 15, fontWeight: "900", lineHeight: 20 },
  locationSub: { color: "#475569", fontSize: 12, lineHeight: 17 },
  block: { marginBottom: 22 },
  blockTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  helpText: { color: "#64748b", fontSize: 12, lineHeight: 17, marginBottom: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    maxWidth: "100%",
  },
  chipOn: {
    borderColor: branding.colors.primary,
    backgroundColor: "#eff6ff",
  },
  chipText: { fontSize: 13, color: branding.colors.text, fontWeight: "600" },
  chipTextOn: { color: branding.colors.primary },
  resultCard: {
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e8ecf1",
    ...theme.shadow.card,
  },
  resultTitle: { fontSize: 18, fontWeight: "800", color: branding.colors.text, marginBottom: 6 },
  resultCat: { fontSize: 22, fontWeight: "800", color: branding.colors.text },
  resultLocation: { fontSize: 13, fontWeight: "800", color: "#be123c", marginTop: 8, lineHeight: 19 },
  resultRisk: { fontSize: 14, fontWeight: "700", color: branding.colors.primary, marginTop: 4 },
  resultBody: { fontSize: 14, color: branding.colors.textSecondary, marginTop: 12, lineHeight: 21 },
  resultImp: { fontSize: 14, color: branding.colors.text, marginTop: 12, lineHeight: 21, fontWeight: "600" },
  premiumNote: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#ffe4e6",
    borderWidth: 1,
    borderColor: "#fda4af",
  },
  premiumNoteText: { fontSize: 13, fontWeight: "800", color: "#9f1239", lineHeight: 18 },
  actions: { marginTop: 20, gap: 10 },
  primary: {
    backgroundColor: branding.colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  secondary: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
  },
  secondaryText: { color: branding.colors.text, fontWeight: "700", fontSize: 14 },
});
