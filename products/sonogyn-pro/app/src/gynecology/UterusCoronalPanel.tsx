import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import {
  buildUterusCoronalProtocolBlock,
  centroidOfStroke,
  formatUterusCoronalMarkerRu,
  strokeToSvgPath,
  type UterusCoronalMarker,
  type UterusLesionKind,
  type UterusNormPoint,
} from "@repo/clinical-3d";

const ANATOMY = require("../../assets/uterus-coronal-anatomy.png");
const VB_W = 1000;
const VB_H = 750;

type Tool = "place" | "draw";

const KINDS: { id: UterusLesionKind; label: string }[] = [
  { id: "myoma", label: "Миома" },
  { id: "adenomyosis", label: "Аденомиоз" },
  { id: "polyp", label: "Полип" },
  { id: "endometrioma", label: "Эндометриома" },
  { id: "other", label: "Другое" },
];

function normFromTouch(locationX: number, locationY: number, w: number, h: number): UterusNormPoint {
  return {
    x: Math.max(0.02, Math.min(0.98, locationX / w)),
    y: Math.max(0.02, Math.min(0.98, locationY / h)),
  };
}

type Props = {
  onProtocolChange?: (text: string) => void;
};

export default function UterusCoronalPanel({ onProtocolChange }: Props) {
  const [tool, setTool] = useState<Tool>("place");
  const [kind, setKind] = useState<UterusLesionKind>("myoma");
  const [diameterMm, setDiameterMm] = useState("32");
  const [pedunculated, setPedunculated] = useState(false);
  const [markers, setMarkers] = useState<UterusCoronalMarker[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const strokeRef = useRef<UterusNormPoint[]>([]);
  const [draftStroke, setDraftStroke] = useState<UterusNormPoint[]>([]);

  const canvasW = 320;
  const canvasH = Math.round((canvasW * VB_H) / VB_W);

  const selected = markers.find((m) => m.id === selectedId) ?? markers[markers.length - 1];
  const protocolText = useMemo(() => buildUterusCoronalProtocolBlock(markers), [markers]);

  useEffect(() => {
    onProtocolChange?.(protocolText);
  }, [protocolText, onProtocolChange]);

  const addMarker = useCallback(
    (point: UterusNormPoint, stroke?: UterusNormPoint[]) => {
      const id = `ut-${Date.now()}`;
      const d = Number.parseInt(diameterMm, 10) || 0;
      setMarkers((prev) => [
        ...prev,
        {
          id,
          point,
          kind,
          diameterMm: d,
          pedunculated: kind === "myoma" ? pedunculated : false,
          stroke,
        },
      ]);
      setSelectedId(id);
    },
    [kind, diameterMm, pedunculated],
  );

  const onPlace = useCallback(
    (pt: UterusNormPoint) => {
      const hit = markers.find((m) => {
        const dx = (m.point.x - pt.x) * VB_W;
        const dy = (m.point.y - pt.y) * VB_H;
        return Math.hypot(dx, dy) < 28;
      });
      if (hit) {
        setSelectedId(hit.id);
        return;
      }
      addMarker(pt);
    },
    [markers, addMarker],
  );

  const draftPath = draftStroke.length > 1 ? strokeToSvgPath(draftStroke, VB_W, VB_H) : "";

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>
        Коронарный макет: коснитесь органа или обведите контур — текст и FIGO (для миомы) подставятся в протокол.
      </Text>

      <View style={styles.toolRow}>
        <Pressable style={[styles.toolBtn, tool === "place" && styles.toolBtnOn]} onPress={() => setTool("place")}>
          <Text style={[styles.toolText, tool === "place" && styles.toolTextOn]}>Очаг</Text>
        </Pressable>
        <Pressable style={[styles.toolBtn, tool === "draw" && styles.toolBtnOn]} onPress={() => setTool("draw")}>
          <Text style={[styles.toolText, tool === "draw" && styles.toolTextOn]}>Контур</Text>
        </Pressable>
        <Pressable style={styles.toolBtn} onPress={() => setMarkers([])}>
          <Text style={styles.toolText}>Очистить</Text>
        </Pressable>
      </View>

      <View style={styles.kindRow}>
        {KINDS.map((k) => (
          <Pressable
            key={k.id}
            style={[styles.chip, kind === k.id && styles.chipOn]}
            onPress={() => setKind(k.id)}
          >
            <Text style={[styles.chipText, kind === k.id && styles.chipTextOn]}>{k.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sizeRow}>
        <Text style={styles.sizeLabel}>Диаметр, мм</Text>
        <TextInput
          style={styles.sizeInput}
          keyboardType="number-pad"
          value={diameterMm}
          onChangeText={setDiameterMm}
        />
        {kind === "myoma" ? (
          <Pressable
            style={[styles.chip, pedunculated && styles.chipOn]}
            onPress={() => setPedunculated((v) => !v)}
          >
            <Text style={[styles.chipText, pedunculated && styles.chipTextOn]}>На ножке</Text>
          </Pressable>
        ) : null}
      </View>

      <View
        style={[styles.canvas, { width: canvasW, height: canvasH }]}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => {
          const pt = normFromTouch(e.nativeEvent.locationX, e.nativeEvent.locationY, canvasW, canvasH);
          if (tool === "draw") {
            strokeRef.current = [pt];
            setDraftStroke([pt]);
          } else onPlace(pt);
        }}
        onResponderMove={(e) => {
          if (tool !== "draw") return;
          const pt = normFromTouch(e.nativeEvent.locationX, e.nativeEvent.locationY, canvasW, canvasH);
          strokeRef.current = [...strokeRef.current, pt];
          setDraftStroke(strokeRef.current);
        }}
        onResponderRelease={() => {
          if (tool !== "draw") return;
          const pts = strokeRef.current;
          strokeRef.current = [];
          setDraftStroke([]);
          if (pts.length >= 3) addMarker(centroidOfStroke(pts), pts);
          else if (pts.length === 1) addMarker(pts[0]);
        }}
      >
        <Image source={ANATOMY} style={{ width: canvasW, height: canvasH }} resizeMode="contain" />
        <Svg
          style={StyleSheet.absoluteFill}
          width={canvasW}
          height={canvasH}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {markers.map((m) => {
            const active = m.id === selectedId;
            const cx = m.point.x * VB_W;
            const cy = m.point.y * VB_H;
            return (
              <Circle
                key={m.id}
                cx={cx}
                cy={cy}
                r={active ? 14 : 11}
                fill="#F97316"
                stroke="#7C2D12"
                strokeWidth={active ? 3 : 2}
              />
            );
          })}
          {draftPath ? (
            <Path d={draftPath} stroke="#EA580C" strokeWidth={3} fill="none" strokeDasharray="8 6" />
          ) : null}
        </Svg>
      </View>

      {selected ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Локализация</Text>
          <Text style={styles.resultText}>{formatUterusCoronalMarkerRu(selected)}</Text>
        </View>
      ) : null}

      <View style={styles.protocolBox}>
        <Text style={styles.protocolTitle}>Текст для протокола</Text>
        <Text style={styles.protocolText} selectable>
          {protocolText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  hint: { fontSize: 11, color: "#64748b", lineHeight: 16 },
  toolRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  toolBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  toolBtnOn: { borderColor: "#9F1239", backgroundColor: "#FFF1F2" },
  toolText: { fontWeight: "800", color: "#64748B", fontSize: 12 },
  toolTextOn: { color: "#9F1239" },
  kindRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f8fafc",
  },
  chipOn: { backgroundColor: "#FFF1F2", borderColor: "#FDA4AF" },
  chipText: { fontSize: 12, fontWeight: "700", color: "#334155" },
  chipTextOn: { color: "#9F1239" },
  sizeRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  sizeLabel: { fontSize: 12, fontWeight: "700", color: "#475569" },
  sizeInput: {
    minWidth: 56,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: "700",
    backgroundColor: "#fff",
  },
  canvas: {
    alignSelf: "center",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FECDD3",
    overflow: "hidden",
    backgroundColor: "#0f172a",
  },
  resultBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FECDD3",
    backgroundColor: "#FFF1F2",
    padding: 12,
    gap: 6,
  },
  resultTitle: { fontSize: 12, fontWeight: "900", color: "#9F1239" },
  resultText: { fontSize: 13, fontWeight: "600", color: "#0F172A", lineHeight: 19 },
  protocolBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    padding: 12,
    gap: 8,
  },
  protocolTitle: { fontSize: 12, fontWeight: "900", color: "#334155" },
  protocolText: { fontSize: 13, lineHeight: 19, color: "#0F172A" },
});
