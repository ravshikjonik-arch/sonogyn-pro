"use client";

import { useMemo, useState } from "react";
import { parseMeasurementMm } from "@repo/medical-calculations";

import { buildAdnexTriangulationReport, evaluateAdnexTriangulation } from "@repo/adnex-education";

import {
  buildIotaConsensusReportText,
  buildReportText,
  calculateORADS,
  evaluateIotaConsensus2026,
  type BloodFlow,
  type Echogenicity,
  type IotaCenterType,
  type IotaColorScore,
  type IotaLesionType,
  type LesionKind,
  type Localization,
  type Menopause,
  type NormalOvaryPattern,
  type OradsInput,
  type PapillaryProjectionCount,
  type PapillaryProjectionSurface,
  type PhysiologicalType,
  type SeptaCount,
  type SeptaThickness,
  type SolidType,
  type Structure,
  type UnilocularSubtype,
} from "@/lib/orads-pro";

function bloodFlowToColorScore(flow?: BloodFlow): IotaColorScore | undefined {
  if (flow === "none") return "1";
  if (flow === "minimal") return "2";
  if (flow === "moderate") return "3";
  if (flow === "marked") return "4";
  return undefined;
}

function deriveIotaLesionType(
  structure?: Structure,
  solidComponent?: boolean,
): IotaLesionType | undefined {
  if (structure === "unilocular") return solidComponent ? "unilocular_solid_cyst" : "unilocular_cyst";
  if (structure === "multilocular") return solidComponent ? "multilocular_solid_cyst" : "multilocular_cyst";
  if (structure === "solid") return "solid_tumor";
  return undefined;
}

export function useOradsProForm() {
  const [localization, setLocalization] = useState<Localization | undefined>("ovarian");
  const [ageYears, setAgeYears] = useState("");
  const [cycleDay, setCycleDay] = useState("");
  const [menopause, setMenopause] = useState<Menopause | undefined>();
  const [lesionKind, setLesionKind] = useState<LesionKind | undefined>();
  const [physType, setPhysType] = useState<PhysiologicalType | undefined>();
  const [normalOvaryPattern, setNormalOvaryPattern] = useState<NormalOvaryPattern | undefined>();
  const [structure, setStructure] = useState<Structure | undefined>();
  const [unilocularSubtype, setUnilocularSubtype] = useState<UnilocularSubtype | undefined>();
  const [customDescription, setCustomDescription] = useState("");
  const [septaCount, setSeptaCount] = useState<SeptaCount | undefined>();
  const [septaThickness, setSeptaThickness] = useState<SeptaThickness | undefined>();
  const [solidComponent, setSolidComponent] = useState<boolean | undefined>();
  const [solidType, setSolidType] = useState<SolidType | undefined>();
  const [echogenicity, setEchogenicity] = useState<Echogenicity | undefined>();
  const [lengthMm, setLengthMm] = useState("");
  const [widthMm, setWidthMm] = useState("");
  const [heightMm, setHeightMm] = useState("");
  const [ascites, setAscites] = useState(false);
  const [bloodFlow, setBloodFlow] = useState<BloodFlow | undefined>();
  const [peritonealNodules, setPeritonealNodules] = useState(false);
  const [iotaLesionType, setIotaLesionType] = useState<IotaLesionType | undefined>();
  const [papillaryProjectionCount, setPapillaryProjectionCount] = useState<PapillaryProjectionCount | undefined>();
  const [papillaryProjectionSurface, setPapillaryProjectionSurface] = useState<PapillaryProjectionSurface | undefined>();
  const [largestSolidDiameterMm, setLargestSolidDiameterMm] = useState("");
  const [cystLoculesOver10, setCystLoculesOver10] = useState<boolean | undefined>();
  const [acousticShadows, setAcousticShadows] = useState<boolean | undefined>();
  const [iotaColorScore, setIotaColorScore] = useState<IotaColorScore | undefined>();
  const [iotaCenterType, setIotaCenterType] = useState<IotaCenterType | undefined>();
  const [incompleteSeptum, setIncompleteSeptum] = useState(false);

  const input = useMemo<OradsInput>(() => {
    const derivedLesionType = deriveIotaLesionType(structure, solidComponent);
    return {
      localization,
      ageYears: Number(ageYears) > 0 ? Number(ageYears) : undefined,
      cycleDay:
        menopause === "pre" && Number(cycleDay) > 0 && Number(cycleDay) <= 35 ? Number(cycleDay) : undefined,
      menopause,
      lesionKind,
      physiologicalType: physType,
      normalOvaryPattern,
      structure,
      unilocularSubtype,
      customDescription: customDescription.trim() || undefined,
      septaCount,
      septaThickness,
      solidComponent,
      solidType,
      echogenicity,
      lengthMm: parseMeasurementMm(lengthMm),
      widthMm: parseMeasurementMm(widthMm),
      heightMm: parseMeasurementMm(heightMm),
      ascites,
      bloodFlow,
      peritonealNodules,
      iotaLesionType: iotaLesionType ?? derivedLesionType,
      papillaryProjectionCount,
      papillaryProjectionSurface,
      largestSolidDiameterMm: parseMeasurementMm(largestSolidDiameterMm),
      cystLoculesOver10,
      acousticShadows,
      iotaColorScore: iotaColorScore ?? bloodFlowToColorScore(bloodFlow),
      iotaCenterType,
      incompleteSeptum: incompleteSeptum || undefined,
    };
  }, [
      localization,
      ageYears,
      cycleDay,
      menopause,
      lesionKind,
      physType,
      normalOvaryPattern,
      structure,
      unilocularSubtype,
      customDescription,
      septaCount,
      septaThickness,
      solidComponent,
      solidType,
      echogenicity,
      lengthMm,
      widthMm,
      heightMm,
      ascites,
      bloodFlow,
      peritonealNodules,
      iotaLesionType,
      papillaryProjectionCount,
      papillaryProjectionSurface,
      largestSolidDiameterMm,
      cystLoculesOver10,
      acousticShadows,
      iotaColorScore,
      iotaCenterType,
      incompleteSeptum,
    ],
  );

  const result = useMemo(() => calculateORADS(input), [input]);
  const iotaConsensus = useMemo(() => evaluateIotaConsensus2026(input, result), [input, result]);
  const triangulation = useMemo(
    () => evaluateAdnexTriangulation(input, result.category),
    [input, result.category],
  );
  const reportText = useMemo(() => {
    return [
      buildReportText(input, result),
      buildAdnexTriangulationReport(triangulation),
      buildIotaConsensusReportText(iotaConsensus),
    ].join("\n\n");
  }, [input, result, triangulation, iotaConsensus]);

  function reset() {
    setLocalization("ovarian");
    setAgeYears("");
    setCycleDay("");
    setMenopause(undefined);
    setLesionKind(undefined);
    setPhysType(undefined);
    setNormalOvaryPattern(undefined);
    setStructure(undefined);
    setUnilocularSubtype(undefined);
    setCustomDescription("");
    setSeptaCount(undefined);
    setSeptaThickness(undefined);
    setSolidComponent(undefined);
    setSolidType(undefined);
    setEchogenicity(undefined);
    setLengthMm("");
    setWidthMm("");
    setHeightMm("");
    setAscites(false);
    setBloodFlow(undefined);
    setPeritonealNodules(false);
    setIotaLesionType(undefined);
    setPapillaryProjectionCount(undefined);
    setPapillaryProjectionSurface(undefined);
    setLargestSolidDiameterMm("");
    setCystLoculesOver10(undefined);
    setAcousticShadows(undefined);
    setIotaColorScore(undefined);
    setIotaCenterType(undefined);
    setIncompleteSeptum(false);
  }

  function setBloodFlowWithColor(flow: BloodFlow | undefined) {
    setBloodFlow(flow);
    if (flow) setIotaColorScore(bloodFlowToColorScore(flow));
  }

  return {
    input,
    result,
    iotaConsensus,
    triangulation,
    reportText,
    reset,
    localization,
    setLocalization,
    ageYears,
    setAgeYears,
    cycleDay,
    setCycleDay,
    menopause,
    setMenopause,
    lesionKind,
    setLesionKind,
    physType,
    setPhysType,
    normalOvaryPattern,
    setNormalOvaryPattern,
    structure,
    setStructure,
    unilocularSubtype,
    setUnilocularSubtype,
    customDescription,
    setCustomDescription,
    septaCount,
    setSeptaCount,
    septaThickness,
    setSeptaThickness,
    solidComponent,
    setSolidComponent,
    solidType,
    setSolidType,
    echogenicity,
    setEchogenicity,
    lengthMm,
    setLengthMm,
    widthMm,
    setWidthMm,
    heightMm,
    setHeightMm,
    ascites,
    setAscites,
    bloodFlow,
    setBloodFlow: setBloodFlowWithColor,
    peritonealNodules,
    setPeritonealNodules,
    iotaLesionType,
    setIotaLesionType,
    papillaryProjectionCount,
    setPapillaryProjectionCount,
    papillaryProjectionSurface,
    setPapillaryProjectionSurface,
    largestSolidDiameterMm,
    setLargestSolidDiameterMm,
    cystLoculesOver10,
    setCystLoculesOver10,
    acousticShadows,
    setAcousticShadows,
    iotaColorScore,
    setIotaColorScore,
    iotaCenterType,
    setIotaCenterType,
    incompleteSeptum,
    setIncompleteSeptum,
  };
}

export type OradsProForm = ReturnType<typeof useOradsProForm>;
