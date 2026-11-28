import { ObstetricExpertClient } from "@/components/clinical-assistant/ObstetricExpertClient";
import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

export const metadata = buildPublicMetadata({
  title: "Obstetric Expert",
  description: "Woodward + ISUOG expert copilot: дифференциал, биометрия, допплер, CDS",
  path: "/ai/consultants/obstetrics/expert",
});

export default function AiConsultantsObstetricExpertPage() {
  return <ObstetricExpertClient />;
}
