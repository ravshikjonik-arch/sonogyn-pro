import { OradsProFlow } from "@/components/calculators/orads/OradsProFlow";
import { ModuleProgressWidget } from "@/components/achievements/ModuleProgressWidget";

export const metadata = {
  title: "O-RADS US · SonoGyn",
};

export default function OradsProPage() {
  return (
    <div className="space-y-6">
      <OradsProFlow />
      <div className="mx-auto max-w-4xl px-4 pb-8">
        <ModuleProgressWidget moduleId="orads" eventType="case_complete" />
      </div>
    </div>
  );
}
