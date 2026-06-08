export type AutoOvarianFeatures = {
  lesionType: "cystic" | "mixed" | "solid";
  lesionSizeCm: number;
  locularity: "unilocular" | "multilocular";
  innerWall: "smooth" | "irregular";
  papillaryProjections: "0" | "1to3" | "4plus";
  solidComponent: "none" | "present";
  externalContour: "smooth" | "irregular";
  acousticShadow?: "present" | "absent";
  colorScore: "1" | "2" | "3" | "4";
  ascites: "no" | "yes";
  classicBenignType:
    | "none"
    | "hemorrhagic"
    | "dermoid"
    | "endometrioma"
    | "paraovarian"
    | "hydrosalpinx";
  /** Если облако вернуло статус пациентки для O-RADS US */
  reproductiveStatus?:
    | "premenopausal_regular"
    | "premenopausal_irregular"
    | "postmenopausal"
    | "unknown";
};

export type AutoAnalyzeResponse = {
  features: AutoOvarianFeatures;
  confidence: number;
  comment: string;
  source: "cloud" | "mock";
};

const FALLBACK_MOCK: AutoAnalyzeResponse = {
  features: {
    lesionType: "mixed",
    lesionSizeCm: 11.2,
    locularity: "multilocular",
    innerWall: "irregular",
    papillaryProjections: "1to3",
    solidComponent: "present",
    externalContour: "smooth",
    colorScore: "3",
    ascites: "no",
    classicBenignType: "none",
    reproductiveStatus: "unknown",
  },
  confidence: 0.62,
  comment:
    "Демо-результат: признаки выглядят подозрительными, рекомендована экспертная верификация.",
  source: "mock",
};

export async function autoAnalyzeOvarianImage(
  imageUri: string
): Promise<AutoAnalyzeResponse> {
  const endpoint = process.env.EXPO_PUBLIC_AI_ENDPOINT;

  if (!endpoint) {
    return FALLBACK_MOCK;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUri, modality: "us-ovary" }),
    });

    if (!response.ok) {
      return FALLBACK_MOCK;
    }

    const data = (await response.json()) as AutoAnalyzeResponse;
    if (!data?.features) {
      return FALLBACK_MOCK;
    }
    return { ...data, source: "cloud" };
  } catch {
    return FALLBACK_MOCK;
  }
}
