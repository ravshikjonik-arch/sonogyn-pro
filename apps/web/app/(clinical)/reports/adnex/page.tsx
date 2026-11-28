import { ReportWorkspace } from "@/components/reports/ReportWorkspace";
import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

export const metadata = buildPublicMetadata({
  title: "Структурированный протокол · придатки · SonoGyn",
  description: "Structured Reporting Engine — O-RADS adnex v1",
  path: "/reports/adnex",
});

export default function AdnexReportPage() {
  return <ReportWorkspace />;
}
