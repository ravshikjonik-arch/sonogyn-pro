import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  getAssistantCards,
  obgynAssistantMeta,
  type ObgynAssistantMode,
  type ObgynNosologyCard,
} from "./obgynAssistantData";

type Props = {
  mode: ObgynAssistantMode;
  onBack: () => void;
};

function modeTitle(mode: ObgynAssistantMode) {
  return mode === "gynecology" ? "Помощник врача-гинеколога" : "Помощник акушера";
}

function modeSubtitle(mode: ObgynAssistantMode) {
  return mode === "gynecology"
    ? "Нозологии из документа: матка, яичники, цикл, боль, кровотечения, воспаление."
    : "Нозологии из документа: ранняя беременность, потери, ГСД и акушерские риски.";
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item) => (
        <Text key={item} style={styles.bullet}>
          • {item}
        </Text>
      ))}
    </View>
  );
}

function NosologyDetails({ card }: { card: ObgynNosologyCard }) {
  return (
    <View style={styles.details}>
      <View style={styles.pathBanner}>
        <Text style={styles.pathBannerTitle}>Маршрут по документу</Text>
        <Text style={styles.pathBannerSub}>
          Один тап по нозологии — ниже списком: анализы → инструментальная диагностика → УЗИ → лечение → протокол.
        </Text>
      </View>

      <View style={styles.detailsHeader}>
        <View style={styles.codeBadge}>
          <Text style={styles.codeBadgeText}>{card.code}</Text>
        </View>
        <View style={styles.detailsTitleWrap}>
          <Text style={styles.detailsTitle}>{card.title}</Text>
          <Text style={styles.detailsSub}>{card.group}</Text>
        </View>
      </View>
      <View style={[styles.depthPill, card.depth === "expanded" ? styles.depthPillExpanded : styles.depthPillIndex]}>
        <Text style={[styles.depthPillText, card.depth === "expanded" ? styles.depthPillTextExpanded : styles.depthPillTextIndex]}>
          {card.depth === "expanded" ? "Расширенная врачебная карточка" : "Базовая карточка из полного индекса документа"}
        </Text>
      </View>

      <Text style={styles.dailyUse}>{card.dailyUse}</Text>

      <Section title="1. Лабораторные анализы" items={card.laboratoryWorkup} />
      <Section title="2. Инструментальные исследования" items={card.instrumentalInvestigations} />
      <Section title="3. УЗИ — что зафиксировать в протоколе" items={card.ultrasoundFocus} />
      <Section title="4. Лечение и тактика ведения" items={card.treatmentRoute} />

      <Section title="Что быстро спросить на приёме" items={card.visitChecklist} />
      <Section title="Дифференциальная диагностика и контекст" items={card.diagnostics} />
      <Section title="Красные флаги" items={card.redFlags} />
      <Section title="Готовая структура протокола" items={card.protocolTemplate} />
      <Section title="Направления и маршрутизация" items={card.routing} />

      <View style={styles.sourceBox}>
        <Text style={styles.sourceTitle}>Источник и логика</Text>
        <Text style={styles.sourceText}>{card.sourceNote}</Text>
      </View>
    </View>
  );
}

export default function ObgynClinicalAssistant({ mode, onBack }: Props) {
  const cards = useMemo(() => getAssistantCards(mode), [mode]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(cards[0]?.id ?? "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((card) =>
      [card.code, card.title, card.group, ...card.aliases].some((value) => value.toLowerCase().includes(q))
    );
  }, [cards, query]);

  const selected = cards.find((card) => card.id === selectedId) ?? filtered[0] ?? cards[0];

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backBtnText}>{mode === "obstetrics" ? "← К списку разделов" : "← К разделу «Для гинеколога»"}</Text>
      </Pressable>

      <View style={[styles.hero, mode === "obstetrics" && styles.heroObs]}>
        <Text style={styles.kicker}>Клинический помощник</Text>
        <Text style={styles.title}>{modeTitle(mode)}</Text>
        <Text style={styles.subtitle}>{modeSubtitle(mode)}</Text>
      </View>

      <View style={styles.architectureCard}>
        <Text style={styles.architectureTitle}>Архитектура для ежедневного приёма</Text>
        <Text style={styles.architectureText}>{obgynAssistantMeta.architecture}</Text>
        <Text style={styles.architectureText}>
          Сейчас в разделе: {cards.length} нозологий. Выберите строку ниже — карточка маршрута откроется сразу под поиском (не нужно листать вниз).
        </Text>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Поиск: МКБ, СПКЯ, мультифолликулярные яичники, миома..."
        style={styles.search}
      />

      {selected ? <NosologyDetails card={selected} /> : <Text style={styles.empty}>Ничего не найдено.</Text>}

      <Text style={styles.listHeading}>Все нозологии ({filtered.length})</Text>
      <View style={styles.list}>
        {filtered.map((card) => {
          const active = selected?.id === card.id;
          return (
            <Pressable key={card.id} style={[styles.cardRow, active && styles.cardRowActive]} onPress={() => setSelectedId(card.id)}>
              <View style={styles.smallCode}>
                <Text style={styles.smallCodeText}>{card.code}</Text>
              </View>
              <View style={styles.cardRowBody}>
                <Text style={styles.cardRowTitle}>{card.title}</Text>
                <Text style={styles.cardRowSub}>{card.group}</Text>
                <Text style={[styles.cardDepth, card.depth === "expanded" && styles.cardDepthExpanded]}>
                  {card.depth === "expanded" ? "расширенная" : "из индекса"}
                </Text>
              </View>
              <Text style={styles.chev}>›</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  pathBanner: {
    borderRadius: 14,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    padding: 12,
    gap: 4,
  },
  pathBannerTitle: { color: "#065F46", fontSize: 13, fontWeight: "900" },
  pathBannerSub: { color: "#047857", fontSize: 12, lineHeight: 17, fontWeight: "600" },
  listHeading: { color: "#334155", fontSize: 13, fontWeight: "900", marginTop: 4 },
  backBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F5F9",
    borderColor: "#CBD5E1",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
  },
  backBtnText: { color: "#0F172A", fontWeight: "800", fontSize: 13 },
  hero: { borderRadius: 24, backgroundColor: "#831843", padding: 18, gap: 6 },
  heroObs: { backgroundColor: "#0F766E" },
  kicker: { color: "rgba(255,255,255,0.72)", fontSize: 11, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  title: { color: "#fff", fontSize: 25, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { color: "rgba(255,255,255,0.88)", fontSize: 13, lineHeight: 19, fontWeight: "600" },
  architectureCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    padding: 12,
    gap: 4,
  },
  architectureTitle: { color: "#334155", fontSize: 13, fontWeight: "900" },
  architectureText: { color: "#475569", fontSize: 12, lineHeight: 17 },
  search: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#0F172A",
    fontSize: 14,
  },
  list: { gap: 8 },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
    padding: 12,
  },
  cardRowActive: { borderColor: "#C084FC", backgroundColor: "#FAF5FF" },
  smallCode: {
    minWidth: 56,
    borderRadius: 12,
    backgroundColor: "#FDE68A",
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: "center",
  },
  smallCodeText: { color: "#713F12", fontSize: 12, fontWeight: "900" },
  cardRowBody: { flex: 1, minWidth: 0 },
  cardRowTitle: { color: "#0F172A", fontSize: 14, fontWeight: "900" },
  cardRowSub: { color: "#64748B", fontSize: 12, lineHeight: 16, marginTop: 2 },
  cardDepth: { color: "#64748B", fontSize: 10, fontWeight: "900", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.6 },
  cardDepthExpanded: { color: "#831843" },
  chev: { color: "#CBD5E1", fontSize: 24, fontWeight: "300" },
  details: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
    padding: 14,
    gap: 12,
  },
  detailsHeader: { flexDirection: "row", gap: 12, alignItems: "center" },
  codeBadge: {
    borderRadius: 16,
    backgroundColor: "#831843",
    minWidth: 68,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  codeBadgeText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  detailsTitleWrap: { flex: 1, minWidth: 0 },
  detailsTitle: { color: "#0F172A", fontSize: 19, fontWeight: "900", letterSpacing: -0.2 },
  detailsSub: { color: "#64748B", fontSize: 12, fontWeight: "800", marginTop: 3 },
  depthPill: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  depthPillExpanded: { backgroundColor: "#FCE7F3" },
  depthPillIndex: { backgroundColor: "#E0F2FE" },
  depthPillText: { fontSize: 11, fontWeight: "900" },
  depthPillTextExpanded: { color: "#9D174D" },
  depthPillTextIndex: { color: "#0369A1" },
  dailyUse: { color: "#334155", fontSize: 14, lineHeight: 20, fontWeight: "700" },
  section: { gap: 5, borderTopWidth: 1, borderTopColor: "#E2E8F0", paddingTop: 10 },
  sectionTitle: { color: "#831843", fontSize: 14, fontWeight: "900" },
  bullet: { color: "#0F172A", fontSize: 13, lineHeight: 19 },
  sourceBox: { borderRadius: 14, backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#DBEAFE", padding: 10, gap: 4 },
  sourceTitle: { color: "#1D4ED8", fontSize: 12, fontWeight: "900" },
  sourceText: { color: "#334155", fontSize: 12, lineHeight: 17 },
  empty: { color: "#64748B", fontSize: 14, fontWeight: "700", textAlign: "center", padding: 18 },
});
