import { useCallback, useMemo, useRef, useState } from "react";
import {
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type LayoutRectangle,
} from "react-native";
import Svg, { Path, Text as SvgText } from "react-native-svg";

import {
  boundsFromStroke,
  figoFromStroke,
  isValidStroke,
  localizationRu,
  simplifyStroke,
  sizeMmFromStroke,
  strokeToSvgPath,
  type SliceEditorTool,
  type SliceNorm,
  type SliceStroke,
} from "./sliceStrokeHelpers";

const SLICE_SOURCE = require("../../../assets/uterus-sagittal-slice.png");

type MarkerType = "myoma" | "adenomyosis" | "polyp" | "scar" | "other";

type Marker = {
  id: string;
  type: MarkerType;
  stroke: SliceStroke;
  sizeMm: { length: number; width: number; depth: number };
  pedunculated: boolean;
  figoType?: number;
};

const TYPE_LABELS: Record<MarkerType, string> = {
  myoma: "Миома",
  adenomyosis: "Аденомиоз",
  polyp: "Полип",
  scar: "Рубец",
  other: "Другое",
};

const TYPE_COLORS: Record<MarkerType, string> = {
  myoma: "#9333ea",
  adenomyosis: "#e11d48",
  polyp: "#0d9488",
  scar: "#64748b",
  other: "#2563eb",
};

const MIN_ZOOM = 0.55;
const MAX_ZOOM = 4;

function touchDist(t1: { pageX: number; pageY: number }, t2: { pageX: number; pageY: number }) {
  return Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
}

function buildProtocolLine(m: Marker): string {
  const b = boundsFromStroke(m.stroke.points);
  const loc = localizationRu(b.cx, b.cy);
  const size = `${Math.round(m.sizeMm.length)}×${Math.round(m.sizeMm.width)} мм`;
  if (m.type === "myoma") {
    const figo = m.figoType != null ? `FIGO ${m.figoType}, ` : "";
    return `Миома тела матки (${figo}${loc}), размеры ${size}${m.pedunculated ? ", на ножке" : ""}.`;
  }
  if (m.type === "adenomyosis") return `Очаг аденомиоза, ${loc}, размеры ${size}.`;
  if (m.type === "polyp") return `Полип эндометрия, ${loc}, размеры ${size}.`;
  if (m.type === "scar") return `Рубец / ниша, ${loc}, ${size}.`;
  return `Образование, ${loc}, ${size}.`;
}

export default function UterusSlicePanel() {
  const [layout, setLayout] = useState<LayoutRectangle | null>(null);
  const [tool, setTool] = useState<SliceEditorTool>("navigate");
  const [placeMode, setPlaceMode] = useState<MarkerType>("myoma");
  const [pedunculated, setPedunculated] = useState(false);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draftStroke, setDraftStroke] = useState<SliceNorm[]>([]);

  const strokeRef = useRef<SliceNorm[]>([]);
  const panRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);
  const toolRef = useRef(tool);
  toolRef.current = tool;

  const w = layout?.width ?? 300;
  const h = layout?.height ?? 188;

  const normFromTouch = useCallback(
    (locationX: number, locationY: number): SliceNorm => {
      const nx = (locationX - pan.x) / zoom / w;
      const ny = (locationY - pan.y) / zoom / h;
      return [nx, ny];
    },
    [pan, zoom, w, h],
  );

  const finishStroke = useCallback(() => {
    const pts = simplifyStroke(strokeRef.current);
    strokeRef.current = [];
    setDraftStroke([]);
    if (!isValidStroke(pts)) return;
    const figo = placeMode === "myoma" ? figoFromStroke(pts, pedunculated) : undefined;
    const nu: Marker = {
      id: `m-${Date.now()}`,
      type: placeMode,
      stroke: { points: pts },
      sizeMm: sizeMmFromStroke(pts),
      pedunculated: placeMode === "myoma" ? pedunculated : false,
      figoType: figo,
    };
    setMarkers((p) => [...p, nu]);
    setSelectedId(nu.id);
  }, [placeMode, pedunculated]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const touches = evt.nativeEvent.touches;
          if (touches.length >= 2) {
            pinchRef.current = { dist: touchDist(touches[0], touches[1]), zoom };
            return;
          }
          if (toolRef.current === "navigate") {
            panRef.current = { x: pan.x, y: pan.y, startX: evt.nativeEvent.pageX, startY: evt.nativeEvent.pageY };
          } else {
            const n = normFromTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
            strokeRef.current = [n];
            setDraftStroke([n]);
          }
        },
        onPanResponderMove: (evt) => {
          const touches = evt.nativeEvent.touches;
          if (touches.length >= 2 && pinchRef.current) {
            const dist = touchDist(touches[0], touches[1]);
            const ratio = dist / pinchRef.current.dist;
            setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinchRef.current.zoom * ratio)));
            return;
          }
          if (toolRef.current === "navigate") {
            setPan({
              x: panRef.current.x + (evt.nativeEvent.pageX - panRef.current.startX),
              y: panRef.current.y + (evt.nativeEvent.pageY - panRef.current.startY),
            });
            return;
          }
          const n = normFromTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
          const last = strokeRef.current[strokeRef.current.length - 1];
          if (!last || Math.hypot(n[0] - last[0], n[1] - last[1]) > 0.004) {
            strokeRef.current.push(n);
            setDraftStroke([...strokeRef.current]);
          }
        },
        onPanResponderRelease: () => {
          pinchRef.current = null;
          if (toolRef.current === "draw") finishStroke();
        },
        onPanResponderTerminate: () => {
          pinchRef.current = null;
          if (toolRef.current === "draw") finishStroke();
        },
      }),
    [zoom, pan, normFromTouch, finishStroke],
  );

  const selected = useMemo(() => markers.find((m) => m.id === selectedId) ?? null, [markers, selectedId]);
  const protocolText = useMemo(() => markers.map(buildProtocolLine).join("\n"), [markers]);

  return (
    <View style={styles.outer}>
      <Text style={styles.title}>Редактор среза матки</Text>
      <Text style={styles.disclaimer}>
        «Рука» — сдвиг одним пальцем, pinch — масштаб. «Кисть» — обведите узел. FIGO для миомы автоматически.
      </Text>

      <View style={styles.toolRow}>
        <Pressable style={[styles.toolBtn, tool === "navigate" && styles.toolBtnOn]} onPress={() => setTool("navigate")}>
          <Text style={[styles.toolBtnText, tool === "navigate" && styles.toolBtnTextOn]}>Рука</Text>
        </Pressable>
        <Pressable style={[styles.toolBtn, tool === "draw" && styles.toolBtnOn]} onPress={() => setTool("draw")}>
          <Text style={[styles.toolBtnText, tool === "draw" && styles.toolBtnTextOn]}>Кисть</Text>
        </Pressable>
        <Pressable
          style={styles.toolBtn}
          onPress={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
        >
          <Text style={styles.toolBtnText}>Сброс</Text>
        </Pressable>
        <Text style={styles.zoomLabel}>{Math.round(zoom * 100)}%</Text>
      </View>

      <View style={styles.chipRow}>
        {(Object.keys(TYPE_LABELS) as MarkerType[]).map((t) => (
          <Pressable key={t} style={[styles.chip, placeMode === t && styles.chipOn]} onPress={() => setPlaceMode(t)}>
            <Text style={[styles.chipText, placeMode === t && styles.chipTextOn]}>{TYPE_LABELS[t]}</Text>
          </Pressable>
        ))}
      </View>

      {placeMode === "myoma" ? (
        <Pressable style={[styles.chip, pedunculated && styles.chipOn]} onPress={() => setPedunculated((p) => !p)}>
          <Text style={[styles.chipText, pedunculated && styles.chipTextOn]}>На ножке (FIGO)</Text>
        </Pressable>
      ) : null}

      <View style={styles.imageHost} onLayout={(e) => setLayout(e.nativeEvent.layout)} {...panResponder.panHandlers}>
        <View
          style={{
            transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: zoom }],
            width: w,
            height: h,
          }}
        >
          <Image source={SLICE_SOURCE} style={{ width: w, height: h }} resizeMode="contain" />
        </View>
        <Svg
          width={w}
          height={h}
          style={[StyleSheet.absoluteFill, { transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: zoom }] }]}
          pointerEvents="none"
        >
          {markers.map((m) => {
            const sel = m.id === selectedId;
            const b = boundsFromStroke(m.stroke.points);
            return (
              <Path
                key={m.id}
                d={strokeToSvgPath(m.stroke.points, w, h, true)}
                fill={TYPE_COLORS[m.type]}
                fillOpacity={sel ? 0.45 : 0.3}
                stroke={sel ? "#fbbf24" : "#fff"}
                strokeWidth={sel ? 3 : 2}
              />
            );
          })}
          {markers.map(
            (m) =>
              m.type === "myoma" &&
              m.figoType != null && (
                <SvgText
                  key={`${m.id}-t`}
                  x={boundsFromStroke(m.stroke.points).cx * w}
                  y={boundsFromStroke(m.stroke.points).cy * h}
                  fill="#fff"
                  fontSize={11}
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {String(m.figoType)}
                </SvgText>
              ),
          )}
          {draftStroke.length > 1 ? (
            <Path
              d={strokeToSvgPath(draftStroke, w, h, false)}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={3}
              strokeLinecap="round"
            />
          ) : null}
        </Svg>
      </View>

      <Text style={styles.hint}>
        {tool === "draw" ? `Обведите ${TYPE_LABELS[placeMode].toLowerCase()}` : "Сдвиг · pinch для масштаба"}
      </Text>

      {selected ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>
            {TYPE_LABELS[selected.type]}
            {selected.figoType != null ? ` · FIGO ${selected.figoType}` : ""}
          </Text>
          <Text style={styles.meta}>{localizationRu(boundsFromStroke(selected.stroke.points).cx, boundsFromStroke(selected.stroke.points).cy)}</Text>
          <Pressable
            style={styles.deleteBtn}
            onPress={() => {
              setMarkers((p) => p.filter((m) => m.id !== selected.id));
              setSelectedId(null);
            }}
          >
            <Text style={styles.deleteBtnText}>Удалить контур</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        style={styles.resetBtn}
        onPress={() => {
          setMarkers([]);
          setSelectedId(null);
          setDraftStroke([]);
        }}
      >
        <Text style={styles.resetBtnText}>Сбросить все контуры</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Текст для протокола</Text>
      <ScrollView style={styles.protocolBox} nestedScrollEnabled>
        <Text style={styles.protocolText} selectable>
          {protocolText || "—"}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { gap: 10 },
  title: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  disclaimer: {
    fontSize: 11,
    color: "#334155",
    lineHeight: 16,
    backgroundColor: "#eff6ff",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  toolRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  toolBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
  },
  toolBtnOn: { backgroundColor: "#fdf4ff", borderColor: "#d946ef" },
  toolBtnText: { fontSize: 13, fontWeight: "800", color: "#334155" },
  toolBtnTextOn: { color: "#86198f" },
  zoomLabel: { fontSize: 11, color: "#64748b" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f8fafc",
  },
  chipOn: { backgroundColor: "#fdf4ff", borderColor: "#e879f9" },
  chipText: { fontSize: 11, fontWeight: "700", color: "#334155" },
  chipTextOn: { color: "#86198f" },
  imageHost: {
    width: "100%",
    aspectRatio: 16 / 10,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
  },
  hint: { fontSize: 11, color: "#64748b", textAlign: "center" },
  panel: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fafafa",
    gap: 6,
  },
  panelTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
  meta: { fontSize: 12, color: "#475569" },
  deleteBtn: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "#fee2e2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteBtnText: { color: "#b91c1c", fontWeight: "700", fontSize: 12 },
  resetBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  resetBtnText: { fontSize: 12, fontWeight: "700", color: "#334155" },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#0f172a", marginTop: 4 },
  protocolBox: {
    maxHeight: 160,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  protocolText: { fontSize: 13, lineHeight: 19, color: "#0f172a" },
});
