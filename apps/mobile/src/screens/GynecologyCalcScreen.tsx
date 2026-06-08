import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { GynecologyRouter } from "../gynecology/GynecologyRouter";
import type { PageType } from "../navigationTypes";
import type { RootStackParamList } from "../navigation/paramLists";
import { theme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "GynecologyCalc">;

export default function GynecologyCalcScreen({ navigation, route }: Props) {
  const initial = route.params?.initialPage ?? "gyn_hub";
  const [page, setPage] = useState<PageType>(initial);

  useEffect(() => {
    const p = route.params?.initialPage;
    if (p) setPage(p);
  }, [route.params?.initialPage]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.title}>Калькуляторы</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
        <GynecologyRouter page={page} setPage={setPage} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.card,
  },
  backText: { fontSize: 18, color: theme.colors.text, fontWeight: "600" },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700", color: theme.colors.text },
  headerSpacer: { width: 40 },
  scroll: { padding: theme.spacing.md, paddingBottom: 32 },
});
