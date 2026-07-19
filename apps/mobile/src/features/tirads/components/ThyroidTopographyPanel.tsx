import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Ellipse, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import {
  buildThyroidProtocolBlock,
  formatThyroidLocationRu,
  thyroidCentroidOfStroke,
  thyroidStrokeToSvgPath,
  type ThyroidNormPoint,
  type ThyroidTopographyMarker,
} from "@repo/clinical-3d";

const VIEW_W = 300;
const VIEW_H = 360;

type Tool = "place" | "draw";

function normFromTouch(locationX: number, locationY: number, width: number, height: number): ThyroidNormPoint {
  return {
    x: Math.max(0.06, Math.min(0.94, locationX / width)),
    y: Math.max(0.06, Math.min(0.94, locationY / height)),
  };
}

export default function ThyroidTopographyPanel() {
  const [tool, setTool] = useState<Tool>("place");
  const [markers, setMarkers] = useState<ThyroidTopographyMarker[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const strokeRef = useRef<ThyroidNormPoint[]>([]);
  const [draftStroke, setDraftStroke] = useState<ThyroidNormPoint[]>([]);

  const width = 300;
  const height = 360;
  const selected = markers.find((m) => m.id === selectedId) ?? markers[markers.length - 1];
  const protocolText = useMemo(() => buildThyroidProtocolBlock(markers), [markers]);
  const draftPath = draftStroke.length > 1 ? thyroidStrokeToSvgPath(draftStroke, VIEW_W, VIEW_H) : "";

  const addMarker = useCallback((point: ThyroidNormPoint, stroke?: ThyroidNormPoint[]) => {
    const id = `thy-${Date.now()}`;
    setMarkers((prev) => [...prev, { id, point, stroke }]);
    setSelectedId(id);
  }, []);

  const placeMarker = useCallback(
    (pt: ThyroidNormPoint) => {
      const hit = markers.find((m) => {
        const dx = (m.point.x - pt.x) * VIEW_W;
        const dy = (m.point.y - pt.y) * VIEW_H;
        return Math.hypot(dx, dy) < 22;
      });
      if (hit) {
        setSelectedId(hit.id);
        return;
      }
      addMarker(pt);
    },
    [addMarker, markers],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.toolRow}>
        <Pressable style={[styles.toolBtn, tool === "place" && styles.toolBtnOn]} onPress={() => setTool("place")}>
          <Text style={[styles.toolText, tool === "place" && styles.toolTextOn]}>Узел</Text>
        </Pressable>
        <Pressable style={[styles.toolBtn, tool === "draw" && styles.toolBtnOn]} onPress={() => setTool("draw")}>
          <Text style={[styles.toolText, tool === "draw" && styles.toolTextOn]}>Контур</Text>
        </Pressable>
        <Pressable
          style={styles.toolBtn}
          onPress={() => {
            setMarkers([]);
            setSelectedId(null);
          }}
        >
          <Text style={styles.toolText}>Очистить</Text>
        </Pressable>
      </View>

      <View
        style={[styles.canvas, { width, height }]}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => {
          const pt = normFromTouch(e.nativeEvent.locationX, e.nativeEvent.locationY, width, height);
          if (tool === "draw") {
            strokeRef.current = [pt];
            setDraftStroke([pt]);
          } else {
            placeMarker(pt);
          }
        }}
        onResponderMove={(e) => {
          if (tool !== "draw") return;
          const pt = normFromTouch(e.nativeEvent.locationX, e.nativeEvent.locationY, width, height);
          strokeRef.current = [...strokeRef.current, pt];
          setDraftStroke(strokeRef.current);
        }}
        onResponderRelease={() => {
          if (tool !== "draw") return;
          const pts = strokeRef.current;
          strokeRef.current = [];
          setDraftStroke([]);
          if (pts.length >= 3) addMarker(thyroidCentroidOfStroke(pts), pts);
          else if (pts.length === 1) addMarker(pts[0]);
        }}
      >
        <Svg width={width} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
          <Rect x="0" y="0" width={VIEW_W} height={VIEW_H} rx="18" fill="#F0FDFA" />
          <Ellipse cx="92" cy="176" rx="58" ry="132" fill="#CCFBF1" stroke="#0F766E" strokeWidth="4" />
          <Ellipse cx="208" cy="176" rx="58" ry="132" fill="#CCFBF1" stroke="#0F766E" strokeWidth="4" />
          <Rect x="124" y="158" width="52" height="56" rx="18" fill="#99F6E4" stroke="#0F766E" strokeWidth="3" />
          <Line x1="36" y1="130" x2="264" y2="130" stroke="#14B8A6" strokeWidth="2" strokeDasharray="7 7" />
          <Line x1="36" y1="236" x2="264" y2="236" stroke="#14B8A6" strokeWidth="2" strokeDasharray="7 7" />
          <Line x1="150" y1="52" x2="150" y2="300" stroke="#0F766E" strokeWidth="2" strokeDasharray="6 7" opacity={0.45} />
          <SvgText x="92" y="34" textAnchor="middle" fontSize="12" fontWeight="900" fill="#115E59">
            Правая доля
          </SvgText>
          <SvgText x="208" y="34" textAnchor="middle" fontSize="12" fontWeight="900" fill="#115E59">
            Левая доля
          </SvgText>
          <SvgText x="150" y="335" textAnchor="middle" fontSize="12" fontWeight="900" fill="#115E59">
            перешеек
          </SvgText>
          {markers.map((m) => {
            const cx = m.point.x * VIEW_W;
            const cy = m.point.y * VIEW_H;
            const active = m.id === selectedId;
            return (
              <Circle
                key={m.id}
                cx={cx}
                cy={cy}
                r={active ? 13 : 10}
                fill="#F97316"
                stroke="#7C2D12"
                strokeWidth={active ? 3 : 2}
              />
            );
          })}
          {draftPath ? <Path d={draftPath} stroke="#EA580C" strokeWidth={3} fill="none" /> : null}
        </Svg>
      </View>

      {selected ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Локализация узла</Text>
          <Text style={styles.resultText}>{formatThyroidLocationRu(selected.point)}</Text>
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
  wrap: { gap: 14, alignItems: "center" },
  toolRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignSelf: "stretch" },
  toolBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  toolBtnOn: { borderColor: "#0F766E", backgroundColor: "#CCFBF1" },
  toolText: { fontWeight: "800", color: "#64748B", fontSize: 12 },
  toolTextOn: { color: "#115E59" },
  canvas: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#99F6E4",
    backgroundColor: "#F0FDFA",
    overflow: "hidden",
  },
  resultBox: {
    alignSelf: "stretch",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#99F6E4",
    backgroundColor: "#F0FDFA",
    padding: 12,
    gap: 6,
  },
  resultTitle: { fontSize: 12, fontWeight: "900", color: "#115E59" },
  resultText: { fontSize: 14, fontWeight: "700", color: "#0F172A", lineHeight: 20 },
  protocolBox: {
    alignSelf: "stretch",
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
