import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { RootStackParamList } from "../navigation/paramLists";
import { supabaseMobile } from "../lib/supabase/mobileClient";

type Props = NativeStackScreenProps<RootStackParamList, "SupabaseAuth">;

/**
 * Email/password authentication backed by Supabase Auth — pairs with the Next.js BFF for Stripe restore flows.
 */
export default function SupabaseAuthScreen({ navigation }: Props) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!supabaseMobile) {
      Alert.alert(
        "Supabase not configured",
        "Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in apps/mobile/.env",
      );
      return;
    }

    setBusy(true);
    try {
      if (mode === "sign-up") {
        const { error } = await supabaseMobile.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        Alert.alert("Check inbox", "Confirm your email if Supabase requires verification.");
      } else {
        const { error } = await supabaseMobile.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        navigation.navigate("Main");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Authentication failed";
      Alert.alert("Auth error", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.kicker}>HIPAA-ready architecture</Text>
      <Text style={styles.title}>Supabase workspace login</Text>
      <Text style={styles.body}>
        Uses the same Postgres identities as the Next.js app. Pair this session with RevenueCat or Stripe restore APIs for
        entitlement hydration.
      </Text>

      <View style={styles.toggleRow}>
        <Pressable style={[styles.toggle, mode === "sign-in" && styles.toggleActive]} onPress={() => setMode("sign-in")}>
          <Text style={[styles.toggleText, mode === "sign-in" && styles.toggleTextActive]}>Sign in</Text>
        </Pressable>
        <Pressable style={[styles.toggle, mode === "sign-up" && styles.toggleActive]} onPress={() => setMode("sign-up")}>
          <Text style={[styles.toggleText, mode === "sign-up" && styles.toggleTextActive]}>Create account</Text>
        </Pressable>
      </View>

      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        secureTextEntry
        placeholder="Password"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={[styles.primary, busy && styles.primaryDisabled]} disabled={busy} onPress={() => void submit()}>
        <Text style={styles.primaryText}>{busy ? "Working…" : mode === "sign-in" ? "Sign in" : "Sign up"}</Text>
      </Pressable>

      <Pressable style={styles.secondary} onPress={() => navigation.goBack()}>
        <Text style={styles.secondaryText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 14,
    backgroundColor: "#F8FBFF",
    flexGrow: 1,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#0EA5E9",
  },
  title: { fontSize: 26, fontWeight: "900", color: "#0F172A" },
  body: { fontSize: 14, lineHeight: 21, color: "#475569" },
  toggleRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  toggle: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5F5",
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  toggleActive: { borderColor: "#005CB9", backgroundColor: "#E0F2FE" },
  toggleText: { fontWeight: "800", color: "#64748B" },
  toggleTextActive: { color: "#075985" },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fff",
    fontSize: 15,
  },
  primary: {
    marginTop: 6,
    borderRadius: 999,
    backgroundColor: "#005CB9",
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryDisabled: { opacity: 0.6 },
  primaryText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  secondary: { paddingVertical: 8, alignItems: "center" },
  secondaryText: { color: "#005CB9", fontWeight: "800" },
});
