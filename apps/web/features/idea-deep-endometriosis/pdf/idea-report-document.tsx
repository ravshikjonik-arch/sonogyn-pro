import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { ruAfsCategory } from "../lib/idea-labels-ru";
import type { IdeaFormValues } from "../lib/schema";
import type { GeneratedReport } from "../lib/report-engine";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica" },
  h1: { fontSize: 16, marginBottom: 8, fontFamily: "Helvetica" },
  h2: { fontSize: 11, marginTop: 10, marginBottom: 4, fontFamily: "Helvetica" },
  p: { marginBottom: 4, lineHeight: 1.35 },
  meta: { fontSize: 9, color: "#444", marginBottom: 12 },
  bullet: { marginLeft: 8, marginBottom: 2 },
});

export type IdeaReportPdfProps = {
  data: IdeaFormValues;
  report: GeneratedReport;
  /** Итоговое заключение (с учётом ручного переопределения). */
  impressionDisplay: string;
};

export function IdeaReportDocument({ data, report, impressionDisplay }: IdeaReportPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>IDEA — структурированное УЗИ (глубокий эндометриоз)</Text>
        <Text style={styles.meta}>
          ID пациента: {data.patientId || "—"} | Дата исследования: {data.examDate} | Врач: {data.sonographerId || "—"}
        </Text>
        <Text style={styles.h2}>Описание</Text>
        {report.ultrasoundFindingsSummary.map((s) => (
          <View key={s.stepId} wrap={false}>
            <Text style={styles.h2}>
              Шаг {s.stepId}: {s.title}
            </Text>
            {s.bullets.map((b) => (
              <Text key={b} style={styles.bullet}>
                • {b}
              </Text>
            ))}
          </View>
        ))}
        <Text style={styles.h2}>Заключение</Text>
        <Text style={styles.p}>{impressionDisplay}</Text>
        <Text style={styles.h2}>Риск (по правилам модуля)</Text>
        <Text style={styles.p}>
          Категория: {ruAfsCategory(report.riskSummary.afsCategory)} (баллы {report.riskSummary.afsPoints})
        </Text>
        <Text style={styles.p}>{report.riskSummary.enzianPreliminary}</Text>
        <Text style={styles.h2}>Дисклеймер</Text>
        <Text style={styles.p}>
          Учебно-справочный структурированный отчёт. Не является диагнозом. Интерпретация и клинические решения — за
          лечащим специалистом; руководствуйтесь клиническими рекомендациями и локальными протоколами (МЗ РФ / ДЗМ и др.).
        </Text>
      </Page>
    </Document>
  );
}
