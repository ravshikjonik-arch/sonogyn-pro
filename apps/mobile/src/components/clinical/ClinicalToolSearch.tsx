import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  getClinicalToolById,
  searchClinicalTools,
  type ClinicalTool,
  type DoctorRole,
} from "@repo/clinical-tools";

import { openClinicalToolAction, openWebPath, type ClinicalToolNav } from "../../lib/clinical-tools/openClinicalTool";
import { unifiedClinicalSearch } from "../../lib/search/unifiedClinicalSearch";

type Nav = ClinicalToolNav;

type Props = {
  navigation: Nav;
  role?: DoctorRole | null;
  placeholder?: string;
  onSelect?: (tool: ClinicalTool) => void;
  compact?: boolean;
};

export function ClinicalToolSearchBar({ navigation, role, placeholder, onSelect, compact }: Props) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return unifiedClinicalSearch(q, { role: role ?? undefined, limit: compact ? 8 : 12 });
  }, [query, role, compact]);

  function pickTool(tool: ClinicalTool) {
    onSelect?.(tool);
    if (tool.mobileAction) openClinicalToolAction(navigation, tool.mobileAction);
    setQuery("");
  }

  return (
    <View style={styles.wrap}>
      <TextInput
        style={[styles.input, compact && styles.inputCompact]}
        placeholder={placeholder ?? "O-RADS, КР, эндометрий, IOTA…"}
        placeholderTextColor="#94a3b8"
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
        clearButtonMode="while-editing"
        accessibilityLabel="Поиск инструментов и материалов"
      />
      {query.trim().length > 0 ? (
        <View style={styles.results}>
          {results.length === 0 ? (
            <Text style={styles.empty}>Ничего не найдено — попробуйте синоним (яичник, щж, миома)</Text>
          ) : (
            results.map((hit) => {
              if (hit.kind === "tool") {
                const tool = hit.tool;
                return (
                  <Pressable key={`tool-${tool.id}`} style={styles.row} onPress={() => pickTool(tool)}>
                    <Text style={styles.rowTitle}>{tool.title}</Text>
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {tool.subtitle}
                    </Text>
                  </Pressable>
                );
              }
              const mod = hit.module;
              return (
                <Pressable
                  key={`mod-${mod.id}`}
                  style={styles.row}
                  onPress={() => {
                    void openWebPath(mod.href);
                    setQuery("");
                  }}
                >
                  <Text style={styles.rowTitle}>{mod.title}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {mod.description ?? mod.href}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>
      ) : null}
    </View>
  );
}

export function PinnedToolsRow({
  navigation,
  toolIds,
  recentActions,
}: {
  navigation: Nav;
  toolIds: string[];
  recentActions?: string[];
}) {
  const pinTools = toolIds.map((id) => getClinicalToolById(id)).filter((x): x is ClinicalTool => !!x);

  const recentTools = (recentActions ?? [])
    .map((action) => searchClinicalTools("", { limit: 200 }).find((t) => t.mobileAction === action))
    .filter((x): x is ClinicalTool => !!x)
    .filter((t) => !toolIds.includes(t.id));

  if (!pinTools.length && !recentTools.length) return null;

  return (
    <View style={styles.pinsWrap}>
      {pinTools.length ? (
        <>
          <Text style={styles.pinsLabel}>Избранное</Text>
          <View style={styles.pinsRow}>
            {pinTools.map((tool) => (
              <Pressable
                key={tool.id}
                style={styles.pinChip}
                onPress={() => tool.mobileAction && openClinicalToolAction(navigation, tool.mobileAction)}
              >
                <Text style={styles.pinText} numberOfLines={1}>
                  {tool.title.split("·")[0]?.trim() ?? tool.title}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
      {recentTools.length ? (
        <>
          <Text style={[styles.pinsLabel, pinTools.length ? styles.pinsLabelSpaced : null]}>Недавние</Text>
          <View style={styles.pinsRow}>
            {recentTools.map((tool) => (
              <Pressable
                key={`recent-${tool.id}`}
                style={[styles.pinChip, styles.pinChipRecent]}
                onPress={() => tool.mobileAction && openClinicalToolAction(navigation, tool.mobileAction)}
              >
                <Text style={styles.pinText} numberOfLines={1}>
                  {tool.title.split("·")[0]?.trim() ?? tool.title}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#0f172a",
  },
  inputCompact: { paddingVertical: 10, fontSize: 15 },
  results: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  row: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  rowTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  rowSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  empty: { padding: 14, fontSize: 13, color: "#64748b" },
  pinsWrap: { gap: 8 },
  pinsLabel: { fontSize: 11, fontWeight: "800", color: "#64748b", letterSpacing: 0.5, textTransform: "uppercase" },
  pinsLabelSpaced: { marginTop: 4 },
  pinsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pinChip: {
    borderRadius: 999,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: "48%",
  },
  pinChipRecent: { backgroundColor: "#f8fafc", borderColor: "#e2e8f0" },
  pinText: { fontSize: 12, fontWeight: "700", color: "#0f2744" },
});
