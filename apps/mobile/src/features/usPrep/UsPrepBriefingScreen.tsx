import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";

import { getWebApiBase } from "../../api/chatBackend";
import { MobileDictationBar } from "../speech/MobileDictationBar";
import { openWebPath } from "../../lib/clinical-tools/openClinicalTool";
import { supabaseMobile } from "../../lib/supabase/mobileClient";
import type { RootStackParamList } from "../../navigation/paramLists";

type Props = NativeStackScreenProps<RootStackParamList, "UsPrepBriefing">;

type DoctorVisitRole = "obgyn" | "us" | "obgyn_us";
type UsPrepDomain = "gynecology" | "obstetrics" | "both";

type BriefingResult = {
  roleLabelRu: string;
  titleRu: string;
  complaintSummaryRu: string;
  primaryChecklistRu: string[];
  clinicalChecklistRu: string[];
  ultrasoundQuestionsRu: string[];
  attentionPointsRu: string[];
  labsAndSmearsRu: string[];
  treatmentContextRu: string[];
  redFlagsRu: string[];
  suggestedModules: { href: string; label: string }[];
  disclaimerRu: string;
};

const ROLE_OPTIONS: { value: DoctorVisitRole; label: string }[] = [
  { value: "obgyn", label: "АГ" },
  { value: "us", label: "УЗИ" },
  { value: "obgyn_us", label: "АГ+УЗИ" },
];

const DOMAIN_OPTIONS: { value: UsPrepDomain; label: string }[] = [
  { value: "both", label: "Оба" },
  { value: "gynecology", label: "Гин." },
  { value: "obstetrics", label: "Акуш." },
];

const MIN_CHARS = 8;
const DEBOUNCE_MS = 1200;

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-sonogyn-client": "mobile",
  };
  if (!supabaseMobile) return headers;
  const { data } = await supabaseMobile.auth.getSession();
  const token = data.session?.access_token;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function ChecklistBlock({
  title,
  items,
  danger,
}: {
  title: string;
  items: string[];
  danger?: boolean;
}) {
  if (!items.length) return null;
  return (
    <View style={[styles.block, danger && styles.blockDanger]}>
      <Text style={[styles.blockTitle, danger && styles.blockTitleDanger]}>{title}</Text>
      {items.map((item, i) => (
        <Text key={`${i}-${item.slice(0, 24)}`} style={styles.blockItem}>
          {i + 1}. {item}
        </Text>
      ))}
    </View>
  );
}

export default function UsPrepBriefingScreen({ navigation }: Props) {
  const [role, setRole] = useState<DoctorVisitRole>("obgyn_us");
  const [domain, setDomain] = useState<UsPrepDomain>("both");
  const [complaints, setComplaints] = useState("");
  const [visitContext, setVisitContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BriefingResult | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const lastKeyRef = useRef("");

  const refresh = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (trimmed.length < MIN_CHARS) return;
      const key = `${role}|${domain}|${visitContext}|${trimmed}`;
      if (key === lastKeyRef.current) return;
      lastKeyRef.current = key;

      const base = getWebApiBase();
      if (!base) {
        setError("Не настроен EXPO_PUBLIC_API_BASE_URL.");
        return;
      }

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${base}/api/ai/us-prep-briefing`, {
          method: "POST",
          headers: await authHeaders(),
          signal: ac.signal,
          body: JSON.stringify({
            complaints: trimmed,
            domain,
            role,
            visitContext: visitContext.trim() || undefined,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          result?: BriefingResult;
          error?: string;
          message?: string;
        };
        if (res.status === 401) {
          setError("Войдите в аккаунт, чтобы получить чек-лист.");
          return;
        }
        if (!res.ok || !data.result) {
          setError(data.error ?? data.message ?? "Не удалось обновить чек-лист.");
          return;
        }
        setResult(data.result);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setError("Сеть недоступна — чек-лист не обновился.");
      } finally {
        setLoading(false);
      }
    },
    [domain, role, visitContext],
  );

  useEffect(() => {
    if (complaints.trim().length < MIN_CHARS) return;
    const t = setTimeout(() => {
      void refresh(complaints);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [complaints, refresh]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function copyBrief() {
    if (!result) return;
    const text = [
      "=== ТОЛЬКО ДЛЯ ВРАЧА ===",
      `Роль: ${result.roleLabelRu}`,
      result.titleRu,
      "",
      complaints || result.complaintSummaryRu,
      "",
      "СЕЙЧАС:",
      ...result.primaryChecklistRu.map((q, i) => `${i + 1}. ${q}`),
      result.redFlagsRu.length
        ? `\nКрасные флаги:\n${result.redFlagsRu.map((q) => `⚠ ${q}`).join("\n")}`
        : "",
      "",
      result.disclaimerRu,
    ]
      .filter(Boolean)
      .join("\n");
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button">
          <Text style={styles.back}>← Назад</Text>
        </Pressable>
        <Text style={styles.kicker}>Только врач · не для пациентки</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Жалобы → чек-лист</Text>
        <Text style={styles.sub}>
          Диктуйте или введите жалобы — короткий чек-лист под роль АГ / УЗИ. Не диагноз.
        </Text>

        <Text style={styles.label}>Роль на приёме</Text>
        <View style={styles.row}>
          {ROLE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.chip, role === opt.value && styles.chipOn]}
              onPress={() => {
                setRole(opt.value);
                lastKeyRef.current = "";
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: role === opt.value }}
            >
              <Text style={[styles.chipText, role === opt.value && styles.chipTextOn]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Профиль</Text>
        <View style={styles.row}>
          {DOMAIN_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.chip, domain === opt.value && styles.chipOn]}
              onPress={() => {
                setDomain(opt.value);
                lastKeyRef.current = "";
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: domain === opt.value }}
            >
              <Text style={[styles.chipText, domain === opt.value && styles.chipTextOn]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Жалобы</Text>
        <MobileDictationBar value={complaints} onChange={setComplaints} style={styles.dictation} />
        <TextInput
          style={styles.input}
          multiline
          value={complaints}
          onChangeText={setComplaints}
          placeholder="Что говорит пациентка…"
          placeholderTextColor="#94a3b8"
          textAlignVertical="top"
          accessibilityLabel="Жалобы пациентки"
        />

        <TextInput
          style={[styles.input, styles.inputShort]}
          value={visitContext}
          onChangeText={(v) => {
            setVisitContext(v);
            lastKeyRef.current = "";
          }}
          placeholder="Контекст визита (опционально)"
          placeholderTextColor="#94a3b8"
          accessibilityLabel="Контекст визита"
        />

        <Pressable
          style={styles.primaryBtn}
          onPress={() => {
            lastKeyRef.current = "";
            void refresh(complaints);
          }}
          disabled={complaints.trim().length < MIN_CHARS || loading}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Обновить чек-лист</Text>
          )}
        </Pressable>

        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        {result ? (
          <View style={styles.result}>
            <Text style={styles.resultRole}>{result.roleLabelRu}</Text>
            <Text style={styles.resultTitle}>{result.titleRu}</Text>
            <Text style={styles.resultSummary}>{result.complaintSummaryRu}</Text>

            <Pressable style={styles.copyBtn} onPress={() => void copyBrief()} accessibilityRole="button">
              <Text style={styles.copyBtnText}>{copied ? "Скопировано" : "Копировать брифинг"}</Text>
            </Pressable>

            <ChecklistBlock title="Сейчас (главный чеклист)" items={result.primaryChecklistRu} />
            <ChecklistBlock title="Клиника · АГ" items={result.clinicalChecklistRu} />
            <ChecklistBlock title="УЗИ — ответить в протоколе" items={result.ultrasoundQuestionsRu} />
            <ChecklistBlock title="На что обратить внимание" items={result.attentionPointsRu} />
            <ChecklistBlock title="Анализы / мазки" items={result.labsAndSmearsRu} />
            <ChecklistBlock title="Маршрутизация" items={result.treatmentContextRu} />
            <ChecklistBlock title="Красные флаги" items={result.redFlagsRu} danger />

            {result.suggestedModules.length > 0 ? (
              <View style={styles.modules}>
                {result.suggestedModules.map((m) => (
                  <Pressable
                    key={m.href}
                    style={styles.moduleChip}
                    onPress={() => void openWebPath(m.href)}
                    accessibilityRole="link"
                  >
                    <Text style={styles.moduleChipText}>{m.label}</Text>
                  </Pressable>
                ))}
                <Pressable
                  style={styles.moduleChip}
                  onPress={() => void openWebPath("/tools/refs/ambulatory-intake")}
                  accessibilityRole="link"
                >
                  <Text style={styles.moduleChipText}>Чек-лист амбулатории</Text>
                </Pressable>
              </View>
            ) : null}

            <Text style={styles.disclaimer}>{result.disclaimerRu}</Text>
          </View>
        ) : (
          <Text style={styles.hint}>Введите или надиктуйте жалобы — появится чек-лист.</Text>
        )}

        <Pressable
          onPress={() => void Linking.openURL("https://sonogyn-pro.ru/ai/consultants/us-prep")}
          accessibilityRole="link"
        >
          <Text style={styles.webLink}>Открыть полную web-версию Live-приёма</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f172a" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  back: { color: "#38bdf8", fontSize: 16, fontWeight: "600" },
  kicker: { color: "#fbbf24", fontSize: 11, fontWeight: "700" },
  scroll: { padding: 16, paddingBottom: 40, gap: 10 },
  title: { color: "#f8fafc", fontSize: 24, fontWeight: "800" },
  sub: { color: "#94a3b8", fontSize: 14, lineHeight: 20, marginBottom: 4 },
  label: { color: "#cbd5e1", fontSize: 12, fontWeight: "700", marginTop: 6 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#1e293b",
  },
  chipOn: { borderColor: "#34d399", backgroundColor: "rgba(52,211,153,0.15)" },
  chipText: { color: "#94a3b8", fontWeight: "600" },
  chipTextOn: { color: "#6ee7b7" },
  dictation: { marginTop: 4 },
  input: {
    minHeight: 96,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#1e293b",
    color: "#f8fafc",
    padding: 12,
    fontSize: 15,
  },
  inputShort: { minHeight: 48 },
  primaryBtn: {
    marginTop: 4,
    borderRadius: 14,
    backgroundColor: "#059669",
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  error: { color: "#fb7185", fontSize: 14 },
  hint: { color: "#64748b", textAlign: "center", marginTop: 12 },
  result: { marginTop: 8, gap: 10 },
  resultRole: { color: "#fbbf24", fontSize: 12, fontWeight: "700" },
  resultTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "700" },
  resultSummary: { color: "#94a3b8", fontSize: 13, lineHeight: 18 },
  copyBtn: {
    alignSelf: "flex-start",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#475569",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  copyBtnText: { color: "#e2e8f0", fontWeight: "600" },
  block: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#1e293b",
    padding: 12,
    gap: 6,
  },
  blockDanger: { borderColor: "#fb7185", backgroundColor: "rgba(251,113,133,0.12)" },
  blockTitle: { color: "#e2e8f0", fontWeight: "700", fontSize: 14, marginBottom: 2 },
  blockTitleDanger: { color: "#fda4af" },
  blockItem: { color: "#cbd5e1", fontSize: 14, lineHeight: 20 },
  modules: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  moduleChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#38bdf8",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  moduleChipText: { color: "#7dd3fc", fontWeight: "600", fontSize: 13 },
  disclaimer: { color: "#64748b", fontSize: 12, lineHeight: 18 },
  webLink: { color: "#38bdf8", textAlign: "center", marginTop: 16, fontSize: 13 },
});
