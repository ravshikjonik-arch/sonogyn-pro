import { ThyroidReportWorkspace } from "@/components/reports/ThyroidReportWorkspace";

export const metadata = {
  title: "Структурированный протокол · TI-RADS · SonoGyn",
  description: "Structured Reporting Engine — thyroid TI-RADS v1",
};

export default function ThyroidReportPage() {
  return <ThyroidReportWorkspace />;
}
