import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { ReportLocale, StructuredReportDocument } from "@repo/types";

import type { RootStackParamList } from "../../navigation/paramLists";
import {
  blocksToPlainText,
  buildStructuredReportFromObstetric,
  buildStructuredReportFromOradsWizard,
  buildStructuredReportFromThyroid,
  displayBlocks,
  domainMeta,
  editedBlocksPayload,
  templateSlugForDomain,
  type SreDomain,
} from "../../reporting/buildStructuredReport";
import { exportReportPdf } from "../../reporting/exportReportPdf";
import { SRE_DRAFT_STORAGE_KEY, type SreDraftCache } from "../../reporting/sreDraftStorage";
import { createStructuredReport, patchStructuredReport } from "../../reporting/sreReportsApi";

type Props = NativeStackScreenProps<RootStackParamList, "StructuredReportPreview">;
type Busy = "pdf" | "cache" | "cloud" | "finalize" | null;

function resolveDomain(params: RootStackParamList["StructuredReportPreview"]): SreDomain {
  if (params.domain) return params.domain;
  if (params.thyroidInput) return "thyroid";
  if (params.obstetricInput) return "obstetric";
  return "adnex";
}

function buildLocalDocument(
  params: RootStackParamList["StructuredReportPreview"],
  domain: SreDomain,
  locale: ReportLocale,
): StructuredReportDocument | null {
  if (domain === "thyroid") {
    const input = params.thyroidInput ?? { domain: "thyroid" as const, measurements: {}, morphology: {} };
    return buildStructuredReportFromThyroid(input, locale);
  }
  if (domain === "obstetric") {
    const input = params.obstetricInput ?? { domain: "obstetric" as const, biometry: {} };
    return buildStructuredReportFromObstetric(input, locale);
  }
  if (!params.path || !params.result) return null;
  return buildStructuredReportFromOradsWizard(params.path, params.result, params.pathSummary ?? [], locale);
}

export default function StructuredReportPreviewScreen({ navigation, route }: Props) {
  const params = route.params;
  const domain = useMemo(() => resolveDomain(params), [params]);
  const meta = useMemo(() => domainMeta(domain), [domain]);
  const templateSlug = templateSlugForDomain(domain);

  const [locale, setLocale] = useState<ReportLocale>("ru");
  const initialDoc = useMemo(() => buildLocalDocument(params, domain, "ru"), [params, domain]);
  const [document, setDocument] = useState<StructuredReportDocument | null>(initialDoc);
  const [blocks, setBlocks] = useState(() =>
    initialDoc
      ? displayBlocks(initialDoc)
      : { description: "", impression: "", recommendations: "" },
  );
  const [persistedId, setPersistedId] = useState<string | null>(null);
  const [status, setStatus] = useState<StructuredReportDocument["status"]>("draft");
  const [busy, setBusy] = useState<Busy>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const regenerateLocal = useCallback(
    (nextLocale: ReportLocale) => {
      const next = buildLocalDocument(params, domain, nextLocale);
      if (!next) return;
      setDocument(next);
      setBlocks(displayBlocks(next));
      setStatus(next.status);
      setPersistedId(null);
      setStatusMessage(null);
    },
    [params, domain],
  );

  useEffect(() => {
    void AsyncStorage.getItem(SRE_DRAFT_STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const cached = JSON.parse(raw) as SreDraftCache;
        if (cached.templateSlug !== templateSlug) return;
        if (cached.domain && cached.domain !== domain) return;
        setBlocks({
          description: cached.description,
          impression: cached.impression,
          recommendations: cached.recommendations,
        });
        if (cached.persistedId) setPersistedId(cached.persistedId);
        if (cached.locale) setLocale(cached.locale);
      } catch {
        /* ignore corrupt cache */
      }
    });
  }, [domain, templateSlug]);

  const readOnly = status === "finalized";

  async function copyAll() {
    await Clipboard.setStringAsync(blocksToPlainText(blocks));
    setStatusMessage("Скопировано в буфер");
  }

  async function sharePdf() {
    setBusy("pdf");
    try {
      await exportReportPdf({
        title: meta.pdfTitle,
        bodyText: blocksToPlainText(blocks),
      });
    } catch (err) {
      Alert.alert("PDF", err instanceof Error ? err.message : "Не удалось экспортировать");
    } finally {
      setBusy(null);
    }
  }

  async function cacheDraft() {
    setBusy("cache");
    try {
      const payload: SreDraftCache = {
        description: blocks.description,
        impression: blocks.impression,
        recommendations: blocks.recommendations,
        templateSlug,
        domain,
        persistedId: persistedId ?? undefined,
        locale,
        savedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(SRE_DRAFT_STORAGE_KEY, JSON.stringify(payload));
      setStatusMessage("Черновик сохранён offline");
    } finally {
      setBusy(null);
    }
  }

  async function saveCloudDraft() {
    if (!document) {
      Alert.alert("Нет данных для сохранения");
      return;
    }
    setBusy("cloud");
    setStatusMessage(null);
    try {
      const input = document.input;
      const created = await createStructuredReport({
        templateSlug,
        locale,
        input,
      });
      const id = created.persistedId ?? created.document.id;
      if (!id) throw new Error("Сервер не вернул id протокола");

      let nextDoc = created.document;
      const edited = editedBlocksPayload(created.document, blocks);
      if (Object.values(edited).some(Boolean)) {
        nextDoc = await patchStructuredReport(id, {
          editedBlocks: edited,
          status: "edited",
        });
      }

      setDocument(nextDoc);
      setBlocks(displayBlocks(nextDoc));
      setPersistedId(id);
      setStatus(nextDoc.status);
      setStatusMessage("Черновик сохранён в облако");

      const payload: SreDraftCache = {
        description: blocks.description,
        impression: blocks.impression,
        recommendations: blocks.recommendations,
        templateSlug,
        domain,
        persistedId: id,
        locale,
        savedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(SRE_DRAFT_STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      Alert.alert("Облако", err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setBusy(null);
    }
  }

  async function saveEditsOrFinalize(nextStatus: "edited" | "finalized") {
    if (!document || !persistedId) {
      Alert.alert("Сначала сохраните черновик в облако");
      return;
    }
    setBusy(nextStatus === "finalized" ? "finalize" : "cloud");
    setStatusMessage(null);
    try {
      const edited = editedBlocksPayload(document, blocks);
      const nextDoc = await patchStructuredReport(persistedId, {
        editedBlocks: edited,
        status: nextStatus,
      });
      setDocument(nextDoc);
      setBlocks(displayBlocks(nextDoc));
      setStatus(nextDoc.status);
      setStatusMessage(nextStatus === "finalized" ? "Протокол финализирован" : "Правки сохранены");
    } catch (err) {
      Alert.alert("Облако", err instanceof Error ? err.message : "Ошибка обновления");
    } finally {
      setBusy(null);
    }
  }

  const badgeLabel =
    domain === "adnex" && params.result?.category
      ? params.result.category
      : meta.badge;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>‹ Назад</Text>
        </Pressable>
        <Text style={styles.title}>Структурированный протокол</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {!document ? (
          <Text style={styles.subtitle}>
            Нет данных O-RADS. Откройте мастер O-RADS и нажмите «Структурированный протокол».
          </Text>
        ) : null}
        <Text style={styles.badge}>{badgeLabel}</Text>
        <Text style={styles.subtitle}>{meta.subtitle}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Язык</Text>
          {(["ru", "en"] as const).map((code) => (
            <Pressable
              key={code}
              style={[styles.chip, locale === code && styles.chipOn]}
              disabled={busy !== null || readOnly}
              onPress={() => {
                setLocale(code);
                regenerateLocal(code);
              }}
            >
              <Text style={[styles.chipText, locale === code && styles.chipTextOn]}>{code.toUpperCase()}</Text>
            </Pressable>
          ))}
          {status !== "draft" ? (
            <Text style={styles.statusPill}>
              {status === "finalized" ? "Финализирован" : "Отредактирован"}
            </Text>
          ) : null}
        </View>

        {persistedId ? (
          <Text style={styles.idLine} numberOfLines={1}>
            Cloud id: {persistedId}
          </Text>
        ) : null}

        <BlockEditor
          label="Описание"
          value={blocks.description}
          editable={!readOnly}
          onChange={(description) => setBlocks((b) => ({ ...b, description }))}
        />
        <BlockEditor
          label="Заключение"
          value={blocks.impression}
          editable={!readOnly}
          onChange={(impression) => setBlocks((b) => ({ ...b, impression }))}
        />
        <BlockEditor
          label="Рекомендации"
          value={blocks.recommendations}
          editable={!readOnly}
          onChange={(recommendations) => setBlocks((b) => ({ ...b, recommendations }))}
        />

        {document && document.output.citations.length > 0 ? (
          <View style={styles.citeBox}>
            <Text style={styles.citeTitle}>Стандарты</Text>
            {document.output.citations.map((c) => (
              <Text key={c.id} style={styles.citeLine}>
                • {c.label}
              </Text>
            ))}
          </View>
        ) : null}

        {statusMessage ? <Text style={styles.hintOk}>{statusMessage}</Text> : null}

        <View style={styles.actions}>
          <Pressable style={styles.secondaryBtn} onPress={() => void copyAll()} disabled={busy !== null}>
            <Text style={styles.secondaryText}>Копировать</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={() => void cacheDraft()} disabled={busy !== null}>
            {busy === "cache" ? (
              <ActivityIndicator color="#334155" />
            ) : (
              <Text style={styles.secondaryText}>Кэш offline</Text>
            )}
          </Pressable>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => void saveCloudDraft()}
            disabled={busy !== null || readOnly || !document}
          >
            {busy === "cloud" && !persistedId ? (
              <ActivityIndicator color="#334155" />
            ) : (
              <Text style={styles.secondaryText}>В облако</Text>
            )}
          </Pressable>
          {persistedId ? (
            <>
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => void saveEditsOrFinalize("edited")}
                disabled={busy !== null || readOnly}
              >
                <Text style={styles.secondaryText}>Правки</Text>
              </Pressable>
              <Pressable
                style={styles.primaryBtn}
                onPress={() => void saveEditsOrFinalize("finalized")}
                disabled={busy !== null || readOnly}
              >
                {busy === "finalize" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>Финализировать</Text>
                )}
              </Pressable>
            </>
          ) : null}
          <Pressable style={styles.primaryBtn} onPress={() => void sharePdf()} disabled={busy !== null}>
            {busy === "pdf" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>PDF / Поделиться</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BlockEditor({
  label,
  value,
  onChange,
  editable = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  editable?: boolean;
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockLabel}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputReadonly]}
        multiline
        editable={editable}
        textAlignVertical="top"
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  back: { color: "#2563EB", fontWeight: "700", fontSize: 16 },
  title: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  headerSpacer: { width: 56 },
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    color: "#1D4ED8",
    fontWeight: "900",
    fontSize: 22,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    overflow: "hidden",
  },
  subtitle: { color: "#64748b", fontSize: 12, lineHeight: 17, marginBottom: 4 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  metaLabel: { fontSize: 12, fontWeight: "700", color: "#64748b" },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#fff",
  },
  chipOn: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  chipText: { fontSize: 12, fontWeight: "700", color: "#334155" },
  chipTextOn: { color: "#1D4ED8" },
  statusPill: {
    marginLeft: "auto",
    fontSize: 11,
    fontWeight: "800",
    color: "#0f766e",
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  idLine: { fontSize: 10, color: "#94a3b8" },
  block: { gap: 6 },
  blockLabel: { fontWeight: "800", color: "#0f172a", fontSize: 14 },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 12,
    fontSize: 13,
    lineHeight: 18,
    color: "#334155",
  },
  inputReadonly: { backgroundColor: "#F1F5F9", color: "#64748b" },
  citeBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
    padding: 12,
    gap: 4,
  },
  citeTitle: { fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  citeLine: { color: "#475569", fontSize: 12, lineHeight: 17 },
  hintOk: { color: "#0f766e", fontSize: 12, fontWeight: "600" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  secondaryBtn: {
    flexGrow: 1,
    minWidth: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#fff",
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: { color: "#334155", fontWeight: "700" },
  primaryBtn: {
    flexGrow: 1,
    minWidth: 140,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "800" },
});
