import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useMemo, useState } from "react";
import {
  PixelRatio,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Vector3 } from "three";
import type { UterusHitResult } from "./figoHitMapping";
import UterusScene, { type EduMode, type UterusViewPresetId } from "./Uterus3DScene";
import { computeFibroidClinicalMetrics } from "./clinicalFibroidLogic";
import {
  defaultAdenoFocal,
  defaultFibroidMarker,
  type AdenoFocalState,
  type FibroidMarkerState,
  type UterusClinicalWorkspaceBinding,
  type WorkspaceToolId,
  vecFromTuple,
} from "./clinicalWorkspaceTypes";
import { UTERUS_VIEW_PRESET_LABELS_RU } from "./uterusCameraPresets";
import {
  DEFAULT_SCAR_NICHE_MEASUREMENTS_MM,
  clampMeasurementMm,
  nicheResidualMyometrialRatio,
  sceneToApproxMm,
  type ScarNicheMeasurementsMm,
} from "./scarNicheTypes";
import { useNativeGlbAssetUri } from "./useNativeGlbAssetUri";
import { WEB_UTERUS_GLB_PATH } from "./uterusModelUrls";

const styles = StyleSheet.create({
  workspaceOuter: { gap: 10 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  workspaceRow: { gap: 12 },
  toolbarRail: {
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fafafa",
    minWidth: 148,
  },
  toolbarBtn: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
  },
  toolbarBtnOn: {
    backgroundColor: "#fdf4ff",
    borderColor: "#d946ef",
  },
  toolbarBtnText: { fontSize: 11, fontWeight: "700", color: "#334155" },
  toolbarBtnTextOn: { color: "#86198f" },
  panelRail: {
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fafafa",
    minWidth: 200,
    flexShrink: 0,
  },
  canvasHost: {
    flexGrow: 1,
    minHeight: 420,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#0b1220",
  },
  canvasHostWide: { minHeight: 480 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#0f172a", letterSpacing: 0.2 },
  meta: { fontSize: 10, color: "#64748b", lineHeight: 15 },
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
  tooltipBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    gap: 8,
  },
  tooltipPrimary: { fontSize: 13, fontWeight: "700", color: "#0f172a", lineHeight: 19 },
  tooltipSecondary: { fontSize: 12, color: "#475569", lineHeight: 17 },
  tooltipHint: { fontSize: 10, color: "#64748b", lineHeight: 14 },
  subSectionTitle: { fontSize: 11, fontWeight: "800", color: "#475569", marginTop: 4 },
  measureWrap: { gap: 8 },
  measureRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "flex-end" },
  measureCell: { gap: 4 },
  measureLabel: { fontSize: 9, fontWeight: "700", color: "#64748b", maxWidth: 118 },
  measureInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 8,
    minWidth: 56,
    fontSize: 13,
    fontWeight: "600",
    backgroundColor: "#fff",
    color: "#0f172a",
  },
  measureLegend: { fontSize: 10, color: "#64748b", lineHeight: 14 },
  disclaimer: {
    fontSize: 11,
    color: "#334155",
    lineHeight: 16,
    fontWeight: "600",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
});

function compactTooltipEn(hit: UterusHitResult): string {
  const tail = hit.tooltipEn.replace(/^FIGO \d+ — /, "");
  return `FIGO ${hit.figoType} · ${tail}`;
}

function UterusCanvasSuspenseFallback() {
  return <color attach="background" args={["#0b1220"]} />;
}

function parseMmInput(raw: string, fallback: number): number {
  const v = parseFloat(raw.replace(",", "."));
  return Number.isFinite(v) ? v : fallback;
}

function parseFloatInput(raw: string, fallback: number): number {
  const v = parseFloat(raw.replace(",", "."));
  return Number.isFinite(v) ? v : fallback;
}

const VIEW_PRESET_ORDER: UterusViewPresetId[] = [
  "three_quarter",
  "sagittal",
  "coronal",
  "axial",
  "anterior",
  "posterior",
  "patient_left",
  "patient_right",
  "fundus",
  "cervix_os",
  "intracavity_to_fundus",
  "intracavity_to_cervix",
  "hysteroscopy_scar",
  "free",
];

const TOOL_LABELS: Record<WorkspaceToolId, string> = {
  orbit_rotate: "Вращение",
  orbit_pan: "Pan",
  add_fibroid: "+ Миома",
  add_adeno_focal: "+ Очаг АДМ",
  measure_distance: "Линейка",
};

export default function Uterus3DPanel() {
  const { width } = useWindowDimensions();
  const wide = width >= 920;

  const nativeGlbUri = useNativeGlbAssetUri();
  const glbUrl = Platform.OS === "web" ? WEB_UTERUS_GLB_PATH : nativeGlbUri;

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [eduMode, setEduMode] = useState<EduMode>("anatomy");
  const [pedunculated, setPedunculated] = useState(false);
  const [hit, setHit] = useState<UterusHitResult | null>(null);

  const [workspaceTool, setWorkspaceTool] = useState<WorkspaceToolId>("orbit_rotate");
  const [orbitDragLocked, setOrbitDragLocked] = useState(false);

  const [fibroids, setFibroids] = useState<FibroidMarkerState[]>([]);
  const [fibroidSelectedId, setFibroidSelectedId] = useState<string | null>(null);

  const [adenoFoci, setAdenoFoci] = useState<AdenoFocalState[]>([]);
  const [adenoSelectedId, setAdenoSelectedId] = useState<string | null>(null);

  const [measurePts, setMeasurePts] = useState<[Vector3 | null, Vector3 | null]>([null, null]);

  const [adeno, setAdeno] = useState({ diffuse: true, focal: true, cystic: true });
  const [viewPreset, setViewPreset] = useState<UterusViewPresetId>("three_quarter");
  const [scarEnabled, setScarEnabled] = useState(false);
  const [scarMm, setScarMm] = useState<ScarNicheMeasurementsMm>(() => ({ ...DEFAULT_SCAR_NICHE_MEASUREMENTS_MM }));

  const scarNichePayload = useMemo(
    () => ({
      enabled: scarEnabled,
      measurements: clampMeasurementMm(scarMm),
    }),
    [scarEnabled, scarMm]
  );

  const dpr = useMemo((): [number, number] => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined" || !window.devicePixelRatio) return [1, 1.5];
      return [1, Math.min(1.5, window.devicePixelRatio)];
    }
    const pr = PixelRatio.get();
    return [1, Math.min(2, pr)];
  }, []);

  const selectedFibroid = useMemo(
    () => fibroids.find((f) => f.id === fibroidSelectedId) ?? null,
    [fibroids, fibroidSelectedId]
  );

  const selectedAdeno = useMemo(
    () => adenoFoci.find((f) => f.id === adenoSelectedId) ?? null,
    [adenoFoci, adenoSelectedId]
  );

  const fibroidMetrics = useMemo(() => {
    if (!selectedFibroid) return null;
    return computeFibroidClinicalMetrics(vecFromTuple(selectedFibroid.position), pedunculated, selectedFibroid.cavityBias01);
  }, [selectedFibroid, pedunculated]);

  const measureMm =
    measurePts[0] && measurePts[1] ? sceneToApproxMm(measurePts[0].distanceTo(measurePts[1])) : null;

  const scarResidual = useMemo(() => {
    const m = clampMeasurementMm(scarMm);
    return nicheResidualMyometrialRatio(m.residualMyometriumMm, m.nicheDepthMm);
  }, [scarMm]);

  const handlePick = useCallback(
    (h: UterusHitResult, local: Vector3) => {
      if (workspaceTool === "add_fibroid" && eduMode === "figo") {
        const nu = defaultFibroidMarker([local.x, local.y, local.z]);
        setFibroids((prev) => [...prev, nu]);
        setFibroidSelectedId(nu.id);
        setWorkspaceTool("orbit_rotate");
        setHit(h);
        return;
      }
      if (workspaceTool === "add_adeno_focal" && eduMode === "adenomyosis") {
        setAdenoFoci((prev) => [...prev, defaultAdenoFocal([local.x, local.y, local.z])]);
        setAdenoSelectedId(null);
        setWorkspaceTool("orbit_rotate");
        return;
      }
      if (workspaceTool === "measure_distance") {
        setMeasurePts(([a, b]) => {
          if (!a) return [local.clone(), b];
          if (!b) return [a, local.clone()];
          return [local.clone(), null];
        });
        return;
      }
      setHit(h);
    },
    [workspaceTool, eduMode]
  );

  const clinicalWorkspace = useMemo(
    (): UterusClinicalWorkspaceBinding => ({
      fibroidMarkers: fibroids,
      fibroidSelectedId,
      fibroidsVisible: eduMode === "figo" && fibroids.length > 0,
      onFibroidSelect: setFibroidSelectedId,
      onFibroidPositionCommit: (id, local) => {
        setFibroids((prev) =>
          prev.map((m) => (m.id === id ? { ...m, position: [local.x, local.y, local.z] } : m))
        );
      },
      adenoFoci,
      adenoSelectedId,
      adenoFociVisible: eduMode === "adenomyosis" && adenoFoci.length > 0 && adeno.focal,
      onAdenoSelect: setAdenoSelectedId,
      onAdenoPositionCommit: (id, local) => {
        setAdenoFoci((prev) =>
          prev.map((m) => (m.id === id ? { ...m, position: [local.x, local.y, local.z] } : m))
        );
      },
      measurePointA: measurePts[0],
      measurePointB: measurePts[1],
      measureOverlayVisible: Boolean(measurePts[0] && measurePts[1]),
      onWorkspaceDragLock: setOrbitDragLocked,
    }),
    [
      fibroids,
      fibroidSelectedId,
      eduMode,
      adenoFoci,
      adenoSelectedId,
      adeno.focal,
      measurePts,
    ]
  );

  const resetWorkspace = useCallback(() => {
    setFibroids([]);
    setFibroidSelectedId(null);
    setAdenoFoci([]);
    setAdenoSelectedId(null);
    setMeasurePts([null, null]);
    setWorkspaceTool("orbit_rotate");
    setViewPreset("three_quarter");
    setHit(null);
  }, []);

  const demoTooltipLine = hit ? compactTooltipEn(hit) : "Удар по модели — слой и образовательная FIGO; режим FIGO — добавление миомы инструментом «+ Миома»";

  const planningReportRu = useMemo(() => {
    const blocks: string[] = [];
    if (fibroidMetrics) {
      blocks.push(`[Миома · FIGO] ${fibroidMetrics.summaryRu}`);
    }
    if (selectedAdeno) {
      blocks.push(
        `[Аденомиоз · очаг] Учебный очаг: глубина по модели ~${selectedAdeno.depthMm.toFixed(1)} мм (условная шкала); локализация уточняется по размещению маркера.`
      );
    }
    if (scarEnabled) {
      const m = clampMeasurementMm(scarMm);
      blocks.push(
        `[Рубец / ниша] RMT = ${m.residualMyometriumMm.toFixed(1)} мм · глубина = ${m.nicheDepthMm.toFixed(1)} мм · длина ${m.nicheLengthMm.toFixed(1)} · ширина ${m.nicheWidthMm.toFixed(1)} · от внутр. зева ${m.distanceFromInternalOsMm.toFixed(1)} мм · ratio ≈ ${(scarResidual * 100).toFixed(1)}%. Учебная проекция; не замена УЗИ.`
      );
    }
    if (measureMm !== null) {
      blocks.push(`[Замер] Хорда между двумя точками ≈ ${measureMm.toFixed(1)} мм (масштаб условный для Lathe-модели).`);
    }
    blocks.push(
      `[Хирургический ориентир] Формулировки для плана вмешательства формулирует лечащий врач по данным УЗИ/МРТ и клинике; сцена — вспомогательная схема планирования.`
    );
    return blocks.join("\n\n");
  }, [fibroidMetrics, selectedAdeno, scarEnabled, scarMm, scarResidual, measureMm]);

  const toolbar = (
    <View style={styles.toolbarRail}>
      <Text style={[styles.sectionTitle, { marginBottom: 6 }]}>Инструменты</Text>
      {(Object.keys(TOOL_LABELS) as WorkspaceToolId[]).map((tid) => (
        <Pressable
          key={tid}
          style={[styles.toolbarBtn, workspaceTool === tid && styles.toolbarBtnOn]}
          onPress={() => setWorkspaceTool(tid)}
        >
          <Text style={[styles.toolbarBtnText, workspaceTool === tid && styles.toolbarBtnTextOn]}>{TOOL_LABELS[tid]}</Text>
        </Pressable>
      ))}
      <Pressable
        style={[styles.toolbarBtn, { marginTop: 8 }]}
        onPress={() => setViewPreset((p) => (p === "free" ? "three_quarter" : "free"))}
      >
        <Text style={styles.toolbarBtnText}>Сброс ракурса</Text>
      </Pressable>
      <Pressable style={[styles.toolbarBtn, { marginTop: 4 }]} onPress={resetWorkspace}>
        <Text style={styles.toolbarBtnText}>Сброс маркеров</Text>
      </Pressable>
    </View>
  );

  const parametersPanel = (
    <ScrollView style={styles.panelRail} showsVerticalScrollIndicator={false} nestedScrollEnabled>
      <Text style={styles.sectionTitle}>Параметры узла</Text>
      <Text style={styles.meta}>Выберите маркер миомы в режиме FIGO — редактируйте размер и «bias» к полости.</Text>
      {selectedFibroid ? (
        <>
          <Text style={styles.subSectionTitle}>Радиус узла (усл.)</Text>
          <TextInput
            style={styles.measureInput}
            keyboardType="decimal-pad"
            value={String(selectedFibroid.radius)}
            onChangeText={(t) =>
              setFibroids((prev) =>
                prev.map((m) =>
                  m.id === selectedFibroid.id ? { ...m, radius: parseFloatInput(t, m.radius) } : m
                )
              )
            }
          />
          <Text style={styles.subSectionTitle}>Bias к полости (0–1)</Text>
          <TextInput
            style={styles.measureInput}
            keyboardType="decimal-pad"
            value={String(selectedFibroid.cavityBias01)}
            onChangeText={(t) =>
              setFibroids((prev) =>
                prev.map((m) =>
                  m.id === selectedFibroid.id
                    ? {
                        ...m,
                        cavityBias01: Math.min(
                          1,
                          Math.max(0, parseFloatInput(t, m.cavityBias01))
                        ),
                      }
                    : m
                )
              )
            }
          />
          <Text style={styles.measureLegend}>
            Увеличивает расчётный субмукозный компонент (учебная модель для PALM-COEIN).
          </Text>
        </>
      ) : (
        <Text style={styles.meta}>Маркер не выбран.</Text>
      )}

      {selectedAdeno && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Очаг аденомиоза</Text>
          <Text style={styles.subSectionTitle}>Глубина (усл. мм)</Text>
          <TextInput
            style={styles.measureInput}
            keyboardType="decimal-pad"
            value={String(selectedAdeno.depthMm)}
            onChangeText={(t) =>
              setAdenoFoci((prev) =>
                prev.map((m) =>
                  m.id === selectedAdeno.id ? { ...m, depthMm: parseMmInput(t, m.depthMm) } : m
                )
              )
            }
          />
          <Text style={styles.subSectionTitle}>Радиус очага</Text>
          <TextInput
            style={styles.measureInput}
            keyboardType="decimal-pad"
            value={String(selectedAdeno.radius)}
            onChangeText={(t) =>
              setAdenoFoci((prev) =>
                prev.map((m) =>
                  m.id === selectedAdeno.id ? { ...m, radius: parseFloatInput(t, m.radius) } : m
                )
              )
            }
          />
        </>
      )}

      {!selectedFibroid && !selectedAdeno && (
        <Text style={[styles.meta, { marginTop: 8 }]}>
          Режим «Линейка»: два нажатия по матке — линия и расчёт расстояния в блоке «Итог» ниже.
        </Text>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.workspaceOuter}>
      <Text style={styles.sectionTitle}>Интерактивный 3D uterine workspace</Text>
      <Text style={styles.disclaimer}>
        Учебно-планировочный модуль для врачей УЗИ / АГ: анатомические слои, FIGO, аденомиоз, рубец после КС. Не является
        диагнозом и не заменяет заключение специалиста, официальный отчёт УЗИ или протокол операции.
      </Text>
      <Text style={styles.meta}>
        GLB (опционально): {WEB_UTERUS_GLB_PATH}; без файла — оптимизированная Lathe-модель. Жесты: один палец —
        вращение; pinch — масштаб (Orbit). Режим Pan включает сдвиг сцены.
      </Text>

      <View style={[styles.row, { alignItems: "stretch" }]}>
        {(
          [
            { id: "anatomy" as const, label: "Анатомия" },
            { id: "figo" as const, label: "FIGO / миома" },
            { id: "adenomyosis" as const, label: "Аденомиоз" },
          ] as const
        ).map((m) => (
          <Pressable key={m.id} style={[styles.chip, eduMode === m.id && styles.chipOn]} onPress={() => setEduMode(m.id)}>
            <Text style={[styles.chipText, eduMode === m.id && styles.chipTextOn]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.row}>
        <Pressable style={[styles.chip, theme === "light" && styles.chipOn]} onPress={() => setTheme("light")}>
          <Text style={[styles.chipText, theme === "light" && styles.chipTextOn]}>Светлая сцена</Text>
        </Pressable>
        <Pressable style={[styles.chip, theme === "dark" && styles.chipOn]} onPress={() => setTheme("dark")}>
          <Text style={[styles.chipText, theme === "dark" && styles.chipTextOn]}>Тёмная сцена</Text>
        </Pressable>
        <Pressable style={[styles.chip, pedunculated && styles.chipOn]} onPress={() => setPedunculated((p) => !p)}>
          <Text style={[styles.chipText, pedunculated && styles.chipTextOn]}>Педикулярная миома</Text>
        </Pressable>
      </View>

      {eduMode === "adenomyosis" && (
        <View style={styles.row}>
          {(
            [
              { k: "diffuse" as const, label: "Диффузный" },
              { k: "focal" as const, label: "Очаговый" },
              { k: "cystic" as const, label: "Кистозный" },
            ] as const
          ).map((z) => (
            <Pressable
              key={z.k}
              style={[styles.chip, adeno[z.k] && styles.chipOn]}
              onPress={() => setAdeno((prev) => ({ ...prev, [z.k]: !prev[z.k] }))}
            >
              <Text style={[styles.chipText, adeno[z.k] && styles.chipTextOn]}>{z.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Text style={styles.subSectionTitle}>Рубец / ниша (нижний сегмент)</Text>
      <View style={styles.measureWrap}>
        <View style={styles.row}>
          <Pressable style={[styles.chip, scarEnabled && styles.chipOn]} onPress={() => setScarEnabled((v) => !v)}>
            <Text style={[styles.chipText, scarEnabled && styles.chipTextOn]}>Показать дефект</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, viewPreset === "hysteroscopy_scar" && styles.chipOn]}
            onPress={() => setViewPreset("hysteroscopy_scar")}
          >
            <Text style={[styles.chipText, viewPreset === "hysteroscopy_scar" && styles.chipTextOn]}>
              Гистеро → рубец
            </Text>
          </Pressable>
        </View>
        <Text style={styles.measureLegend}>
          RMT, глубина, длина и ширина ниши — мм (учебная геометрия). Residual ratio = RMT / (RMT + depth).
        </Text>
        <View style={[styles.measureRow, !scarEnabled && { opacity: 0.45 }]}>
          <View style={styles.measureCell}>
            <Text style={styles.measureLabel}>RMT (мм)</Text>
            <TextInput
              style={styles.measureInput}
              editable={scarEnabled}
              keyboardType="decimal-pad"
              value={String(scarMm.residualMyometriumMm)}
              onChangeText={(t) =>
                setScarMm((s) => ({ ...s, residualMyometriumMm: parseMmInput(t, s.residualMyometriumMm) }))
              }
            />
          </View>
          <View style={styles.measureCell}>
            <Text style={styles.measureLabel}>Глубина (мм)</Text>
            <TextInput
              style={styles.measureInput}
              editable={scarEnabled}
              keyboardType="decimal-pad"
              value={String(scarMm.nicheDepthMm)}
              onChangeText={(t) => setScarMm((s) => ({ ...s, nicheDepthMm: parseMmInput(t, s.nicheDepthMm) }))}
            />
          </View>
          <View style={styles.measureCell}>
            <Text style={styles.measureLabel}>Длина (мм)</Text>
            <TextInput
              style={styles.measureInput}
              editable={scarEnabled}
              keyboardType="decimal-pad"
              value={String(scarMm.nicheLengthMm)}
              onChangeText={(t) => setScarMm((s) => ({ ...s, nicheLengthMm: parseMmInput(t, s.nicheLengthMm) }))}
            />
          </View>
          <View style={styles.measureCell}>
            <Text style={styles.measureLabel}>Ширина (мм)</Text>
            <TextInput
              style={styles.measureInput}
              editable={scarEnabled}
              keyboardType="decimal-pad"
              value={String(scarMm.nicheWidthMm)}
              onChangeText={(t) => setScarMm((s) => ({ ...s, nicheWidthMm: parseMmInput(t, s.nicheWidthMm) }))}
            />
          </View>
          <View style={styles.measureCell}>
            <Text style={styles.measureLabel}>От внутр. зева (мм)</Text>
            <TextInput
              style={styles.measureInput}
              editable={scarEnabled}
              keyboardType="decimal-pad"
              value={String(scarMm.distanceFromInternalOsMm)}
              onChangeText={(t) =>
                setScarMm((s) => ({ ...s, distanceFromInternalOsMm: parseMmInput(t, s.distanceFromInternalOsMm) }))
              }
            />
          </View>
        </View>
        {scarEnabled && (
          <Text style={styles.measureLegend}>
            Актив: RMT {clampMeasurementMm(scarMm).residualMyometriumMm.toFixed(1)} мм · Δ{" "}
            {clampMeasurementMm(scarMm).nicheDepthMm.toFixed(1)} мм · от ЗВ{" "}
            {clampMeasurementMm(scarMm).distanceFromInternalOsMm.toFixed(1)} мм · ratio {(scarResidual * 100).toFixed(1)}%
          </Text>
        )}
      </View>

      <Text style={styles.subSectionTitle}>Клинические пресеты камеры</Text>
      <View style={styles.row}>
        {VIEW_PRESET_ORDER.map((id) => (
          <Pressable
            key={id}
            style={[styles.chip, viewPreset === id && styles.chipOn]}
            onPress={() => setViewPreset(id)}
          >
            <Text style={[styles.chipText, viewPreset === id && styles.chipTextOn]}>
              {UTERUS_VIEW_PRESET_LABELS_RU[id]}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.workspaceRow, wide ? { flexDirection: "row", alignItems: "stretch" } : { flexDirection: "column" }]}>
        {toolbar}
        <View style={[styles.canvasHost, wide && styles.canvasHostWide, !wide && { width: "100%" }]}>
          <Canvas
            shadows={Platform.OS === "web"}
            gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
            dpr={dpr}
            style={{ flex: 1, width: "100%", height: "100%" }}
          >
            <Suspense fallback={<UterusCanvasSuspenseFallback />}>
              <UterusScene
                theme={theme}
                eduMode={eduMode}
                pedunculated={pedunculated}
                showDiffuseAdeno={adeno.diffuse}
                showFocalAdeno={adeno.focal}
                showCysticAdeno={adeno.cystic}
                glbUrl={glbUrl}
                viewPreset={viewPreset}
                scarNiche={scarNichePayload}
                onPick={handlePick}
                clinicalWorkspace={clinicalWorkspace}
                enableOrbitPan={workspaceTool === "orbit_pan"}
                orbitInteractionsFrozen={orbitDragLocked}
              />
            </Suspense>
          </Canvas>
        </View>
        {wide ? parametersPanel : null}
      </View>

      {!wide ? parametersPanel : null}

      <View style={styles.tooltipBox}>
        <Text nativeID="tooltip" style={styles.tooltipPrimary} selectable>
          {fibroidMetrics?.summaryRu ?? demoTooltipLine}
        </Text>
        {fibroidMetrics && (
          <Text style={styles.tooltipSecondary} selectable>
            {fibroidMetrics.summaryEn}
          </Text>
        )}
        {hit && (
          <>
            <Text style={styles.tooltipSecondary} selectable>
              Удар: {hit.tooltipRu}
            </Text>
            <Text style={styles.tooltipHint} selectable>
              Слой: {hit.layerLabelRu} · группа: {hit.bucketRu}
            </Text>
          </>
        )}
      </View>

      <Text style={styles.sectionTitle}>Итоговое описание (draft для протокола)</Text>
      <Text style={[styles.tooltipSecondary, { paddingVertical: 8 }]} selectable>
        {planningReportRu}
      </Text>
      {fibroidMetrics && (
        <Text style={[styles.meta, { fontStyle: "italic" }]} selectable>
          EN draft: {fibroidMetrics.summaryEn}
        </Text>
      )}
    </View>
  );
}
