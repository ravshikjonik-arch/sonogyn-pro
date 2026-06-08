export type CalculatorDefinition = {
  slug: string;
  code: string;
  title: string;
  subtitle: string;
  /** Keys stored in payload JSON */
  fields: { key: string; label: string; type: "select" | "number" | "text"; options?: string[] }[];
};

export const CALCULATORS: CalculatorDefinition[] = [
  {
    slug: "o-rads",
    code: "O_RADS",
    title: "O-RADS",
    subtitle: "Ovarian-Adnexal Reporting and Data System",
    fields: [
      {
        key: "category",
        label: "Category",
        type: "select",
        options: ["0", "1", "2", "3", "4", "5"],
      },
      { key: "maxDiameterMm", label: "Largest lesion diameter (mm)", type: "number" },
      { key: "notes", label: "Impression / follow-up", type: "text" },
    ],
  },
  {
    slug: "bi-rads",
    code: "BI_RADS_US",
    title: "BI-RADS — Ultrasound",
    subtitle: "Breast imaging reporting",
    fields: [
      {
        key: "assessment",
        label: "Assessment",
        type: "select",
        options: ["0", "1", "2", "3", "4A", "4B", "4C", "5", "6"],
      },
      { key: "notes", label: "Recommendations", type: "text" },
    ],
  },
  {
    slug: "figo",
    code: "FIGO_FIBROID",
    title: "FIGO fibroid typing",
    subtitle: "Morphology / mural mapping",
    fields: [
      {
        key: "figoType",
        label: "FIGO type (0–8)",
        type: "select",
        options: ["0", "1", "2", "3", "4", "5", "6", "7", "8"],
      },
      { key: "notes", label: "Clinical context", type: "text" },
    ],
  },
  {
    slug: "ln-rads",
    code: "LN_RADS",
    title: "LN-RADS",
    subtitle: "Lymph node ultrasound descriptors",
    fields: [
      {
        key: "suspicion",
        label: "Suspicion level",
        type: "select",
        options: ["benign-appearing", "intermediate", "suspicious"],
      },
      { key: "notes", label: "Location / correlate", type: "text" },
    ],
  },
  {
    slug: "ti-rads",
    code: "TI_RADS",
    title: "TI-RADS",
    subtitle: "Thyroid nodule risk stratification",
    fields: [
      {
        key: "category",
        label: "EU-TIRADS–style category",
        type: "select",
        options: ["1–2", "3", "4", "5"],
      },
      { key: "notes", label: "Size / elastography notes", type: "text" },
    ],
  },
  {
    slug: "pop-q",
    code: "POP_Q",
    title: "POP-Q",
    subtitle: "Pelvic organ prolapse grid",
    fields: [
      { key: "Aa", label: "Aa", type: "text" },
      { key: "Ba", label: "Ba", type: "text" },
      { key: "C", label: "C", type: "text" },
      { key: "notes", label: "Stage / comments", type: "text" },
    ],
  },
  {
    slug: "fmf",
    code: "FMF_FIRST_TRIMESTER",
    title: "FMF first-trimester",
    subtitle: "Risk calculation placeholders",
    fields: [
      { key: "crlMm", label: "CRL (mm)", type: "number" },
      { key: "ntMm", label: "NT (mm)", type: "number" },
      { key: "notes", label: "Serum / demographics", type: "text" },
    ],
  },
];

export function getCalculatorBySlug(slug: string): CalculatorDefinition | undefined {
  return CALCULATORS.find((c) => c.slug === slug);
}
