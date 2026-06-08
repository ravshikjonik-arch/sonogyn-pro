import { formatISO } from "date-fns";

import type { IdeaFormValues } from "./schema";

export const IDEA_STORAGE_KEY = "idea-deep-endometriosis-draft-v1";

export function getDefaultIdeaFormValues(): IdeaFormValues {
  const today = formatISO(new Date(), { representation: "date" });
  return {
    patientId: "",
    examDate: today,
    sonographerId: "",
    impressionManualOverride: "",
    aiPrediction: null,
    step1: {
      uterus: {
        position: "anteverted",
        size: "normal",
        myometrium: "homogeneous",
        adenomyosisSuspicion: false,
      },
      adnexaRight: {
        ovaryVisibility: "visible",
        ovarySize: "normal",
        endometriomaPresent: false,
        cystCharacteristics: [],
      },
      adnexaLeft: {
        ovaryVisibility: "visible",
        ovarySize: "normal",
        endometriomaPresent: false,
        cystCharacteristics: [],
      },
      freeTextComment: "",
    },
    step2: {
      softMarkers: {
        tendernessOnProbePalpation: false,
        fixedOvaries: false,
        peritonealFluid: false,
      },
      ovarianMobilityRight: "mobile",
      ovarianMobilityLeft: "mobile",
      siteTenderness: {
        pouchOfDouglas: { present: false },
        uterosacralRight: { present: false },
        uterosacralLeft: { present: false },
        bladderBase: { present: false },
      },
    },
    step3: {
      slidingSign: {
        anteriorCompartment: "present",
        posteriorCompartment: "present",
        rightOvarianFossa: "present",
        leftOvarianFossa: "present",
      },
      diagramSelectedRegionIds: [],
    },
    step4: {
      nodules: [],
    },
  };
}
