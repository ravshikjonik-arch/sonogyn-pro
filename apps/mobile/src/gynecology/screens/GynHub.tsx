import { Pressable, Text, View } from "react-native";
import type { PageType } from "../../navigationTypes";
import { PREGNANCY_CALC_VERSION } from "../pregnancyCalc";
import { gynRouterStyles as s } from "../gynRouterStyles";

export function GynHub({ setPage }: { setPage: (p: PageType) => void }) {
  const items: { id: PageType; title: string; sub: string }[] = [
    {
      id: "gyn_uterus_clinic",
      title: "Матка: FIGO + аденомиоз/DIE",
      sub: "Интерактив FIGO, sono-чеклисты, общий протокол",
    },
    { id: "gyn_ga_lmp", title: "По менструации", sub: "ПМП, срок сегодня, ПДР" },
    { id: "gyn_ga_us", title: "По УЗИ", sub: "Дата УЗИ + срок на момент осмотра" },
    { id: "gyn_ga_ovo_ivf", title: "Овуляция и ЭКО", sub: "ПДР от овуляции / переноса" },
    { id: "gyn_ga_crl", title: "По КТР", sub: "CRL мм + дата УЗИ" },
    { id: "gyn_ga_feto", title: "По фетометрии", sub: "BPD / HC / FL / AC (II–III тр.)" },
    { id: "gyn_dekret", title: "Декрет", sub: "Ориентиры по ПДР (ТК РФ, упрощ.)" },
    { id: "gyn_breast_risk", title: "Риск МЖ", sub: "Образовательный чеклист" },
    { id: "gyn_lnrads", title: "LN-RADS", sub: "Лимфатические узлы (УЗИ)" },
    { id: "gyn_figo_fibroid", title: "FIGO миома", sub: "Тип 0–8 по отношению к эндометрию/серозе" },
    {
      id: "gyn_medvedev_consensus",
      title: "Консенсусы УЗИ",
      sub: "MUSA · IETA · IOTA · IDEA · 3D (Medvedev 2018)",
    },
  ];
  return (
    <View style={s.card}>
      <Text style={s.title}>Калькуляторы и помощники для акушера-гинеколога</Text>
      <Text style={s.meta}>{PREGNANCY_CALC_VERSION}</Text>
      <View style={s.assistantGrid}>
        <Pressable style={[s.assistantWidget, { backgroundColor: "#831843" }]} onPress={() => setPage("gyn_assistant_gynecology")}>
          <Text style={s.assistantKicker}>Ежедневный прием</Text>
          <Text style={s.assistantTitle}>Помощник врача-гинеколога</Text>
          <Text style={s.assistantSub}>Нозология → УЗИ → красные флаги → протокол</Text>
        </Pressable>
        <Pressable style={[s.assistantWidget, { backgroundColor: "#0f766e" }]} onPress={() => setPage("gyn_assistant_obstetrics")}>
          <Text style={s.assistantKicker}>Беременность</Text>
          <Text style={s.assistantTitle}>Помощник акушера</Text>
          <Text style={s.assistantSub}>Ранняя беременность, потери, ГСД, маршрутизация</Text>
        </Pressable>
      </View>
      <View style={s.rowWrap}>
        {items.map((it) => (
          <Pressable key={it.id} style={s.tile} onPress={() => setPage(it.id)}>
            <Text style={s.tileTitle}>{it.title}</Text>
            <Text style={s.tileSub}>{it.sub}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
