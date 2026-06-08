import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { ClinicalDocumentSpec } from "@/lib/reporting/clinical-document";
import { normalizeClinicalDocumentSpec } from "@/lib/reporting/clinical-document";

Font.register({
  family: "NotoSans",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@v2.015/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@v2.015/hinted/ttf/NotoSans/NotoSans-Bold.ttf",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "NotoSans", lineHeight: 1.4 },
  brand: { fontSize: 11, color: "#1d6fd8", fontWeight: 700, marginBottom: 8 },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 10 },
  meta: { fontSize: 9, color: "#475569", marginBottom: 12 },
  h2: { fontSize: 11, fontWeight: 700, marginTop: 10, marginBottom: 4, color: "#334155" },
  p: { marginBottom: 4 },
  footer: { marginTop: 16, fontSize: 8, color: "#64748b" },
});

export function ClinicalTextPdfDocument({ spec }: { spec: ClinicalDocumentSpec }) {
  const doc = normalizeClinicalDocumentSpec(spec);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>SonoGyn Pro</Text>
        <Text style={styles.title}>{doc.title}</Text>
        {doc.meta?.map((m) => (
          <Text key={m.label} style={styles.meta}>
            {m.label}: {m.value}
          </Text>
        ))}
        {doc.sections.map((s, i) => (
          <View key={`${s.heading ?? "sec"}-${i}`}>
            {s.heading ? <Text style={styles.h2}>{s.heading}</Text> : null}
            {s.body.split("\n").map((line, j) => (
              <Text key={j} style={styles.p}>
                {line || " "}
              </Text>
            ))}
          </View>
        ))}
        <Text style={styles.footer}>{doc.disclaimer}</Text>
      </Page>
    </Document>
  );
}
