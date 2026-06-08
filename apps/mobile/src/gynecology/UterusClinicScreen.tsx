import * as Clipboard from "expo-clipboard";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { PageType } from "../navigationTypes";
import FigoFibroidInteractive, { type FigoFibroidSnapshot } from "./FigoFibroidInteractive";
import UterusCoronalPanel from "./UterusCoronalPanel";
import UterusSlicePanel from "./uterus3d/UterusSlicePanel";
import {
  buildCombinedUterusReport,
  type AdenomyosisUsConsensusInput,
  type DeepEndometriosisConsensusInput,
} from "./uterusAdenomyosisDieConsensus";

const s = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  backBtn: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    marginBottom: 4,
    alignSelf: "flex-start",
  },
  backBtnText: { color: "#0f172a", fontWeight: "600" },
  title: { fontSize: 17, fontWeight: "800", color: "#111827" },
  meta: { fontSize: 11, color: "#64748b", lineHeight: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: "#831843", marginTop: 8 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
  copyBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#0d9488",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  copyBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  mergedBox: {
    marginTop: 6,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  mergedText: { fontSize: 13, lineHeight: 19, color: "#0f172a", fontWeight: "500" },
});

const ADENO_ITEMS: { key: keyof AdenomyosisUsConsensusInput; label: string }[] = [
  { key: "globularUterus", label: "Глобуларная матка" },
  { key: "asymmetricWallThickening", label: "Асимметрия стенки" },
  { key: "interruptedOrIllDefinedJunctionalZone", label: "Нарушена переходная зона" },
  { key: "myometrialCystsOrLinearStriations", label: "Кисты/линейные включения" },
  { key: "fanShapedShadowing", label: "Веерообразное затенение" },
  { key: "asymmetricVascularPattern", label: "Асимметрия кровотока" },
  { key: "tendernessOnExam", label: "Болезненность зондом" },
];

const DIE_ITEMS: { key: keyof DeepEndometriosisConsensusInput; label: string }[] = [
  { key: "uterosacralThickeningOrNodules", label: "Утеросакральные связки" },
  { key: "posteriorParametriumToronus", label: "Задний параметрий / торус" },
  { key: "rectosigmoidAdhesionOrThickening", label: "Ректосигмоид / спайки" },
  { key: "bladderWallLesion", label: "Стенка мочевого пузыря" },
  { key: "ureterDilatationOrHydroureter", label: "Мочеточник / гидронефроз" },
  { key: "pouchOfDouglasTetheredKissingOvaries", label: "Фиксация таза / kissing ovaries" },
];

const defaultAdeno: AdenomyosisUsConsensusInput = {
  globularUterus: false,
  asymmetricWallThickening: false,
  interruptedOrIllDefinedJunctionalZone: false,
  myometrialCystsOrLinearStriations: false,
  fanShapedShadowing: false,
  asymmetricVascularPattern: false,
  tendernessOnExam: false,
};

const defaultDie: DeepEndometriosisConsensusInput = {
  uterosacralThickeningOrNodules: false,
  posteriorParametriumToronus: false,
  rectosigmoidAdhesionOrThickening: false,
  bladderWallLesion: false,
  ureterDilatationOrHydroureter: false,
  pouchOfDouglasTetheredKissingOvaries: false,
};

export default function UterusClinicScreen({ setPage }: { setPage: (p: PageType) => void }) {
  const [figo, setFigo] = useState<FigoFibroidSnapshot | null>(null);
  const [coronalProtocol, setCoronalProtocol] = useState("");
  const onFigoSnap = useCallback((snap: FigoFibroidSnapshot) => setFigo(snap), []);
  const [adeno, setAdeno] = useState<AdenomyosisUsConsensusInput>(defaultAdeno);
  const [die, setDie] = useState<DeepEndometriosisConsensusInput>(defaultDie);

  const fibroidProtocol = useMemo(() => {
    const coronal = coronalProtocol.trim();
    const p = figo?.protocol?.trim();
    if (coronal && p) return `${coronal}\n\n${p}`;
    return coronal || p || "[Миома] Отметьте очаг на коронарном макете или схеме FIGO — текст обновится.";
  }, [figo?.protocol, coronalProtocol]);

  const merged = useMemo(
    () => buildCombinedUterusReport({ fibroidProtocol, adeno, die }),
    [fibroidProtocol, adeno, die]
  );

  const copy = async () => {
    await Clipboard.setStringAsync(merged);
  };

  return (
    <View style={s.card}>
      <Pressable style={s.backBtn} onPress={() => setPage("gyn_hub")}>
        <Text style={s.backBtnText}>← К разделу «Для гинеколога»</Text>
      </Pressable>

      <Text style={s.title}>Матка: FIGO + аденомиоз / глубокий эндометриоз</Text>
      <Text style={s.meta}>
        Помощник врача и образовательный контент; не официальный диагноз и не замена очной консультации или заключения
        специалиста. Один экран: интерактивная классификация миомы (FIGO PALM-COEIN — L), чеклисты sono-признаков
        аденомиоза (ориентиры MUSA) и маркеров DIE, затем автоматически собирается объединённый текст для протокола.
        Финальная формулировка в документации — решение врача.
      </Text>

      <Text style={s.sectionTitle}>Коронарный макет — место образования</Text>
      <UterusCoronalPanel onProtocolChange={setCoronalProtocol} />

      <Text style={s.sectionTitle}>Сагиттальный срез — помощник врача (образование)</Text>
      <UterusSlicePanel />

      <FigoFibroidInteractive onSnapshot={onFigoSnap} />

      <Text style={s.sectionTitle}>Аденомиоз — sono-признаки (образовательный консенсус)</Text>
      <View style={s.rowWrap}>
        {ADENO_ITEMS.map((it) => {
          const on = adeno[it.key];
          return (
            <Pressable
              key={it.key}
              style={[s.chip, on && s.chipOn]}
              onPress={() => setAdeno((prev) => ({ ...prev, [it.key]: !prev[it.key] }))}
            >
              <Text style={[s.chipText, on && s.chipTextOn]}>{it.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={s.sectionTitle}>Глубокий инфильтративный эндометриоз (DIE) — sono-маркеры</Text>
      <View style={s.rowWrap}>
        {DIE_ITEMS.map((it) => {
          const on = die[it.key];
          return (
            <Pressable
              key={it.key}
              style={[s.chip, on && s.chipOn]}
              onPress={() => setDie((prev) => ({ ...prev, [it.key]: !prev[it.key] }))}
            >
              <Text style={[s.chipText, on && s.chipTextOn]}>{it.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={s.sectionTitle}>Объединённый протокол</Text>
      <Pressable style={s.copyBtn} onPress={() => void copy()}>
        <Text style={s.copyBtnText}>Скопировать текст</Text>
      </Pressable>
      <View style={s.mergedBox}>
        <Text style={s.mergedText} selectable>
          {merged}
        </Text>
      </View>
    </View>
  );
}
