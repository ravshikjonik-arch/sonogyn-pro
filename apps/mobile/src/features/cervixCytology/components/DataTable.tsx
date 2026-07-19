import { ScrollView, StyleSheet, Text, View } from "react-native";

import type { CervixTheme } from "../useCervixTheme";

type Row = Record<string, string>;

type Props = {
  columns: { key: string; label: string; width?: number }[];
  rows: Row[];
  theme: CervixTheme;
};

export function DataTable({ columns, rows, theme }: Props) {
  const tableMinWidth = columns.reduce((sum, c) => sum + (c.width ?? 140), 0);

  return (
    <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator>
      <View style={[styles.table, { borderColor: theme.colors.border, minWidth: tableMinWidth }]}>
        <View style={[styles.head, { backgroundColor: theme.colors.chip, borderColor: theme.colors.border }]}>
          {columns.map((col) => (
            <Text
              key={col.key}
              style={[styles.headCell, { color: theme.colors.text, width: col.width ?? 140 }]}
            >
              {col.label}
            </Text>
          ))}
        </View>
        {rows.map((row, idx) => (
          <View
            key={String(idx)}
            style={[styles.row, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
          >
            {columns.map((col) => (
              <Text
                key={col.key}
                style={[styles.cell, { color: theme.colors.text, width: col.width ?? 140 }]}
              >
                {row[col.key] ?? "—"}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  table: { borderWidth: 1, borderRadius: 10, overflow: "hidden" },
  head: { flexDirection: "row", borderBottomWidth: 1 },
  headCell: { padding: 10, fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  row: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  cell: { padding: 10, fontSize: 13, lineHeight: 18 },
});
