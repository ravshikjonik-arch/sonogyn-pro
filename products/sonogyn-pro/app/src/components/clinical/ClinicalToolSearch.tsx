import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  getClinicalToolById,
  searchClinicalTools,
  type ClinicalTool,
  type DoctorRole,
} from "@repo/clinical-tools";

import { openClinicalToolAction, type ClinicalToolNav } from "../../lib/clinical-tools/openClinicalTool";

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

  const results = useMemo(
    () => searchClinicalTools(query, { role: role ?? undefined, limit: compact ? 6 : 10 }),
    [query, role, compact],
  );

  function pick(tool: ClinicalTool) {
    onSelect?.(tool);
    if (tool.mobileAction) openClinicalToolAction(navigation, tool.mobileAction);
    setQuery("");
  }

  return (
    <View style={styles.wrap}>
      <TextInput
        style={[styles.input, compact && styles.inputCompact]}
        placeholder={placeholder ?? "Что искать? O-RADS, эндометрий, чат…"}
        placeholderTextColor="#94a3b8"
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {query.trim().length > 0 ? (
        <View style={styles.results}>
          {results.length === 0 ? (
            <Text style={styles.empty}>Ничего не найдено — попробуйте синоним (яичник, щж, пролапс)</Text>
          ) : (
            results.map((tool) => (
              <Pressable key={tool.id} style={styles.row} onPress={() => pick(tool)}>
                <Text style={styles.rowTitle}>{tool.title}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>
                  {tool.subtitle}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

export function PinnedToolsRow({
  navigation,
  toolIds,
}: {
  navigation: Nav;
  toolIds: string[];
}) {
  const tools = toolIds.map((id) => getClinicalToolById(id)).filter((x): x is ClinicalTool => !!x);

  if (!tools.length) return null;

  return (
    <View style={styles.pinsWrap}>
      <Text style={styles.pinsLabel}>Избранное</Text>
      <View style={styles.pinsRow}>
        {tools.map((tool) => (
          <Pressable
            key={tool.id}
            style={styles.pin}
            onPress={() => tool.mobileAction && openClinicalToolAction(navigation, tool.mobileAction)}
          >
            <Text style={styles.pinText} numberOfLines={2}>
              {tool.title}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
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
  row: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  rowTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  rowSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  empty: { padding: 14, fontSize: 13, color: "#64748b" },
  pinsWrap: { gap: 8 },
  pinsLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  pinsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pin: {
    maxWidth: "48%",
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#ede9fe",
    borderWidth: 1,
    borderColor: "#c4b5fd",
  },
  pinText: { fontSize: 12, fontWeight: "800", color: "#5b21b6" },
});
