import { isMessageNotificationsEnabled, parseClinicalPreferences } from "@repo/types";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import {
  registerPushTokenWithSupabase,
  unregisterPushTokensForUser,
} from "../../lib/push/registerPushToken";
import { supabaseMobile } from "../../lib/supabase/mobileClient";

/** Профиль → push о сообщениях чата / ответах в обсуждениях. */
export function MessageNotificationsSettings() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!supabaseMobile) {
        setLoading(false);
        return;
      }
      const { data: sessionData } = await supabaseMobile.auth.getSession();
      const uid = sessionData.session?.user?.id ?? null;
      if (!uid) {
        if (!cancelled) setLoading(false);
        return;
      }
      const { data: profile } = await supabaseMobile
        .from("profiles")
        .select("clinical_preferences")
        .eq("id", uid)
        .maybeSingle();
      if (cancelled) return;
      setUserId(uid);
      setEnabled(isMessageNotificationsEnabled(parseClinicalPreferences(profile?.clinical_preferences)));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onToggle = useCallback(
    async (next: boolean) => {
      if (!supabaseMobile || !userId || syncing) return;
      setSyncing(true);
      const prev = enabled;
      setEnabled(next);
      try {
        const { data: current } = await supabaseMobile
          .from("profiles")
          .select("clinical_preferences")
          .eq("id", userId)
          .maybeSingle();
        const merged = {
          ...parseClinicalPreferences(current?.clinical_preferences),
          notifications: { messagesEnabled: next },
        };
        const { error } = await supabaseMobile
          .from("profiles")
          .update({ clinical_preferences: merged })
          .eq("id", userId);
        if (error) throw new Error(error.message);

        if (next) {
          const ok = await registerPushTokenWithSupabase(userId);
          if (!ok) {
            Alert.alert(
              "Разрешение ОС",
              "Включите уведомления для SonoGyn Pro в настройках телефона, чтобы получать push.",
            );
          }
        } else {
          await unregisterPushTokensForUser(userId);
        }
      } catch (e) {
        setEnabled(prev);
        Alert.alert("Ошибка", e instanceof Error ? e.message : "Не удалось сохранить настройку.");
      } finally {
        setSyncing(false);
      }
    },
    [enabled, syncing, userId],
  );

  if (!supabaseMobile || (!loading && !userId)) return null;

  return (
    <View style={styles.box}>
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text style={styles.title}>Уведомления о сообщениях</Text>
          <Text style={styles.hint}>
            Push: ответы в обсуждениях и сообщения в чатах. Можно выключить в любой момент.
          </Text>
        </View>
        {loading ? (
          <ActivityIndicator color="#005CB9" />
        ) : (
          <Switch
            value={enabled}
            disabled={syncing}
            onValueChange={(v) => void onToggle(v)}
            trackColor={{ false: "#cbd5e1", true: "#93c5fd" }}
            thumbColor={enabled ? "#005CB9" : "#f8fafc"}
          />
        )}
      </View>
      <Text style={styles.status}>
        Сейчас: {enabled ? "включены" : "выключены"}
        {syncing ? " · сохранение…" : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dbeafe",
    backgroundColor: "#f8fbff",
    padding: 12,
    gap: 8,
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  textCol: { flex: 1, gap: 4 },
  title: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
  hint: { fontSize: 12, color: "#475569", lineHeight: 16 },
  status: { fontSize: 11, color: "#64748b", fontWeight: "600" },
});
