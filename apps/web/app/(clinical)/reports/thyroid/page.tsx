import { ThyroidReportWorkspace } from "@/components/reports/ThyroidReportWorkspace";
import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

export const metadata = buildPublicMetadata({
  title: "Структурированный протокол · TI-RADS · SonoGyn",
  description: "Structured Reporting Engine — thyroid TI-RADS v1",
  path: "/reports/thyroid",
});

export default function ThyroidReportPage() {
  return <ThyroidReportWorkspace />;
}
