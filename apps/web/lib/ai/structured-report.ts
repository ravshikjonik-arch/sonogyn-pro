/**
 * Structured ultrasound reporting contract — AI agents serialize into this shape.
 * Wire PDF/HTML exporters against these fields for regulatory-friendly archives.
 */

export type StructuredPatientStub = {
  identifierType: "pseudo" | "mrn";
  value: string;
  sex?: "female" | "male" | "other";
  gestationalAgeWeeks?: number;
};

export type StructuredStudyStub = {
  modality: "ultrasound";
  region: string;
  protocol?: string;
  machineVendor?: string;
  operatorRole?: string;
};

export type StructuredFinding = {
  label: string;
  scorecard?: string;
  category?: string;
  recommendation?: string;
  confidence?: number;
};

export type StructuredUltrasoundReport = {
  version: "2026.1";
  generatedAt: string;
  patient: StructuredPatientStub;
  study: StructuredStudyStub;
  findings: StructuredFinding[];
  conclusion: string;
  citations?: string[];
};

export function buildDemoStructuredReport(): StructuredUltrasoundReport {
  return {
    version: "2026.1",
    generatedAt: new Date().toISOString(),
    patient: { identifierType: "pseudo", value: "CASE-DEMO-0142", sex: "female" },
    study: {
      modality: "ultrasound",
      region: "Pelvis · transvaginal",
      protocol: "ISRBP pelvic protocol v3",
    },
    findings: [
      {
        label: "Endometrium",
        scorecard: "IETA benign pattern",
        recommendation: "Routine follow-up per clinical indication.",
        confidence: 0.62,
      },
      {
        label: "Ovaries",
        scorecard: "O-RADS 2",
        recommendation: "Annual surveillance unless symptoms evolve.",
        confidence: 0.71,
      },
    ],
    conclusion:
      "Pattern compatible with benign physiologic appearance under demo thresholds — validate against institutional CDS.",
    citations: ["ACR O-RADS v2022", "SMFM Consult #YY"],
  };
}
