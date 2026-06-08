import { useEffect, useMemo, useState } from "react";
import {
  type GestureResponderEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop, Text as SvgText } from "react-native-svg";
import { evaluateFigoFibroid, type EndometriumRelation, type FibroidLocation, type SerosaRelation } from "./figoFibroid";
import { buildUterineTapLocalization } from "./uterusFigoLocalization";

type FigoPoint = {
  x: number;
  y: number;
};

/** Квадратная схема как у МЖ — стабильные доли при тапе. */
const CANVAS = 320;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function locationFromPoint(point: FigoPoint): FibroidLocation {
  if (point.y > 0.8 || (point.y > 0.74 && point.x > 0.36 && point.x < 0.64)) return "cervical";
  if (point.y < 0.34 && point.x > 0.34 && point.x < 0.66) return "fundal";
  return point.x < 0.5 ? "anterior" : "posterior";
}

function deriveFigoFields(point: FigoPoint, diameterMm: number, pedunculated: boolean) {
  const location = locationFromPoint(point);

  let relationToEndometrium: EndometriumRelation = "none";
  let relationToSerosa: SerosaRelation = "none";
  let intramuralPercentage = 100;
  let zone = "Интрамурально";

  if (location === "cervical") {
    zone = "шеечный сегмент / вне тела матки на схеме";
    return { relationToEndometrium, relationToSerosa, intramuralPercentage, location, zone };
  }

  const insideCavity = point.x > 0.4 && point.x < 0.6 && point.y > 0.38 && point.y < 0.56;
  const deepSubmucosal = point.x > 0.42 && point.x < 0.62 && point.y >= 0.5 && point.y < 0.72;
  const touchesEndometrium = point.x > 0.48 && point.x < 0.68 && point.y >= 0.56 && point.y < 0.82;
  const nearSerosa = point.x < 0.24 || point.y < 0.2 || point.x > 0.74;
  const closeToSerosa = point.x < 0.34 || point.y < 0.32;

  if (pedunculated && insideCavity) {
    relationToEndometrium = "intracavitary";
    intramuralPercentage = 0;
    zone = "в полости матки, на ножке";
  } else if (insideCavity) {
    relationToEndometrium = "intracavitary";
    intramuralPercentage = diameterMm >= 35 ? 45 : 35;
    zone = "преимущественно в полость (субмукозный компонент)";
  } else if (deepSubmucosal) {
    relationToEndometrium = "intracavitary";
    intramuralPercentage = 65;
    zone = "выраженный миометриальный компонент при субмукозном типе";
  } else if (touchesEndometrium) {
    relationToEndometrium = "contact";
    intramuralPercentage = 100;
    zone = "контакт с эндометрием, без выступания в полость";
  } else if (pedunculated && nearSerosa) {
    relationToSerosa = "extracavitary";
    intramuralPercentage = 0;
    zone = "субсерозно, экстракавитарно на ножке";
  } else if (nearSerosa || closeToSerosa) {
    relationToSerosa = "contact";
    intramuralPercentage = nearSerosa ? 35 : 65;
    zone =
      intramuralPercentage >= 50
        ? "контакт с серозой с доминирующим миометриальным компонентом"
        : "контакт с серозой с меньшей миометриальной долей";
  }

  return { relationToEndometrium, relationToSerosa, intramuralPercentage, location, zone };
}

function formatLocation(location: FibroidLocation) {
  if (location === "anterior") return "передняя стенка";
  if (location === "posterior") return "задняя стенка";
  if (location === "fundal") return "дно матки";
  if (location === "cervical") return "шейка матки";
  return "другая локализация";
}

function buildSizeString(diameterMm: number) {
  const d2 = Math.max(1, Math.round(diameterMm * 0.82));
  const d3 = Math.max(1, Math.round(diameterMm * 0.76));
  return `${diameterMm}x${d2}x${d3} мм`;
}

function UterusCanvas({
  point,
  diameterMm,
  onSelect,
}: {
  point: FigoPoint;
  diameterMm: number;
  onSelect: (event: GestureResponderEvent) => void;
}) {
  const cx = point.x * CANVAS;
  const cy = point.y * CANVAS;
  const radius = clamp(diameterMm / 2.05, 9, 44);
  const cursorStyle: ViewStyle | null =
    Platform.OS === "web"
      ? ({
          cursor: "crosshair",
          touchAction: "none",
          userSelect: "none",
        } as unknown as ViewStyle)
      : null;

  return (
    <View
      style={[styles.canvasPressable, cursorStyle]}
      accessibilityRole="button"
      accessibilityLabel="Схема матки, тап для локализации миомы"
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={onSelect}
      onResponderMove={onSelect}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${CANVAS} ${CANVAS}`}>
        <Defs>
          <LinearGradient id="endoSecretory" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFBEB" />
            <Stop offset="0.45" stopColor="#FEF9C3" />
            <Stop offset="1" stopColor="#FDE047" />
          </LinearGradient>
          <LinearGradient id="myometrium" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FECDD3" />
            <Stop offset="0.55" stopColor="#FDA4AF" />
            <Stop offset="1" stopColor="#FB7185" />
          </LinearGradient>
          <LinearGradient id="fibroidFill" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#9A3412" />
            <Stop offset="1" stopColor="#EA580C" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width={CANVAS} height={CANVAS} rx="22" fill="#FFF1F2" />

        <SvgText x={CANVAS / 2} y={22} fill="#9F1239" fontSize="12" fontWeight="900" textAnchor="middle">
          Сагиттально · фаза секреции (толстый эндометрий)
        </SvgText>

        {/* Трети тела — ориентиры, без номеров FIGO */}
        <Path d="M 52 112 H 268" stroke="#F43F5E" strokeWidth="1.2" strokeDasharray="5 6" opacity={0.35} />
        <Path d="M 52 158 H 268" stroke="#F43F5E" strokeWidth="1.2" strokeDasharray="5 6" opacity={0.35} />
        <SvgText x="14" y="116" fill="#64748B" fontSize="10" fontWeight="800">
          верх. треть
        </SvgText>
        <SvgText x="14" y="162" fill="#64748B" fontSize="10" fontWeight="800">
          сред. треть
        </SvgText>
        <SvgText x="14" y="208" fill="#64748B" fontSize="10" fontWeight="800">
          нижн. треть
        </SvgText>

        {/* Контур миометрия */}
        <Path
          d="M 160 46 
            C 206 48 252 78 268 128 
            C 282 172 276 222 248 258 
            C 228 284 198 298 160 298 
            C 124 298 94 284 74 258 
            C 46 222 40 172 54 128 
            C 70 78 116 48 160 46 Z"
          fill="url(#myometrium)"
          stroke="#BE123C"
          strokeWidth="2.8"
        />

        {/* Эндометрий в секреции — гиперэхогенная полоса + функциональный слой */}
        <Path
          d="M 160 78 
            C 205 82 232 108 238 148 
            C 244 188 222 232 185 248 
            C 165 256 138 248 118 220 
            C 92 182 98 124 125 92 
            C 138 80 152 76 160 78 Z"
          fill="url(#endoSecretory)"
          stroke="#CA8A04"
          strokeWidth="1.5"
          opacity={0.97}
        />
        <Path
          d="M 160 102 Q 178 158 160 228 Q 142 158 160 102"
          fill="#FFFBEB"
          stroke="#A16207"
          strokeWidth="1.2"
          opacity={0.88}
        />

        <SvgText x="238" y="102" fill="#713F12" fontSize="10" fontWeight="900">
          эндометрий
        </SvgText>
        <SvgText x="272" y="188" fill="#BE123C" fontSize="10" fontWeight="800" textAnchor="end">
          миометрий
        </SvgText>

        {/* Шейка */}
        <Path d="M 132 286 L 132 312 Q 160 328 188 312 L 188 286 Z" fill="#FB923C" stroke="#9A3412" strokeWidth="2.2" />
        <SvgText x={CANVAS / 2} y={322} fill="#451A03" fontSize="11" fontWeight="900" textAnchor="middle">
          шейка
        </SvgText>
        <SvgText x={CANVAS / 2} y={56} fill="#881337" fontSize="10" fontWeight="900" textAnchor="middle">
          дно матки
        </SvgText>

        {/* Маркер узла — как на схеме МЖ: крест + круг, без цифры FIGO */}
        <Path d={`M${cx - 15} ${cy} H${cx + 15} M${cx} ${cy - 15} V${cy + 15}`} stroke="#7C2D12" strokeWidth="2.4" strokeLinecap="round" />
        <Circle cx={cx} cy={cy} r={radius + 9} fill="#FDBA74" opacity={0.22} />
        <Circle cx={cx} cy={cy} r={radius} fill="url(#fibroidFill)" stroke="#7C2D12" strokeWidth="3" />
        <Circle cx={cx - radius * 0.22} cy={cy - radius * 0.22} r={radius * 0.28} fill="#FED7AA" opacity={0.55} />
      </Svg>
    </View>
  );
}

export type FigoFibroidSnapshot = {
  figoType: number;
  protocol: string;
  locationLabel: string;
  zone: string;
  clinicalHint: string;
  narrativeLine: string;
};

export type FigoFibroidInteractiveProps = {
  onBack?: () => void;
  backLabel?: string;
  onSnapshot?: (s: FigoFibroidSnapshot) => void;
};

export default function FigoFibroidInteractive({ onBack, backLabel, onSnapshot }: FigoFibroidInteractiveProps) {
  const { width } = useWindowDimensions();
  const canvasSize = Math.min(width - themePadding(), 340);
  const [point, setPoint] = useState<FigoPoint>({ x: 0.48, y: 0.46 });
  const [diameterMm, setDiameterMm] = useState(32);
  const [pedunculated, setPedunculated] = useState(false);

  const derived = useMemo(() => deriveFigoFields(point, diameterMm, pedunculated), [diameterMm, pedunculated, point]);
  const result = useMemo(
    () =>
      evaluateFigoFibroid({
        relation_to_endometrium: derived.relationToEndometrium,
        relation_to_serosa: derived.relationToSerosa,
        intramural_percentage: derived.intramuralPercentage,
        pedunculated,
        location: derived.location,
        size_mm: buildSizeString(diameterMm),
      }),
    [derived, diameterMm, pedunculated]
  );

  const tapLoc = useMemo(
    () => buildUterineTapLocalization(point, result.figoType, formatLocation(derived.location)),
    [derived.location, point, result.figoType]
  );

  const protocolCombined = useMemo(() => [tapLoc.narrativeLine, "", result.protocol].join("\n"), [result.protocol, tapLoc.narrativeLine]);

  useEffect(() => {
    onSnapshot?.({
      figoType: result.figoType,
      protocol: protocolCombined,
      locationLabel: formatLocation(derived.location),
      zone: derived.zone,
      clinicalHint: result.clinicalHint,
      narrativeLine: tapLoc.narrativeLine,
    });
  }, [
    derived.location,
    derived.zone,
    onSnapshot,
    protocolCombined,
    result.clinicalHint,
    result.figoType,
    tapLoc.narrativeLine,
  ]);

  const setFromTouch = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    setPoint({
      x: clamp(locationX / canvasSize, 0.06, 0.94),
      y: clamp(locationY / canvasSize, 0.06, 0.94),
    });
  };

  return (
    <View style={styles.card}>
      {onBack ? (
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>{backLabel ?? "← К разделу «Для гинеколога»"}</Text>
        </Pressable>
      ) : null}

      <View style={styles.hero}>
        <Text style={styles.kicker}>Локализация FIGO · матка</Text>
        <Text style={styles.title}>Схема как для МЖ: ткните очаг</Text>
        <Text style={styles.subtitle}>
          Сагиттальный разрез с типичным толстым эндометрием фазы секреции. Нажмите или ведите пальцем по миометрию — получите
          стенку, треть тела и формулировку типа FIGO без «пути решения» по номерам на картинке.
        </Text>
      </View>

      <View style={[styles.locatorCard, themeShadow()]}>
        <View style={styles.locatorTop}>
          <View style={styles.locatorTitleBlock}>
            <Text style={styles.locatorKicker}>Интерактивная схема</Text>
            <Text style={styles.locatorTitle}>Матка · миометрий и полость</Text>
          </View>
        </View>

        <View style={[styles.canvasWrap, { width: canvasSize, height: canvasSize }]}>
          <UterusCanvas point={point} diameterMm={diameterMm} onSelect={setFromTouch} />
        </View>

        <View style={styles.locationResult}>
          <Text style={styles.locationMain}>{tapLoc.narrativeLine}</Text>
          <Text style={styles.locationSub}>
            Авто: {tapLoc.wallLine} · {tapLoc.thirdLine} · {tapLoc.figoSubtypeRu}. Проверьте по реальному УЗИ и клинике.
          </Text>
        </View>

        <View style={styles.controls}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Условный размер узла</Text>
            <Text style={styles.metricValue}>{diameterMm} мм</Text>
            <View style={styles.sizeRow}>
              <Pressable style={styles.roundBtn} onPress={() => setDiameterMm((v) => clamp(v - 5, 5, 140))}>
                <Text style={styles.roundBtnText}>−</Text>
              </Pressable>
              <View style={styles.sizeTrack}>
                <View style={[styles.sizeFill, { width: `${clamp((diameterMm / 140) * 100, 4, 100)}%` }]} />
              </View>
              <Pressable style={styles.roundBtn} onPress={() => setDiameterMm((v) => clamp(v + 5, 5, 140))}>
                <Text style={styles.roundBtnText}>+</Text>
              </Pressable>
            </View>
          </View>

          <Pressable style={[styles.toggle, pedunculated && styles.toggleActive]} onPress={() => setPedunculated((v) => !v)}>
            <Text style={[styles.toggleText, pedunculated && styles.toggleTextActive]}>
              Узел на ножке: {pedunculated ? "да" : "нет"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.resultPanel}>
        <Text style={styles.resultKicker}>Итог для протокола</Text>
        <Text style={styles.resultHighlight}>FIGO тип {result.figoType} — {tapLoc.figoSubtypeRu}</Text>
        <Text style={styles.resultText}>Слой и контакт: {derived.zone}</Text>
        <Text style={styles.resultText}>PALM (стенка): {formatLocation(derived.location)} · миометриальная доля ~{derived.intramuralPercentage}%</Text>
        <Text style={styles.resultText}>Тактика (ориентир): {result.clinicalHint}</Text>

        <View style={styles.protocolBox}>
          <Text style={styles.protocolTitle}>Готовый ответ</Text>
          <Text style={styles.protocolText}>{protocolCombined}</Text>
        </View>
      </View>

      <Text style={styles.disclaimer}>
        Схема стилизована под фазу секреции для ориентира контактов очага с эндометрием; классификация FIGO должна быть подтверждена по реальному УЗИ.
      </Text>
    </View>
  );
}

function themePadding() {
  return 48;
}

function themeShadow() {
  return Platform.OS === "web"
    ? {}
    : {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 3,
      };
}

const shadow =
  Platform.OS === "web"
    ? {}
    : {
        shadowColor: "#881337",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.09,
        shadowRadius: 22,
        elevation: 4,
      };

const styles = StyleSheet.create({
  card: { gap: 14 },
  backBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF1F2",
    borderColor: "#FFE4E6",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
  },
  backBtnText: { color: "#9F1239", fontWeight: "800", fontSize: 13 },
  hero: {
    borderRadius: 24,
    backgroundColor: "#881337",
    padding: 18,
    gap: 6,
    ...shadow,
  },
  kicker: { color: "#FDA4AF", fontSize: 11, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  title: { color: "#fff", fontSize: 25, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { color: "#FFE4E6", fontSize: 13, lineHeight: 19, fontWeight: "600" },
  locatorCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e8ecf1",
    padding: 16,
    gap: 12,
  },
  locatorTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  locatorTitleBlock: { flex: 1, minWidth: 0 },
  locatorKicker: { color: "#be123c", fontSize: 11, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  locatorTitle: { color: "#0f172a", fontSize: 19, fontWeight: "900", marginTop: 4 },
  canvasWrap: {
    borderRadius: 22,
    backgroundColor: "#FFF1F2",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FECDD3",
    alignSelf: "center",
  },
  canvasPressable: { flex: 1 },
  locationResult: {
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    gap: 6,
  },
  locationMain: { color: "#0F172A", fontSize: 14, lineHeight: 21, fontWeight: "800" },
  locationSub: { color: "#64748B", fontSize: 12, lineHeight: 17, fontWeight: "600" },
  controls: { width: "100%", gap: 10 },
  metricCard: {
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    gap: 10,
  },
  metricLabel: { color: "#64748B", fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.7 },
  metricValue: { color: "#0F172A", fontSize: 26, fontWeight: "900" },
  sizeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#881337",
    alignItems: "center",
    justifyContent: "center",
  },
  roundBtnText: { color: "#fff", fontSize: 26, fontWeight: "900", marginTop: -2 },
  sizeTrack: { flex: 1, height: 10, borderRadius: 999, backgroundColor: "#FFE4E6", overflow: "hidden" },
  sizeFill: { height: 10, borderRadius: 999, backgroundColor: "#F43F5E" },
  toggle: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  toggleActive: { backgroundColor: "#FFF1F2", borderColor: "#FDA4AF" },
  toggleText: { color: "#334155", fontWeight: "900", textAlign: "center" },
  toggleTextActive: { color: "#BE123C" },
  resultPanel: {
    borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    gap: 8,
  },
  resultKicker: { color: "#64748B", fontSize: 11, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  resultHighlight: { color: "#881337", fontSize: 17, fontWeight: "900", lineHeight: 24 },
  resultText: { color: "#0F172A", fontSize: 14, lineHeight: 20, fontWeight: "600" },
  protocolBox: { marginTop: 6, borderRadius: 16, backgroundColor: "#F8FAFC", padding: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  protocolTitle: { color: "#334155", fontSize: 13, fontWeight: "900", marginBottom: 6 },
  protocolText: { color: "#0F172A", fontSize: 13, lineHeight: 19 },
  disclaimer: { color: "#64748B", fontSize: 12, lineHeight: 17, paddingHorizontal: 2 },
});
