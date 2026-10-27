export function ellipsoidVolume(diametersMm: number[]): {
  volumeMm3: number;
  volumeCm3: number;
  meanDiameterMm: number;
  formula: string;
};

export function intramuralComponent(meanDiameterMm: number, intramuralComponentMm: number): number;

export function classifyFigo(features: {
  location: string;
  pedunculated?: boolean;
  contactsEndometrium?: boolean;
  intramuralPercent?: number;
}): { figo: string; labelRu: string; rule?: string };

export function hybridFigo(endometrialType: string, serosalType: string): { figo: string; labelRu: string };

export function growthDynamics(
  previousDiametersMm: number[],
  currentDiametersMm: number[],
  intervalDays: number,
): {
  meanDiameterDeltaMm: number;
  volumeDeltaCm3: number;
  volumeChangePercent: number;
  annualizedLinearChangePercent: number;
  caveatRu: string;
};

export function dopplerIndices(psv: number, edv: number, tamv: number): {
  ri: number;
  pi: number;
  caveatRu: string;
};
