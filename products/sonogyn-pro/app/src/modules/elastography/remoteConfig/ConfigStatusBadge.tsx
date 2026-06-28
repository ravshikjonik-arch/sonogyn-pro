/**
 * Бейдж статуса удалённого справочника эластографии.
 * Показывает версию, оффлайн-режим и доступность обновлений.
 */

import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { UpdateStatus } from "./types";
import { useRemoteConfig } from "./useRemoteConfig";

type BadgeStatus = "current" | "update" | "offline";

function formatDate(iso: string): string {
  if (iso === "—") return iso;
  try {
    return new Date(iso).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

type Props = {
  /** Компактный режим (только точка + короткий текст) */
  compact?: boolean;
};

/**
 * Бейдж + BottomSheet с деталями справочника.
 */
export default function ConfigStatusBadge({ compact = false }: Props) {
  const {
    isLoading,
    error,
    isUsingFallback,
    configVersion,
    configDate,
    configSource,
    checkForUpdates,
    refreshConfig,
    resetToDefault,
  } = useRemoteConfig();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const badgeStatus: BadgeStatus = isUsingFallback
    ? "offline"
    : updateStatus?.hasUpdate
      ? "update"
      : "current";

  const statusMeta = {
    current: { dot: "#43A047", label: "Справочник актуален" },
    update: { dot: "#FB8C00", label: "Доступно обновление" },
    offline: { dot: "#E53935", label: "Оффлайн-режим" },
  }[badgeStatus];

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const status = await checkForUpdates();
      if (!cancelled) setUpdateStatus(status);
    })();
    return () => {
      cancelled = true;
    };
  }, [checkForUpdates, configVersion]);

  const onOpen = useCallback(() => setSheetOpen(true), []);
  const onClose = useCallback(() => setSheetOpen(false), []);

  const onCheckUpdates = useCallback(async () => {
    setChecking(true);
    try {
      const status = await checkForUpdates();
      setUpdateStatus(status);
    } finally {
      setChecking(false);
    }
  }, [checkForUpdates]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshConfig();
      const status = await checkForUpdates();
      setUpdateStatus(status);
    } finally {
      setRefreshing(false);
    }
  }, [refreshConfig, checkForUpdates]);

  const onReset = useCallback(async () => {
    setRefreshing(true);
    try {
      await resetToDefault();
      const status = await checkForUpdates();
      setUpdateStatus(status);
    } finally {
      setRefreshing(false);
    }
  }, [resetToDefault, checkForUpdates]);

  return (
    <>
      <Pressable
        onPress={onOpen}
        style={[styles.badge, compact && styles.badgeCompact]}
        accessibilityRole="button"
        accessibilityLabel={`Справочник эластографии, версия ${configVersion}`}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#6D28D9" />
        ) : (
          <View style={[styles.dot, { backgroundColor: statusMeta.dot }]} />
        )}
        <Text style={styles.badgeText}>
          {compact ? `v${configVersion}` : statusMeta.label}
          {!compact ? ` · v${configVersion}` : null}
        </Text>
        <Ionicons name="information-circle-outline" size={16} color="#64748b" />
      </Pressable>

      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={onClose}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Справочник эластографии</Text>

            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
              <Row label="Текущая версия" value={`v${configVersion}`} />
              <Row label="Дата обновления" value={formatDate(configDate)} />
              <Row label="Источники" value={configSource} />
              <Row
                label="Статус"
                value={statusMeta.label}
                valueColor={statusMeta.dot}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {updateStatus?.latestVersion && updateStatus.hasUpdate ? (
                <Text style={styles.updateHint}>
                  На сервере доступна v{updateStatus.latestVersion}
                </Text>
              ) : null}

              <Text style={styles.sectionTitle}>История изменений</Text>
              {(updateStatus?.changelog ?? []).map((entry) => (
                <View key={entry.version + entry.date} style={styles.changelogRow}>
                  <Text style={styles.changelogVer}>v{entry.version}</Text>
                  <Text style={styles.changelogDate}>{entry.date}</Text>
                  <Text style={styles.changelogText}>{entry.changes}</Text>
                </View>
              ))}

              <Text style={styles.disclaimer}>
                Справочные cut-off не являются диагнозом. Интерпретация — за специалистом.
              </Text>
            </ScrollView>

            <View style={styles.actions}>
              <ActionBtn
                label={checking ? "Проверка…" : "Проверить обновления"}
                onPress={onCheckUpdates}
                disabled={checking || refreshing}
                variant="secondary"
              />
              <ActionBtn
                label={refreshing ? "Обновление…" : "Обновить сейчас"}
                onPress={onRefresh}
                disabled={checking || refreshing}
                variant="primary"
              />
              <ActionBtn
                label="Восстановить стандартные значения"
                onPress={onReset}
                disabled={checking || refreshing}
                variant="ghost"
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

function ActionBtn({
  label,
  onPress,
  disabled,
  variant,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant: "primary" | "secondary" | "ghost";
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        variant === "primary" && styles.btnPrimary,
        variant === "secondary" && styles.btnSecondary,
        variant === "ghost" && styles.btnGhost,
        disabled && styles.btnDisabled,
      ]}
    >
      <Text
        style={[
          styles.btnText,
          variant === "primary" && styles.btnTextPrimary,
          variant === "ghost" && styles.btnTextGhost,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  badgeCompact: { paddingVertical: 4, paddingHorizontal: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontSize: 11, color: "#475569", fontWeight: "600" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: "85%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: "#0F2744", marginBottom: 12 },
  sheetScroll: { maxHeight: 340 },
  row: { marginBottom: 10 },
  rowLabel: { fontSize: 11, color: "#64748b", fontWeight: "600", textTransform: "uppercase" },
  rowValue: { fontSize: 14, color: "#0F2744", marginTop: 2, lineHeight: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    marginTop: 12,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  changelogRow: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
  },
  changelogVer: { fontSize: 13, fontWeight: "700", color: "#6D28D9" },
  changelogDate: { fontSize: 11, color: "#94A3B8", marginTop: 2 },
  changelogText: { fontSize: 12, color: "#334155", marginTop: 4, lineHeight: 17 },
  disclaimer: { fontSize: 10, color: "#94A3B8", marginTop: 12, lineHeight: 14, fontStyle: "italic" },
  errorText: { fontSize: 12, color: "#E53935", marginVertical: 6 },
  updateHint: { fontSize: 12, color: "#FB8C00", marginBottom: 8 },
  actions: { gap: 8, marginTop: 16 },
  btn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  btnPrimary: { backgroundColor: "#6D28D9" },
  btnSecondary: { backgroundColor: "#EDE9FE" },
  btnGhost: { backgroundColor: "transparent" },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 14, fontWeight: "700", color: "#6D28D9" },
  btnTextPrimary: { color: "#fff" },
  btnTextGhost: { color: "#64748b", fontWeight: "600" },
});
