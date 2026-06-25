import type { VascularBasinId } from "@/lib/ai/vascular-ultrasound/protocol-checklists";
import {
  gradeAaaDiameter,
  gradeAvAccess,
  gradeCeliacCompression,
  gradeLowerLimbStenosis,
  gradeRenalAorticRatio,
  gradeVenousReflux,
  gradeLindegaardRatio,
  type VenousRefluxSegment,
} from "@/lib/ai/vascular-ultrasound/vascular-norms";

export type VascularAssistMetrics = {
  aortaDiameterMm?: number | null;
  renalPsvCmS?: number | null;
  aortaPsvForRarCmS?: number | null;
  celiacPsvInspirationCmS?: number | null;
  celiacPsvExpirationCmS?: number | null;
  refluxDurationSec?: number | null;
  refluxSegment?: VenousRefluxSegment;
  psvStenosisCmS?: number | null;
  psvProximalCmS?: number | null;
  mcaPsvCmS?: number | null;
  icaPsvForLindegaardCmS?: number | null;
  avShuntPsvCmS?: number | null;
  avVolumeFlowMlMin?: number | null;
};

export type VascularBasinHint = {
  label: string;
  criteria: string[];
};

export function buildVascularBasinHints(
  basin: VascularBasinId | undefined,
  metrics: VascularAssistMetrics | undefined,
): VascularBasinHint[] {
  if (!basin || !metrics) return [];
  const hints: VascularBasinHint[] = [];

  if (basin === "abdominal-aorta") {
    if (metrics.aortaDiameterMm != null) {
      const g = gradeAaaDiameter(metrics.aortaDiameterMm);
      hints.push({ label: g.label, criteria: g.criteria.length ? g.criteria : [g.label] });
    }
    if (metrics.renalPsvCmS != null && metrics.aortaPsvForRarCmS != null) {
      const r = gradeRenalAorticRatio(metrics.renalPsvCmS, metrics.aortaPsvForRarCmS);
      hints.push({ label: r.label, criteria: r.criteria });
    }
    if (metrics.celiacPsvInspirationCmS != null && metrics.celiacPsvExpirationCmS != null) {
      const c = gradeCeliacCompression({
        psvInspirationCmS: metrics.celiacPsvInspirationCmS,
        psvExpirationCmS: metrics.celiacPsvExpirationCmS,
      });
      hints.push({ label: c.label, criteria: [c.label] });
    }
  }

  if (basin === "lower-limb-veins" && metrics.refluxDurationSec != null) {
    const r = gradeVenousReflux({
      durationSec: metrics.refluxDurationSec,
      segment: metrics.refluxSegment ?? "superficial",
    });
    hints.push({ label: r.label, criteria: r.criteria });
  }

  if (basin === "lower-limb-arteries" && (metrics.psvStenosisCmS != null || metrics.psvProximalCmS != null)) {
    const g = gradeLowerLimbStenosis({
      psvStenosisCmS: metrics.psvStenosisCmS,
      psvProximalCmS: metrics.psvProximalCmS,
    });
    hints.push({ label: `${g.label} (${g.percentRange})`, criteria: g.criteria });
  }

  if (basin === "tcd" && metrics.mcaPsvCmS != null && metrics.icaPsvForLindegaardCmS != null) {
    const l = gradeLindegaardRatio(metrics.mcaPsvCmS, metrics.icaPsvForLindegaardCmS);
    hints.push({ label: l.label, criteria: [`Lindegaard ratio ${l.ratio.toFixed(1)}`] });
  }

  if (
    basin === "upper-limb" &&
    (metrics.avShuntPsvCmS != null || metrics.avVolumeFlowMlMin != null)
  ) {
    const a = gradeAvAccess({
      shuntPsvCmS: metrics.avShuntPsvCmS,
      volumeFlowMlMin: metrics.avVolumeFlowMlMin,
      accessType: "fistula",
    });
    hints.push({ label: a.label, criteria: a.criteria });
  }

  return hints;
}

export function formatBasinHintsForPrompt(hints: VascularBasinHint[]): string {
  if (!hints.length) return "";
  return hints.map((h) => `• ${h.label}: ${h.criteria.join("; ")}`).join("\n");
}
