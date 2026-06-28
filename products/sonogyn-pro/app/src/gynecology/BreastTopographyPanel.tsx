import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Ellipse, Line, Path, Text as SvgText } from "react-native-svg";
import {
  buildBreastProtocolBlock,
  centroidOfStroke,
  formatBreastLocationRu,
  strokeToSvgPath,
  type BreastNormPoint,
  type BreastSide,
  type BreastTopographyMarker,
} from "@repo/clinical-3d";

const VIEW = 280;

type Tool = "place" | "draw";

function normFromTouch(locationX: number, locationY: number, size: number): BreastNormPoint {
  return {
    x: Math.max(0.06, Math.min(0.94, locationX / size)),
    y: Math.max(0.06, Math.min(0.94, locationY / size)),
  };
}

function BreastDiagram({
  side,
  size,
  markers,
  draftStroke,
  tool,
  selectedId,
  onPlace,
  onDrawStart,
  onDrawMove,
  onDrawEnd,
}: {
  side: BreastSide;
  size: number;
  markers: BreastTopographyMarker[];
  draftStroke: BreastNormPoint[];
  tool: Tool;
  selectedId: string | null;
  onPlace: (side: BreastSide, pt: BreastNormPoint) => void;
  onDrawStart: (side: BreastSide, pt: BreastNormPoint) => void;
  onDrawMove: (pt: BreastNormPoint) => void;
  onDrawEnd: (side: BreastSide) => void;
}) {
  const lateralLeft = side === "right";
  const sideMarkers = markers.filter((m) => m.side === side);
  const draftPath = draftStroke.length > 1 ? strokeToSvgPath(draftStroke, VIEW, VIEW) : "";

  return (
    <View style={styles.diagramWrap}>
      <Text style={styles.sideLabel}>{side === "right" ? "Правая МЖ" : "Левая МЖ"}</Text>
      <View
        style={[styles.canvas, { width: size, height: size }]}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => {
          const pt = normFromTouch(e.nativeEvent.locationX, e.nativeEvent.locationY, size);
          if (tool === "draw") onDrawStart(side, pt);
          else onPlace(side, pt);
        }}
        onResponderMove={(e) => {
          if (tool !== "draw") return;
          onDrawMove(normFromTouch(e.nativeEvent.locationX, e.nativeEvent.locationY, size));
        }}
        onResponderRelease={() => onDrawEnd(side)}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`}>
          <Ellipse cx="150" cy="150" rx="118" ry="128" fill="#FFF1F2" stroke="#BE123C" strokeWidth="3" />
          <Line x1="150" y1="28" x2="150" y2="272" stroke="#F43F5E" strokeWidth="2" strokeDasharray="6 7" opacity={0.75} />
          <Line x1="35" y1="150" x2="265" y2="150" stroke="#F43F5E" strokeWidth="2" strokeDasharray="6 7" opacity={0.75} />
          <Circle cx="150" cy="150" r="22" fill="#F97316" stroke="#9A3412" strokeWidth="3" />
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
          {sideMarkers.map((m) => {
            const cx = m.point.x * VIEW;
            const cy = m.point.y * VIEW;
            const active = m.id === selectedId;
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
          {draftPath ? <Path d={draftPath} stroke="#EA580C" strokeWidth={2.5} fill="none" /> : null}
        </Svg>
      </View>
    </View>
  );
}

export default function BreastTopographyPanel() {
  const [tool, setTool] = useState<Tool>("place");
  const [markers, setMarkers] = useState<BreastTopographyMarker[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const strokeRef = useRef<BreastNormPoint[]>([]);
  const [draftStroke, setDraftStroke] = useState<BreastNormPoint[]>([]);
  const [draftSide, setDraftSide] = useState<BreastSide>("right");

  const size = 260;
  const selected = markers.find((m) => m.id === selectedId) ?? markers[markers.length - 1];
  const protocolText = useMemo(() => buildBreastProtocolBlock(markers), [markers]);

  const addMarker = useCallback((side: BreastSide, point: BreastNormPoint, stroke?: BreastNormPoint[]) => {
    const id = `br-${Date.now()}`;
    setMarkers((prev) => [...prev, { id, side, point, stroke }]);
    setSelectedId(id);
  }, []);

  const onPlace = useCallback(
    (side: BreastSide, pt: BreastNormPoint) => {
      const hit = markers.find((m) => {
        if (m.side !== side) return false;
        const dx = (m.point.x - pt.x) * VIEW;
        const dy = (m.point.y - pt.y) * VIEW;
        return Math.hypot(dx, dy) < 22;
      });
      if (hit) {
        setSelectedId(hit.id);
        return;
      }
      addMarker(side, pt);
    },
    [markers, addMarker],
  );

  return (
    <View style={styles.wrap}>
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

      <BreastDiagram
        side="right"
        size={size}
        markers={markers}
        draftStroke={draftSide === "right" ? draftStroke : []}
        tool={tool}
        selectedId={selectedId}
        onPlace={onPlace}
        onDrawStart={(s, pt) => {
          setDraftSide(s);
          strokeRef.current = [pt];
          setDraftStroke([pt]);
        }}
        onDrawMove={(pt) => {
          strokeRef.current = [...strokeRef.current, pt];
          setDraftStroke(strokeRef.current);
        }}
        onDrawEnd={(s) => {
          const pts = strokeRef.current;
          strokeRef.current = [];
          setDraftStroke([]);
          if (pts.length >= 3) addMarker(draftSide, centroidOfStroke(pts), pts);
          else if (pts.length === 1) addMarker(s, pts[0]);
        }}
      />
      <BreastDiagram
        side="left"
        size={size}
        markers={markers}
        draftStroke={draftSide === "left" ? draftStroke : []}
        tool={tool}
        selectedId={selectedId}
        onPlace={onPlace}
        onDrawStart={(s, pt) => {
          setDraftSide(s);
          strokeRef.current = [pt];
          setDraftStroke([pt]);
        }}
        onDrawMove={(pt) => {
          strokeRef.current = [...strokeRef.current, pt];
          setDraftStroke(strokeRef.current);
        }}
        onDrawEnd={(s) => {
          const pts = strokeRef.current;
          strokeRef.current = [];
          setDraftStroke([]);
          if (pts.length >= 3) addMarker(draftSide, centroidOfStroke(pts), pts);
          else if (pts.length === 1) addMarker(s, pts[0]);
        }}
      />

      {selected ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Локализация</Text>
          <Text style={styles.resultText}>{formatBreastLocationRu(selected.point, selected.side)}</Text>
        </View>
      ) : null}

      <View style={styles.protocolBox}>
        <Text style={styles.protocolTitle}>Текст для протокола</Text>
        <Text style={styles.protocolText}>{protocolText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  toolRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  toolBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5F5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  toolBtnOn: { borderColor: "#005CB9", backgroundColor: "#E0F2FE" },
  toolText: { fontWeight: "800", color: "#64748B", fontSize: 12 },
  toolTextOn: { color: "#075985" },
  diagramWrap: { alignItems: "center", gap: 6 },
  sideLabel: { fontSize: 11, fontWeight: "900", color: "#9F1239", textTransform: "uppercase" },
  canvas: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FECDD3",
    backgroundColor: "#FFF1F2",
    overflow: "hidden",
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
  resultText: { fontSize: 14, fontWeight: "700", color: "#0F172A", lineHeight: 20 },
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
