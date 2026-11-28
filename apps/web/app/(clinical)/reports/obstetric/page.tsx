import { ObstetricReportWorkspace } from "@/components/reports/ObstetricReportWorkspace";
import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

export const metadata = buildPublicMetadata({
  title: "Структурированный протокол · биометрия · SonoGyn",
  description: "Structured Reporting Engine — obstetric biometry v1",
  path: "/reports/obstetric",
});

export default function ObstetricReportPage() {
  return <ObstetricReportWorkspace />;
}
