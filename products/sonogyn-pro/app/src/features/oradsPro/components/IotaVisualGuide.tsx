import { ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from "react-native-svg";
import type { IotaLesionType, OradsInput } from "../types";

type Props = {
  input: OradsInput;
};

type VisualTerm = {
  key: string;
  title: string;
  subtitle: string;
  definition: string;
  variant: MiniFigureVariant;
  accent: string;
};

type MiniFigureVariant =
  | "lesion"
  | "solid"
  | "papillary"
  | "irregular"
  | "measure"
  | "locules"
  | "shadow"
  | "ascites"
  | "color"
  | "center";

const lesionLabels: Record<IotaLesionType, string> = {
  unilocular_cyst: "Однокамерная киста",
  unilocular_solid_cyst: "Однокамерно-солидное образование",
  multilocular_cyst: "Многокамерная киста",
  multilocular_solid_cyst: "Многокамерно-солидное образование",
  solid_tumor: "Солидная опухоль",
  not_classifiable: "Не классифицируется",
};

const terms: VisualTerm[] = [
  {
    key: "lesion",
    title: "Тип образования",
    subtitle: "6 морфологических типов",
    definition: "Однокамерное, однокамерно-солидное, многокамерное, многокамерно-солидное, солидное или не классифицируемое.",
    variant: "lesion",
    accent: "#6D28D9",
  },
  {
    key: "solid",
    title: "Солидный компонент",
    subtitle: "порог >=3 мм",
    definition: "Солидная ткань считается компонентом, если хотя бы один диаметр составляет 3 мм или больше.",
    variant: "solid",
    accent: "#0F766E",
  },
  {
    key: "papillary",
    title: "Папиллярная проекция",
    subtitle: "высота >=3 мм",
    definition: "Солидная ткань, выступающая в полость кисты. Укажите 0, 1, 2, 3 или >=4 и оцените поверхность.",
    variant: "papillary",
    accent: "#2563EB",
  },
  {
    key: "irregular",
    title: "Неровная солидная опухоль",
    subtitle: "углы, дольчатость, контур",
    definition: "Острые углы, дольчатость, спикулы, неровная стенка или неправильный контур повышают настороженность.",
    variant: "irregular",
    accent: "#DC2626",
  },
  {
    key: "measure",
    title: "Измерения",
    subtitle: "три ортогональные плоскости",
    definition: "Измеряйте образование и солидные компоненты в мм по наибольшим воспроизводимым размерам.",
    variant: "measure",
    accent: "#7C3AED",
  },
  {
    key: "locules",
    title: "Камерность кисты",
    subtitle: ">10: да / нет",
    definition: "Оцените число камер во всём образовании. Для солидных опухолей ответ на '>10 камер' — нет.",
    variant: "locules",
    accent: "#0891B2",
  },
  {
    key: "shadow",
    title: "Акустические тени",
    subtitle: "есть / нет",
    definition: "Краевые тени возможны у округлых образований и описываются отдельно от внутренних теней.",
    variant: "shadow",
    accent: "#475569",
  },
  {
    key: "ascites",
    title: "Асцит",
    subtitle: "вне дугласова пространства",
    definition: "Жидкость выше дна матки или в кармане Моррисона учитывается как асцит в структурированном описании.",
    variant: "ascites",
    accent: "#0284C7",
  },
  {
    key: "color",
    title: "Цветовой балл",
    subtitle: "от 1 до 4",
    definition: "Укажите максимальную васкуляризацию: 1 — нет, 2 — минимальная, 3 — умеренная, 4 — выраженная.",
    variant: "color",
    accent: "#EA580C",
  },
  {
    key: "center",
    title: "Тип центра",
    subtitle: "онкоцентр / другой",
    definition: "В ADNEX тип центра используется как калибровочная переменная: онкологический или другой центр.",
    variant: "center",
    accent: "#334155",
  },
];

function MiniFigure({ variant, accent }: { variant: MiniFigureVariant; accent: string }) {
  const common = { stroke: "#0F172A", strokeWidth: 1.3, fill: "none" };
  return (
    <Svg width={78} height={58} viewBox="0 0 78 58">
      <Defs>
        <LinearGradient id={`g-${variant}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#F8FAFC" />
          <Stop offset="1" stopColor="#E2E8F0" />
        </LinearGradient>
      </Defs>
      <Rect x="1" y="1" width="76" height="56" rx="16" fill={`url(#g-${variant})`} />
      {variant === "lesion" ? (
        <G>
          <Path d="M18 33 C16 20 27 14 39 17 C53 20 62 27 57 39 C52 51 28 49 20 40 Z" fill="#D9E2EF" stroke={accent} strokeWidth="2" />
          <Circle cx="35" cy="30" r="5" fill="#94A3B8" opacity={0.6} />
          <Circle cx="48" cy="35" r="7" fill="#CBD5E1" opacity={0.9} />
        </G>
      ) : null}
      {variant === "solid" ? (
        <G>
          <Circle cx="39" cy="29" r="20" fill="#E2E8F0" stroke={accent} strokeWidth="2" />
          <Path d="M34 25 C41 18 52 26 48 36 C43 45 30 39 31 30 Z" fill={accent} opacity={0.72} />
          <Path d="M29 47 L53 13" stroke="#64748B" strokeDasharray="3 3" />
        </G>
      ) : null}
      {variant === "papillary" ? (
        <G>
          <Path d="M17 36 C18 21 31 15 45 18 C58 21 63 32 57 42 C50 53 25 50 18 40 Z" fill="#E2E8F0" stroke={accent} strokeWidth="2" />
          <Path d="M39 37 C39 28 45 25 49 30 C53 36 47 42 40 39 Z" fill={accent} opacity={0.75} />
          <Path d="M49 30 L49 17" stroke="#0F172A" strokeDasharray="3 3" />
        </G>
      ) : null}
      {variant === "irregular" ? (
        <G>
          <Path d="M18 33 L25 19 L37 24 L46 13 L60 27 L53 39 L61 47 L42 45 L31 52 L26 41 Z" fill="#E2E8F0" stroke={accent} strokeWidth="2" />
          <Path d="M29 25 L35 31 L43 20" stroke={accent} strokeWidth="2" />
        </G>
      ) : null}
      {variant === "measure" ? (
        <G>
          <Circle cx="39" cy="29" r="18" fill="#E2E8F0" stroke={accent} strokeWidth="2" />
          <Path d="M21 29 H57 M39 11 V47" stroke="#64748B" strokeDasharray="3 3" />
          <Path d="M25 24 L21 29 L25 34 M53 24 L57 29 L53 34" stroke={accent} strokeWidth="1.7" />
        </G>
      ) : null}
      {variant === "locules" ? (
        <G>
          <Circle cx="33" cy="28" r="19" fill="#E2E8F0" stroke={accent} strokeWidth="2" />
          {[24, 32, 40, 48].map((x, i) => (
            <Circle key={x} cx={x} cy={22 + (i % 2) * 13} r="6" fill="#CBD5E1" stroke="#94A3B8" />
          ))}
          <TextSvg x={58} y={32} text=">10" color={accent} />
        </G>
      ) : null}
      {variant === "shadow" ? (
        <G>
          <Circle cx="32" cy="24" r="12" fill="#CBD5E1" stroke={accent} strokeWidth="2" />
          <Path d="M24 36 L16 52 M32 37 L29 54 M41 35 L47 52" stroke="#94A3B8" strokeWidth="3" opacity={0.55} />
        </G>
      ) : null}
      {variant === "ascites" ? (
        <G>
          <Path d="M22 40 C29 48 51 48 57 39 C50 43 28 43 22 40 Z" fill={accent} opacity={0.42} />
          <Path d="M25 33 C22 18 36 12 48 19 C59 25 59 38 48 43 C38 48 27 43 25 33 Z" {...common} />
          <Path d="M17 41 C31 48 51 48 63 39" stroke={accent} strokeWidth="2" />
        </G>
      ) : null}
      {variant === "color" ? (
        <G>
          <Circle cx="38" cy="29" r="18" fill="#E2E8F0" stroke="#CBD5E1" />
          <Path d="M25 33 C35 20 45 43 56 24" stroke="#2563EB" strokeWidth="4" opacity={0.82} />
          <Path d="M23 24 C34 37 45 15 57 34" stroke="#EF4444" strokeWidth="4" opacity={0.82} />
        </G>
      ) : null}
      {variant === "center" ? (
        <G>
          <Rect x="23" y="18" width="32" height="28" rx="4" fill="#E2E8F0" stroke={accent} strokeWidth="2" />
          <Path d="M39 23 V41 M30 32 H48" stroke={accent} strokeWidth="4" strokeLinecap="round" />
        </G>
      ) : null}
    </Svg>
  );
}

function TextSvg({ x, y, text, color }: { x: number; y: number; text: string; color: string }) {
  return (
    <Svg x={x - 10} y={y - 10} width={28} height={18} viewBox="0 0 28 18">
      <Rect width="28" height="18" rx="9" fill="#fff" />
      <Path d="M1 9 H27" stroke={color} opacity={0.12} />
      <SvgText x="14" y="12" textAnchor="middle" fontSize="8" fontWeight="900" fill={color}>
        {text}
      </SvgText>
    </Svg>
  );
}

function selectedValueForTerm(termKey: string, input: OradsInput) {
  if (termKey === "lesion" && input.iotaLesionType) return lesionLabels[input.iotaLesionType];
  if (termKey === "solid" && input.largestSolidDiameterMm) return `${input.largestSolidDiameterMm} мм`;
  if (termKey === "papillary" && input.papillaryProjectionCount) return input.papillaryProjectionCount === "4plus" ? ">=4" : input.papillaryProjectionCount;
  if (termKey === "locules" && typeof input.cystLoculesOver10 === "boolean") return input.cystLoculesOver10 ? ">10" : "<=10 / нет";
  if (termKey === "shadow" && typeof input.acousticShadows === "boolean") return input.acousticShadows ? "есть" : "нет";
  if (termKey === "ascites") return input.ascites ? "есть" : "нет";
  if (termKey === "color" && input.iotaColorScore) return `балл ${input.iotaColorScore}`;
  if (termKey === "center" && input.iotaCenterType) return input.iotaCenterType === "oncology" ? "онкоцентр" : "другой";
  return null;
}

export default function IotaVisualGuide({ input }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <View style={styles.heroText}>
          <Text style={styles.kicker}>Визуальный атлас IOTA 2026</Text>
          <Text style={styles.title}>Обновлённые термины и измерения</Text>
          <Text style={styles.subtitle}>
            Краткий клинический гид по данным консенсуса: используйте как визуальную проверку перед итогом O-RADS/IOTA.
          </Text>
        </View>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeTop}>2026</Text>
          <Text style={styles.heroBadgeBottom}>Обновление</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.termStrip}>
        {terms.map((term) => {
          const selected = selectedValueForTerm(term.key, input);
          return (
            <View key={term.key} style={[styles.termCard, selected && styles.termCardActive]}>
              <View style={styles.figureWrap}>
                <MiniFigure variant={term.variant} accent={term.accent} />
              </View>
              <Text style={styles.termTitle}>{term.title}</Text>
              <Text style={[styles.termSubtitle, { color: term.accent }]}>{selected ?? term.subtitle}</Text>
              <Text style={styles.termDefinition}>{term.definition}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.photoNote}>
        <Text style={styles.photoNoteTitle}>Фото / фигуры</Text>
        <Text style={styles.photoNoteText}>
          В приложении подготовлена визуальная структура. Оригинальные изображения из Wiley можно заменить только на лицензированные
          файлы или собственные клинические примеры; сейчас используются авторские SVG-схемы.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  hero: {
    borderRadius: 22,
    backgroundColor: "#111827",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
    overflow: "hidden",
  },
  heroText: { flex: 1, gap: 5 },
  kicker: { color: "#A78BFA", fontSize: 11, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  title: { color: "#fff", fontSize: 21, fontWeight: "900", letterSpacing: -0.4 },
  subtitle: { color: "#CBD5E1", fontSize: 13, lineHeight: 19 },
  heroBadge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  heroBadgeTop: { color: "#fff", fontSize: 20, fontWeight: "900" },
  heroBadgeBottom: { color: "#FFEDD5", fontSize: 11, fontWeight: "900" },
  termStrip: { gap: 12, paddingRight: 4 },
  termCard: {
    width: 190,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    gap: 7,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  termCardActive: { borderColor: "#6D28D9", backgroundColor: "#FAF5FF" },
  figureWrap: { alignItems: "flex-start" },
  termTitle: { color: "#0F172A", fontSize: 14, fontWeight: "900" },
  termSubtitle: { fontSize: 12, fontWeight: "900" },
  termDefinition: { color: "#475569", fontSize: 11, lineHeight: 16 },
  photoNote: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    backgroundColor: "#EFF6FF",
    padding: 12,
    gap: 4,
  },
  photoNoteTitle: { color: "#1D4ED8", fontSize: 13, fontWeight: "900" },
  photoNoteText: { color: "#334155", fontSize: 12, lineHeight: 17 },
});
