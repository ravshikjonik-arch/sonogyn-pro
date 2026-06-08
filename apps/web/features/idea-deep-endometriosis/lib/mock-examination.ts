import { formatISO } from "date-fns";

import { getDefaultIdeaFormValues } from "./default-values";
import type { IdeaFormValues } from "./schema";

/** Демо: 32 года, эндометриома слева, фиксация, потеря скольжения сзади, два узла. */
export function getMockIdeaExamination(): IdeaFormValues {
  const base = getDefaultIdeaFormValues();
  return {
    ...base,
    patientId: "DEMO-32YO",
    examDate: formatISO(new Date(), { representation: "date" }),
    sonographerId: "IDEA-DEMO",
    step1: {
      ...base.step1,
      uterus: { ...base.step1.uterus, position: "retroverted", adenomyosisSuspicion: false },
      adnexaLeft: {
        ovaryVisibility: "visible",
        ovarySize: "enlarged",
        endometriomaPresent: true,
        cystCharacteristics: ["multilocular", "ground_glass"],
      },
      adnexaRight: {
        ovaryVisibility: "visible",
        ovarySize: "normal",
        endometriomaPresent: false,
        cystCharacteristics: [],
      },
      freeTextComment: "Эндометриома левого яичника ~42 мм; болезненность при мобилизации.",
    },
    step2: {
      softMarkers: {
        tendernessOnProbePalpation: true,
        fixedOvaries: true,
        peritonealFluid: false,
      },
      ovarianMobilityRight: "reduced_mobility",
      ovarianMobilityLeft: "fixed",
      siteTenderness: {
        pouchOfDouglas: { present: true, severity: "moderate" },
        uterosacralRight: { present: false },
        uterosacralLeft: { present: true, severity: "mild" },
        bladderBase: { present: false },
      },
    },
    step3: {
      slidingSign: {
        anteriorCompartment: "present",
        posteriorCompartment: "absent",
        rightOvarianFossa: "reduced",
        leftOvarianFossa: "reduced",
      },
      diagramSelectedRegionIds: ["posterior_compartment", "left_adnexa"],
    },
    step4: {
      nodules: [
        {
          id: "nodule-demo-1",
          location: "rectovaginal_septum",
          sizeLengthMm: 18,
          sizeWidthMm: 12,
          sizeHeightMm: 10,
          depthOfInfiltration: "muscular",
          shape: "nodular",
          associatedTenderness: true,
          vascularizationDoppler: "moderate",
          penelopeScore: 3,
        },
        {
          id: "nodule-demo-2",
          location: "uterosacral_ligament_left",
          sizeLengthMm: 11,
          sizeWidthMm: 6,
          sizeHeightMm: 5,
          depthOfInfiltration: "superficial",
          shape: "plaque",
          associatedTenderness: false,
          vascularizationDoppler: "minimal",
        },
      ],
    },
  };
}
