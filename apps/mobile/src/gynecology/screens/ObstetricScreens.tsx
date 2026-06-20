import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { PageType } from "../../navigationTypes";
import { GynBackToHub } from "../components/GynBackToHub";
import { gynRouterStyles as s } from "../gynRouterStyles";
import {
  BISHOP_DISCLAIMER,
  CLINICAL_EFW_DISCLAIMER,
  VBAC_DISCLAIMER,
  bishopScore,
  assessVbacInLabor,
  assessVbacPreLabor,
  efwMaternalAnthropometry,
  efwRudakov,
  estimateFetalWeightAll,
  type BishopConsistency,
  type BishopDilation,
  type BishopEffacement,
  type BishopPosition,
  type BishopStation,
  type FetalPresentation,
  type VbacInLaborInput,
  type VbacPreInput,
} from "@repo/medical-calculations";

function Chip({
  label,
  on,
  onPress,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: on ? "#0d9488" : "#d1d5db",
        backgroundColor: on ? "#ccfbf1" : "#fff",
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "600", color: on ? "#0f766e" : "#374151" }}>{label}</Text>
    </Pressable>
  );
}

export function ScreenBishop({ setPage }: { setPage: (p: PageType) => void }) {
  const [dilation, setDilation] = useState<BishopDilation>(0);
  const [effacement, setEffacement] = useState<BishopEffacement>(0);
  const [station, setStation] = useState<BishopStation>(0);
  const [consistency, setConsistency] = useState<BishopConsistency>(1);
  const [position, setPosition] = useState<BishopPosition>(1);

  const result = bishopScore({ dilation, effacement, station, consistency, position });

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={s.card}>
        <GynBackToHub onPress={() => setPage("gyn_quick_access")} />
        <Text style={s.title}>Шкала Бишопа</Text>
        <Text style={s.meta}>0–13 · ≥6 благоприятна для индукции</Text>

        <Text style={s.label}>Раскрытие</Text>
        <View style={s.rowWrap}>
          {([0, 1, 2, 3] as BishopDilation[]).map((v, i) => (
            <Chip key={v} label={["0 см", "1–2", "3–4", "≥5"][i]} on={dilation === v} onPress={() => setDilation(v)} />
          ))}
        </View>

        <Text style={s.label}>Сглаженность</Text>
        <View style={s.rowWrap}>
          {([0, 1, 2, 3] as BishopEffacement[]).map((v, i) => (
            <Chip key={v} label={["0–30%", "40–50", "60–70", "≥80"][i]} on={effacement === v} onPress={() => setEffacement(v)} />
          ))}
        </View>

        <Text style={s.label}>Station</Text>
        <View style={s.rowWrap}>
          {([0, 1, 2, 3] as BishopStation[]).map((v, i) => (
            <Chip key={v} label={["−3", "−2", "−1/0", "+1/+2"][i]} on={station === v} onPress={() => setStation(v)} />
          ))}
        </View>

        <Text style={s.label}>Консистенция / положение</Text>
        <View style={s.rowWrap}>
          {([0, 1, 2] as BishopConsistency[]).map((v, i) => (
            <Chip key={v} label={["Плотная", "Средняя", "Мягкая"][i]} on={consistency === v} onPress={() => setConsistency(v)} />
          ))}
          {([0, 1, 2] as BishopPosition[]).map((v, i) => (
            <Chip key={v} label={["Задняя", "Средняя", "Передняя"][i]} on={position === v} onPress={() => setPosition(v)} />
          ))}
        </View>

        <Text style={[s.result, { marginTop: 8, fontWeight: "800", fontSize: 22 }]}>{result.total} / 13</Text>
        <Text style={s.result}>{result.interpretation}</Text>
        <Text style={s.meta}>{BISHOP_DISCLAIMER}</Text>
      </View>
    </ScrollView>
  );
}

const DEFAULT_PRE: VbacPreInput = {
  singleLtcs: true,
  nonRecurringIndication: true,
  priorVaginalBirth: false,
  interval18Months: true,
  noMacrosomiaSuspected: true,
  cephalicSingleton: true,
  noPlacentaPrevia: true,
  noClassicalScar: true,
  noUterineRuptureHistory: true,
  continuousMonitoringAvailable: true,
};

const PRE_KEYS: { key: keyof VbacPreInput; label: string }[] = [
  { key: "singleLtcs", label: "Один LTCS" },
  { key: "nonRecurringIndication", label: "Нерекur rentное показание" },
  { key: "priorVaginalBirth", label: "Были вагинальные роды" },
  { key: "interval18Months", label: "Интервал ≥18 мес" },
  { key: "noMacrosomiaSuspected", label: "Нет макросомии" },
  { key: "cephalicSingleton", label: "Головное, одноплодие" },
  { key: "noPlacentaPrevia", label: "Нет placenta previa" },
  { key: "noClassicalScar", label: "Нет классического рубца" },
  { key: "noUterineRuptureHistory", label: "Нет разрыва матки" },
  { key: "continuousMonitoringAvailable", label: "CTG + экстренное КС" },
];

export function ScreenVbac({ setPage }: { setPage: (p: PageType) => void }) {
  const [tab, setTab] = useState<"pre" | "labor">("pre");
  const [pre, setPre] = useState<VbacPreInput>(DEFAULT_PRE);
  const [labor, setLabor] = useState<VbacInLaborInput>({
    spontaneousLabor: true,
    activeLabor: true,
    dilationAtLeast4cm: true,
    noExcessiveOxytocin: true,
    ctgCategory1: true,
    noAntepartumBleedingInLabor: true,
    noHyperstimulation: true,
  });

  const preResult = assessVbacPreLabor(pre);
  const laborResult = assessVbacInLabor(labor);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={s.card}>
        <GynBackToHub onPress={() => setPage("gyn_quick_access")} />
        <Text style={s.title}>VBAC / TOLAC</Text>
        <View style={[s.rowWrap, { marginTop: 8 }]}>
          <Chip label="До родов" on={tab === "pre"} onPress={() => setTab("pre")} />
          <Chip label="В родах" on={tab === "labor"} onPress={() => setTab("labor")} />
        </View>

        {tab === "pre" ? (
          <>
            <View style={[s.rowWrap, { marginTop: 8 }]}>
              {PRE_KEYS.map(({ key, label }) => (
                <Chip
                  key={key}
                  label={pre[key] ? `✓ ${label}` : label}
                  on={pre[key]}
                  onPress={() => setPre((p) => ({ ...p, [key]: !p[key] }))}
                />
              ))}
            </View>
            <Text style={[s.result, { marginTop: 8 }]}>
              {preResult.score}/{preResult.maxScore} · {preResult.category}
              {"\n"}
              {preResult.lines.join("\n")}
            </Text>
          </>
        ) : (
          <>
            <View style={[s.rowWrap, { marginTop: 8 }]}>
              {(Object.keys(labor) as (keyof VbacInLaborInput)[]).map((key) => (
                <Chip
                  key={key}
                  label={labor[key] ? `✓ ${key}` : key}
                  on={!!labor[key]}
                  onPress={() => setLabor((p) => ({ ...p, [key]: !p[key] }))}
                />
              ))}
            </View>
            <Text style={[s.result, { marginTop: 8 }]}>
              {laborResult.continueTolac ? "TOLAC продолжается" : "Рассмотреть прекращение TOLAC"}
              {"\n"}
              {[...laborResult.alerts, "", ...laborResult.monitoring].join("\n")}
            </Text>
          </>
        )}
        <Text style={s.meta}>{VBAC_DISCLAIMER}</Text>
      </View>
    </ScrollView>
  );
}

export function ScreenEfw({ setPage }: { setPage: (p: PageType) => void }) {
  const [tab, setTab] = useState<"hadlock" | "rudakov" | "maternal">("hadlock");
  const [bpd, setBpd] = useState("");
  const [hc, setHc] = useState("");
  const [ac, setAc] = useState("");
  const [fl, setFl] = useState("");
  const [vdm, setVdm] = useState("");
  const [ozh, setOzh] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [presentation, setPresentation] = useState<FetalPresentation>("cephalic");
  const [nulliparous, setNulliparous] = useState(true);
  const [out, setOut] = useState("");

  const num = (x: string) => {
    const v = Number.parseFloat(x.replace(",", "."));
    return Number.isFinite(v) ? v : undefined;
  };

  const run = () => {
    if (tab === "hadlock") {
      const results = estimateFetalWeightAll({
        bpdMm: num(bpd),
        hcMm: num(hc),
        acMm: num(ac),
        flMm: num(fl),
      });
      if (results.length === 0) {
        setOut("Введите BPD/HC/AC/FL, мм");
        return;
      }
      setOut(results.map((r) => `${r.grams} г · ${r.label}`).join("\n"));
      return;
    }
    if (tab === "rudakov") {
      const r = efwRudakov({
        fundalHeightCm: num(vdm) ?? 0,
        abdominalCircumferenceCm: num(ozh) ?? 0,
        presentation,
      });
      setOut(r ? `${r.grams} г\n${r.formula}\n${r.note}` : "Проверьте ВДМ и ОЖ");
      return;
    }
    const r = efwMaternalAnthropometry({
      maternalWeightKg: num(weight) ?? 0,
      maternalHeightCm: num(height) ?? 0,
      fundalHeightCm: num(vdm) ?? 0,
      nulliparous,
    });
    setOut(r ? `${r.grams} г\n${r.formula}\n${r.note}` : "Проверьте вес, рост, ВДМ");
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={s.card}>
        <GynBackToHub onPress={() => setPage("gyn_quick_access")} />
        <Text style={s.title}>Масса плода</Text>
        <View style={[s.rowWrap, { marginTop: 8 }]}>
          <Chip label="Hadlock" on={tab === "hadlock"} onPress={() => setTab("hadlock")} />
          <Chip label="Рудаков" on={tab === "rudakov"} onPress={() => setTab("rudakov")} />
          <Chip label="Антропометрия" on={tab === "maternal"} onPress={() => setTab("maternal")} />
        </View>

        {tab === "hadlock" ? (
          <>
            <Text style={s.label}>BPD / HC / AC / FL, мм</Text>
            <TextInput style={s.input} value={bpd} onChangeText={setBpd} placeholder="BPD" keyboardType="decimal-pad" />
            <TextInput style={s.input} value={hc} onChangeText={setHc} placeholder="HC" keyboardType="decimal-pad" />
            <TextInput style={s.input} value={ac} onChangeText={setAc} placeholder="AC" keyboardType="decimal-pad" />
            <TextInput style={s.input} value={fl} onChangeText={setFl} placeholder="FL" keyboardType="decimal-pad" />
          </>
        ) : null}

        {tab === "rudakov" ? (
          <>
            <TextInput style={s.input} value={vdm} onChangeText={setVdm} placeholder="ВДМ, см" keyboardType="decimal-pad" />
            <TextInput style={s.input} value={ozh} onChangeText={setOzh} placeholder="ОЖ, см" keyboardType="decimal-pad" />
            <View style={s.rowWrap}>
              {(
                [
                  ["cephalic", "Головное"],
                  ["breech", "Тазовое"],
                  ["transverse", "Поперечное"],
                ] as const
              ).map(([id, label]) => (
                <Chip key={id} label={label} on={presentation === id} onPress={() => setPresentation(id)} />
              ))}
            </View>
          </>
        ) : null}

        {tab === "maternal" ? (
          <>
            <TextInput style={s.input} value={weight} onChangeText={setWeight} placeholder="Вес, кг" keyboardType="decimal-pad" />
            <TextInput style={s.input} value={height} onChangeText={setHeight} placeholder="Рост, см" keyboardType="decimal-pad" />
            <TextInput style={s.input} value={vdm} onChangeText={setVdm} placeholder="ВДМ, см" keyboardType="decimal-pad" />
            <Chip label={nulliparous ? "Первые роды" : "Повторные"} on={nulliparous} onPress={() => setNulliparous((v) => !v)} />
          </>
        ) : null}

        <Pressable style={[s.btn, { marginTop: 8 }]} onPress={run}>
          <Text style={s.btnText}>Рассчитать</Text>
        </Pressable>
        {out ? <Text style={s.result}>{out}</Text> : null}
        <Text style={s.meta}>{CLINICAL_EFW_DISCLAIMER}</Text>
      </View>
    </ScrollView>
  );
}
