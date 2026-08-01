import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../navigation/paramLists";
import {
  addEvidenceBookmark,
  askEvidenceAssistant,
  CORPUS_MODE_LABELS,
  CORPUS_MODES,
  formatMobileEvidenceAnswer,
  listEvidenceBookmarks,
  listEvidenceHistory,
  providerLabel,
  removeEvidenceBookmark,
  searchEvidence,
  type MobileAssistantAnswer,
  type MobileEvidenceBookmark,
  type MobileEvidenceCorpusMode,
  type MobileEvidenceHistoryRow,
  type MobileEvidenceRecord,
  type MobileSearchResult,
} from "../lib/evidence/evidenceApi";

type Props = NativeStackScreenProps<RootStackParamList, "EvidenceAssistant">;

type Mode = "assistant" | "search";

const SUGGESTED = [
  "O-RADS 3 тактика наблюдения",
  "Амоксициллин при беременности",
  "Преэклампсия профилактика аспирин",
  "Скрининг I триместра ISUOG",
];

const STRENGTH_COLOR: Record<MobileAssistantAnswer["evidenceStrength"], string> = {
  high: "#059669",
  moderate: "#d97706",
  low: "#ea580c",
  insufficient: "#64748b",
};

function CitationRow({
  record,
  bookmarked,
  onToggleBookmark,
}: {
  record: MobileEvidenceRecord;
  bookmarked?: boolean;
  onToggleBookmark?: (record: MobileEvidenceRecord) => void;
}) {
  return (
    <View style={styles.citation}>
      <View style={styles.citationTop}>
        <Pressable style={styles.citationBody} onPress={() => void Linking.openURL(record.url)}>
          <View style={styles.citationMeta}>
            <Text style={styles.citationProvider}>{providerLabel(record.provider)}</Text>
            {record.year ? <Text style={styles.citationYear}>{record.year}</Text> : null}
          </View>
          <Text style={styles.citationTitle}>{record.title}</Text>
          {record.section ? <Text style={styles.citationSection}>Раздел: {record.section}</Text> : null}
          {record.quote ? (
            <Text style={styles.citationQuote} numberOfLines={4}>
              «{record.quote}»
            </Text>
          ) : record.abstract ? (
            <Text style={styles.citationAbstract} numberOfLines={3}>
              {record.abstract}
            </Text>
          ) : null}
          <Text style={styles.citationLink}>Открыть источник →</Text>
        </Pressable>
        {onToggleBookmark ? (
          <Pressable
            style={styles.starBtn}
            onPress={() => onToggleBookmark(record)}
            hitSlop={8}
            accessibilityLabel={bookmarked ? "Убрать из закладок" : "В закладки"}
          >
            <Text style={[styles.star, bookmarked && styles.starOn]}>{bookmarked ? "★" : "☆"}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function EvidenceAssistantScreen({ navigation }: Props) {
  const [mode, setMode] = useState<Mode>("assistant");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<MobileAssistantAnswer | null>(null);
  const [searchResult, setSearchResult] = useState<MobileSearchResult | null>(null);
  const [bookmarks, setBookmarks] = useState<MobileEvidenceBookmark[]>([]);
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<MobileEvidenceHistoryRow[]>([]);
  const [rateLimitHint, setRateLimitHint] = useState<string | null>(null);
  const [corpusMode, setCorpusMode] = useState<MobileEvidenceCorpusMode>("rf_kr");

  const refreshMeta = useCallback(() => {
    void listEvidenceBookmarks()
      .then((rows) => {
        setBookmarks(rows);
        setBookmarkIds(new Set(rows.map((b) => b.record_id)));
      })
      .catch(() => {});
    void listEvidenceHistory(12)
      .then(({ history: rows, rateLimitHint: hint }) => {
        setHistory(rows);
        setRateLimitHint(hint);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshMeta();
  }, [refreshMeta]);

  const toggleBookmark = useCallback(
    async (record: MobileEvidenceRecord) => {
      const saved = bookmarkIds.has(record.id);
      try {
        if (saved) {
          await removeEvidenceBookmark(record.id);
          setBookmarks((prev) => prev.filter((b) => b.record_id !== record.id));
          setBookmarkIds((prev) => {
            const next = new Set(prev);
            next.delete(record.id);
            return next;
          });
        } else {
          const row = await addEvidenceBookmark(record);
          setBookmarks((prev) => [row, ...prev]);
          setBookmarkIds((prev) => new Set(prev).add(record.id));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Ошибка закладки";
        setError(msg.includes("401") ? "Войдите в аккаунт для закладок." : msg);
      }
    },
    [bookmarkIds],
  );

  const run = useCallback(
    async (q: string, forceMode?: Mode) => {
      const trimmed = q.trim();
      if (trimmed.length < 3) return;
      const activeMode = forceMode ?? mode;
      setLoading(true);
      setError(null);
      setAnswer(null);
      setSearchResult(null);
      try {
        if (activeMode === "assistant") {
          setAnswer(await askEvidenceAssistant(trimmed, { corpusMode }));
          refreshMeta();
        } else {
          setSearchResult(await searchEvidence(trimmed, { corpusMode }));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Ошибка запроса";
        setError(msg.includes("401") ? "Войдите в аккаунт для Evidence Assistant." : msg);
      } finally {
        setLoading(false);
      }
    },
    [mode, corpusMode, refreshMeta],
  );

  const shareAnswer = useCallback(async () => {
    if (!answer) return;
    try {
      await Share.share({ message: formatMobileEvidenceAnswer(answer) });
    } catch {
      /* dismissed */
    }
  }, [answer]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Evidence Assistant</Text>
          <Text style={styles.sub}>КР / НПА со ссылкой на раздел</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.modeRow}>
        <Pressable
          style={[styles.modeBtn, mode === "assistant" && styles.modeBtnOn]}
          onPress={() => setMode("assistant")}
        >
          <Text style={[styles.modeBtnText, mode === "assistant" && styles.modeBtnTextOn]}>AI</Text>
        </Pressable>
        <Pressable
          style={[styles.modeBtn, mode === "search" && styles.modeBtnOn]}
          onPress={() => setMode("search")}
        >
          <Text style={[styles.modeBtnText, mode === "search" && styles.modeBtnTextOn]}>Поиск</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.corpusRow}>
        {CORPUS_MODES.map((m) => (
          <Pressable
            key={m}
            style={[styles.corpusChip, corpusMode === m && styles.corpusChipOn]}
            onPress={() => setCorpusMode(m)}
          >
            <Text style={[styles.corpusChipText, corpusMode === m && styles.corpusChipTextOn]}>
              {CORPUS_MODE_LABELS[m]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Клинический вопрос…"
          placeholderTextColor="#94a3b8"
          returnKeyType="search"
          onSubmitEditing={() => void run(query)}
        />
        <Pressable
          style={[styles.searchBtn, loading && styles.searchBtnDisabled]}
          onPress={() => void run(query)}
          disabled={loading || query.trim().length < 3}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.searchBtnText}>{mode === "assistant" ? "Спросить" : "Искать"}</Text>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.banner}>
          CDS / справочная помощь. Не диагноз; решение — за врачом.
          {rateLimitHint ? ` ${rateLimitHint}.` : ""}
        </Text>

        <View style={styles.chips}>
          {SUGGESTED.map((s) => (
            <Pressable
              key={s}
              style={styles.chip}
              onPress={() => {
                setQuery(s);
                void run(s);
              }}
            >
              <Text style={styles.chipText}>{s}</Text>
            </Pressable>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {answer ? (
          <View style={styles.card}>
            <View style={styles.answerHeader}>
              <Text style={[styles.grade, { color: STRENGTH_COLOR[answer.evidenceStrength] }]}>
                {answer.gradeLabel}
              </Text>
              <Text style={styles.modeTag}>{answer.synthesisMode === "llm" ? "AI + citations" : "rules"}</Text>
              <Pressable style={styles.shareBtn} onPress={() => void shareAnswer()}>
                <Text style={styles.shareBtnText}>Поделиться</Text>
              </Pressable>
            </View>
            {answer.citations.length === 0 ? (
              <Text style={styles.emptyBanner}>{answer.summary}</Text>
            ) : (
              <Text style={styles.summary}>{answer.summary}</Text>
            )}
            {answer.recommendations.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Рекомендации</Text>
                {answer.recommendations.map((r) => (
                  <Text key={r} style={styles.bullet}>
                    • {r}
                  </Text>
                ))}
              </View>
            ) : null}
            <Text style={styles.sectionTitle}>Цитаты ({answer.citations.length})</Text>
            {answer.citations.map((c) => (
              <CitationRow
                key={c.id}
                record={c}
                bookmarked={bookmarkIds.has(c.id)}
                onToggleBookmark={toggleBookmark}
              />
            ))}
            {answer.disclaimers.map((d) => (
              <Text key={d} style={styles.disclaimer}>
                {d}
              </Text>
            ))}
            <Text style={styles.disclaimer}>Не диагноз. Интерпретация — специалист.</Text>
          </View>
        ) : null}

        {history.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>История запросов ({history.length})</Text>
            {history.map((h) => (
              <Pressable
                key={h.id}
                style={styles.historyRow}
                onPress={() => {
                  setQuery(h.query);
                  setMode("assistant");
                  void run(h.query, "assistant");
                }}
              >
                <Text style={styles.citationTitle}>{h.query}</Text>
                <Text style={styles.citationYear}>
                  {new Date(h.created_at).toLocaleString("ru-RU")} · {h.synthesis_mode}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {searchResult ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {searchResult.records.length} результатов (до dedup: {searchResult.totalBeforeDedup})
            </Text>
            {searchResult.records.map((r) => (
              <CitationRow
                key={r.id}
                record={r}
                bookmarked={bookmarkIds.has(r.id)}
                onToggleBookmark={toggleBookmark}
              />
            ))}
          </View>
        ) : null}

        {bookmarks.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Закладки ({bookmarks.length})</Text>
            {bookmarks.map((b) => (
              <Pressable key={b.id} style={styles.bookmarkRow} onPress={() => void Linking.openURL(b.url)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.citationProvider}>{providerLabel(b.provider)}</Text>
                  <Text style={styles.citationTitle}>{b.title}</Text>
                </View>
                <Pressable
                  onPress={() =>
                    void removeEvidenceBookmark(b.record_id).then(() => {
                      setBookmarks((prev) => prev.filter((x) => x.id !== b.id));
                      setBookmarkIds((prev) => {
                        const next = new Set(prev);
                        next.delete(b.record_id);
                        return next;
                      });
                    })
                  }
                  hitSlop={8}
                >
                  <Text style={styles.starOn}>★</Text>
                </Pressable>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F9FB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 22, fontWeight: "700", color: "#0f172a" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerSpacer: { width: 40 },
  title: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  sub: { fontSize: 11, color: "#64748b", marginTop: 2 },
  modeRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  modeBtnOn: { backgroundColor: "#0f2744", borderColor: "#0f2744" },
  modeBtnText: { fontWeight: "700", color: "#64748b", fontSize: 13 },
  modeBtnTextOn: { color: "#fff" },
  corpusRow: { paddingHorizontal: 16, gap: 8, marginBottom: 10 },
  corpusChip: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#fff",
  },
  corpusChipOn: { backgroundColor: "#0f2744", borderColor: "#0f2744" },
  corpusChipText: { fontSize: 12, fontWeight: "700", color: "#64748b" },
  corpusChipTextOn: { color: "#fff" },
  searchRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0f172a",
  },
  searchBtn: {
    backgroundColor: "#0f2744",
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: "center",
    minWidth: 88,
    alignItems: "center",
  },
  searchBtnDisabled: { opacity: 0.6 },
  searchBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  scroll: { padding: 16, paddingBottom: 32, gap: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  chipText: { fontSize: 12, color: "#334155" },
  banner: {
    fontSize: 12,
    lineHeight: 18,
    color: "#92400e",
    backgroundColor: "#fffbeb",
    borderColor: "#fcd34d",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  historyRow: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
    gap: 2,
  },
  error: { color: "#dc2626", fontSize: 14 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 10,
  },
  answerHeader: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  grade: { fontSize: 13, fontWeight: "800" },
  modeTag: { fontSize: 11, color: "#64748b" },
  shareBtn: {
    marginLeft: "auto",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  shareBtnText: { fontSize: 12, fontWeight: "700", color: "#0f2744" },
  summary: { fontSize: 14, lineHeight: 21, color: "#0f172a" },
  emptyBanner: {
    fontSize: 14,
    lineHeight: 21,
    color: "#334155",
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    padding: 10,
  },
  section: { gap: 4 },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: "#64748b", textTransform: "uppercase" },
  bullet: { fontSize: 14, color: "#334155", lineHeight: 20 },
  citation: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
  },
  citationTop: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  citationBody: { flex: 1, gap: 4 },
  starBtn: { paddingTop: 2, paddingHorizontal: 4 },
  star: { fontSize: 20, color: "#cbd5e1" },
  starOn: { fontSize: 20, color: "#f59e0b" },
  bookmarkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
  },
  citationMeta: { flexDirection: "row", gap: 8, alignItems: "center" },
  citationProvider: { fontSize: 11, fontWeight: "700", color: "#0f2744" },
  citationYear: { fontSize: 11, color: "#94a3b8" },
  citationTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  citationSection: { fontSize: 12, fontWeight: "700", color: "#0f2744" },
  citationQuote: { fontSize: 12, color: "#64748b", lineHeight: 18, fontStyle: "italic" },
  citationAbstract: { fontSize: 12, color: "#64748b", lineHeight: 18 },
  citationLink: { fontSize: 12, color: "#2563eb", fontWeight: "600" },
  disclaimer: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
});
