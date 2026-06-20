import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useMemo, useState } from "react";
import {
  APPOINTMENT_CALCULATORS,
  APPOINTMENT_CATEGORY_LABELS,
  APPOINTMENT_CATEGORY_ORDER,
  getFrequentAtAppointment,
  type AppointmentCalculator,
} from "@repo/clinical-tools";

import { openWebPath } from "../../lib/clinical-tools/openClinicalTool";
import type { PageType } from "../../navigationTypes";
import { gynRouterStyles as s } from "../gynRouterStyles";

const GYN_NATIVE: Partial<Record<string, PageType>> = {
  "ga-lmp": "gyn_ga_lmp",
  "ga-us": "gyn_ga_us",
  "ga-ivf": "gyn_ga_ovo_ivf",
  "ga-crl": "gyn_ga_crl",
  "ga-feto": "gyn_ga_feto",
  "maternity-leave": "gyn_dekret",
  "breast-risk": "gyn_breast_risk",
};

type Props = {
  setPage: (p: PageType) => void;
};

function openCalc(calc: AppointmentCalculator, setPage: (p: PageType) => void) {
  const native = GYN_NATIVE[calc.id];
  if (native) {
    setPage(native);
    return;
  }
  if (calc.webHref) {
    void openWebPath(calc.webHref);
  }
}

export function GynQuickAccess({ setPage }: Props) {
  const [query, setQuery] = useState("");
  const frequent = getFrequentAtAppointment();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return APPOINTMENT_CALCULATORS;
    return APPOINTMENT_CALCULATORS.filter((c) => {
      const hay = [c.title, c.description, ...(c.searchTerms ?? [])].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={s.card}>
        <Text style={s.title}>Для приёма врача</Text>
        <Text style={s.meta}>Быстрый доступ · поиск · категории OblCalc</Text>
        <TextInput
          placeholder="Поиск: ПДР, Bishop, VBAC…"
          value={query}
          onChangeText={setQuery}
          style={{
            borderWidth: 1,
            borderColor: "#334155",
            borderRadius: 12,
            padding: 12,
            marginTop: 12,
            color: "#f8fafc",
            backgroundColor: "#0f172a",
          }}
          placeholderTextColor="#64748b"
        />

        <Text style={[s.tileTitle, { marginTop: 16 }]}>Часто на приёме</Text>
        <View style={s.rowWrap}>
          {frequent.map((c) => (
            <CalcTile key={c.id} calc={c} onPress={() => openCalc(c, setPage)} />
          ))}
        </View>

        {APPOINTMENT_CATEGORY_ORDER.map((cat) => {
          const items = filtered.filter((c) => c.category === cat.id);
          if (items.length === 0) return null;
          return (
            <View key={cat.id}>
              <Text style={[s.tileTitle, { marginTop: 16 }]}>{APPOINTMENT_CATEGORY_LABELS[cat.id]}</Text>
              <View style={s.rowWrap}>
                {items.map((c) => (
                  <CalcTile key={c.id} calc={c} onPress={() => openCalc(c, setPage)} />
                ))}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function CalcTile({ calc, onPress }: { calc: AppointmentCalculator; onPress: () => void }) {
  const badge =
    calc.status === "implemented" ? null : calc.status === "partial" ? "~" : "скоро";
  return (
    <Pressable style={s.tile} onPress={onPress}>
      <Text style={s.tileTitle} numberOfLines={2}>
        {badge ? `${badge} ` : ""}
        {calc.title}
      </Text>
      <Text style={s.tileSub} numberOfLines={2}>
        {calc.description}
      </Text>
    </Pressable>
  );
}
