import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useRef } from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type ScrollView as ScrollViewType,
} from "react-native";
import { getOradsReferat, type OradsReferatDocument } from "@repo/orads-us";

import { getWebApiBase } from "../../api/chatBackend";
import type { RootStackParamList } from "../../navigation/paramLists";
import i18n from "../../i18n";

type Props = NativeStackScreenProps<RootStackParamList, "ORADSGuide">;

function resolveImageUri(path: string | undefined, base: string | null): string | null {
  if (!path || !base) return null;
  return `${base}${path}`;
}

function SectionBlock({
  doc,
  sectionId,
  base,
  onLayout,
}: {
  doc: OradsReferatDocument;
  sectionId: string;
  base: string | null;
  onLayout: (id: string, y: number) => void;
}) {
  const section = doc.sections.find((s) => s.id === sectionId);
  if (!section) return null;

  const sectionCases = doc.cases.filter((c) => c.sectionId === section.id && c.image);

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => onLayout(section.id, e.nativeEvent.layout.y)}
      style={styles.section}
    >
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.paragraphs.map((p) => (
        <Text key={p.slice(0, 48)} style={styles.paragraph}>
          {p}
        </Text>
      ))}
      {section.bullets ? (
        <View style={styles.bullets}>
          {section.bullets.map((b) => (
            <Text key={b} style={styles.bullet}>
              • {b}
            </Text>
          ))}
        </View>
      ) : null}

      {section.image ? (
        <View style={styles.figure}>
          <Image
            source={{ uri: resolveImageUri(section.image, base) ?? undefined }}
            style={styles.figureImage}
            resizeMode="contain"
            accessibilityLabel={section.imageCaption ?? section.title}
          />
          {section.imageCaption ? <Text style={styles.caption}>{section.imageCaption}</Text> : null}
        </View>
      ) : null}

      {sectionCases.map((c) => (
        <View
          key={c.id}
          onLayout={(e) => onLayout(c.id, e.nativeEvent.layout.y)}
          style={styles.figure}
        >
          <Text style={styles.caseTitle}>
            {i18n.locale.startsWith("ru") ? `Случай ${c.number}` : `Case ${c.number}`}: {c.title}
          </Text>
          <Image
            source={{ uri: resolveImageUri(c.image, base) ?? undefined }}
            style={styles.caseImage}
            resizeMode="contain"
            accessibilityLabel={c.title}
          />
          <Text style={styles.caption}>{c.caption}</Text>
        </View>
      ))}
    </View>
  );
}

export default function OradsGuideScreen({ navigation, route }: Props) {
  const scrollRef = useRef<ScrollViewType>(null);
  const offsetsRef = useRef<Record<string, number>>({});
  const base = getWebApiBase();
  const doc = useMemo(() => getOradsReferat(i18n.locale), [i18n.locale]);
  const targetSection = route.params?.sectionId;
  const targetCase = route.params?.caseId;

  useEffect(() => {
    const id = targetCase ?? targetSection;
    if (!id) return;
    const y = offsetsRef.current[id];
    if (y == null) return;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
    });
  }, [targetCase, targetSection, doc]);

  function rememberOffset(id: string, y: number) {
    offsetsRef.current[id] = y;
    const jump = targetCase ?? targetSection;
    if (jump === id) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: false });
      });
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>‹ {i18n.locale.startsWith("ru") ? "Назад" : "Back"}</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {doc.meta.title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>
        <Text style={styles.subtitle}>{doc.meta.subtitle}</Text>
        <Text style={styles.version}>{doc.meta.version}</Text>
        <Text style={styles.disclaimer}>{doc.meta.disclaimer}</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tocRow}>
          {doc.sections.map((s) => (
            <Pressable
              key={s.id}
              style={styles.tocChip}
              onPress={() => {
                const y = offsetsRef.current[s.id];
                if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
              }}
            >
              <Text style={styles.tocChipText}>{s.title.replace(/^\d+(\.\d+)?\.\s*/, "")}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {doc.sections.map((s) => (
          <SectionBlock
            key={s.id}
            doc={doc}
            sectionId={s.id}
            base={base}
            onLayout={rememberOffset}
          />
        ))}

        <View
          onLayout={(e) => rememberOffset("categories", e.nativeEvent.layout.y)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>
            {doc.sections.find((s) => s.id === "categories")?.title ?? "O-RADS categories"}
          </Text>
          {doc.categories.map((row) => (
            <View key={row.category} style={styles.catRow}>
              <Text style={styles.catLabel}>{row.category}</Text>
              <Text style={styles.catRisk}>{row.risk}</Text>
              <Text style={styles.catDesc}>{row.description}</Text>
              <Text style={styles.catMgmt}>{row.management}</Text>
            </View>
          ))}
        </View>

        <Pressable style={styles.wizardBtn} onPress={() => navigation.navigate("ORADSWizard")}>
          <Text style={styles.wizardBtnText}>
            {i18n.locale.startsWith("ru") ? "Открыть O-RADS Wizard" : "Open O-RADS Wizard"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  back: { color: "#2563EB", fontWeight: "700", fontSize: 16, minWidth: 72 },
  headerTitle: { flex: 1, textAlign: "center", fontWeight: "800", fontSize: 16, color: "#0f172a" },
  headerSpacer: { minWidth: 72 },
  scroll: { padding: 16, paddingBottom: 40 },
  subtitle: { fontSize: 14, color: "#475569", lineHeight: 20 },
  version: { marginTop: 4, fontSize: 12, fontWeight: "700", color: "#64748b" },
  disclaimer: { marginTop: 8, fontSize: 11, color: "#94a3b8", lineHeight: 16 },
  tocRow: { marginVertical: 12, maxHeight: 44 },
  tocChip: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  tocChipText: { fontSize: 12, fontWeight: "700", color: "#1D4ED8" },
  section: { marginTop: 20, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 8 },
  paragraph: { fontSize: 14, lineHeight: 21, color: "#334155", marginBottom: 8 },
  bullets: { marginBottom: 8, gap: 4 },
  bullet: { fontSize: 14, lineHeight: 20, color: "#334155" },
  figure: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  figureImage: { width: "100%", height: 200, backgroundColor: "#0f172a" },
  caseImage: { width: "100%", height: 180, backgroundColor: "#0f172a" },
  caseTitle: { padding: 10, fontWeight: "800", fontSize: 13, color: "#0f172a" },
  caption: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: "#64748b",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  catRow: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  catLabel: { fontWeight: "800", fontSize: 15, color: "#0f172a" },
  catRisk: { fontSize: 12, fontWeight: "700", color: "#2563EB", marginTop: 2 },
  catDesc: { fontSize: 13, color: "#334155", marginTop: 4 },
  catMgmt: { fontSize: 12, color: "#64748b", marginTop: 4 },
  wizardBtn: {
    marginTop: 24,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#2563EB",
  },
  wizardBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
