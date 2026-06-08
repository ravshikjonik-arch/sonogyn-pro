"use client";

import { useMemo, useState } from "react";

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

export function useOradsProForm() {
  const [localization, setLocalization] = useState<Localization | undefined>("ovarian");
  const [menopause, setMenopause] = useState<Menopause | undefined>();
  const [lesionKind, setLesionKind] = useState<LesionKind | undefined>();
  const [physType, setPhysType] = useState<PhysiologicalType | undefined>();
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

  const input = useMemo<OradsInput>(
    () => ({
      localization,
      menopause,
      lesionKind,
      physiologicalType: physType,
      structure,
      unilocularSubtype,
      customDescription: customDescription.trim() || undefined,
      septaCount,
      septaThickness,
      solidComponent,
      solidType,
      echogenicity,
      lengthMm: Number(lengthMm) > 0 ? Number(lengthMm) : undefined,
      widthMm: Number(widthMm) > 0 ? Number(widthMm) : undefined,
      heightMm: Number(heightMm) > 0 ? Number(heightMm) : undefined,
      ascites,
      bloodFlow,
      peritonealNodules,
      iotaLesionType,
      papillaryProjectionCount,
      papillaryProjectionSurface,
      largestSolidDiameterMm: Number(largestSolidDiameterMm) > 0 ? Number(largestSolidDiameterMm) : undefined,
      cystLoculesOver10,
      acousticShadows,
      iotaColorScore,
      iotaCenterType,
    }),
    [
      localization,
      menopause,
      lesionKind,
      physType,
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
    ],
  );

  const result = useMemo(() => calculateORADS(input), [input]);
  const iotaConsensus = useMemo(() => evaluateIotaConsensus2026(input, result), [input, result]);
  const reportText = useMemo(
    () => `${buildReportText(input, result)}\n\n${buildIotaConsensusReportText(iotaConsensus)}`,
    [input, result, iotaConsensus],
  );

  function reset() {
    setLocalization("ovarian");
    setMenopause(undefined);
    setLesionKind(undefined);
    setPhysType(undefined);
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
  }

  return {
    input,
    result,
    iotaConsensus,
    reportText,
    reset,
    localization,
    setLocalization,
    menopause,
    setMenopause,
    lesionKind,
    setLesionKind,
    physType,
    setPhysType,
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
    setBloodFlow,
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
  };
}

export type OradsProForm = ReturnType<typeof useOradsProForm>;
