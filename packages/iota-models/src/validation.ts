import type {
  AdnexInput,
  Lr2Input,
  SimpleRulesFeature,
  SimpleRulesInput,
  SimpleRulesRiskInput,
  ValidationError,
  ValidationResult,
} from "./types";

const B_FEATURES: SimpleRulesFeature[] = ["B1", "B2", "B3", "B4", "B5"];
const M_FEATURES: SimpleRulesFeature[] = ["M1", "M2", "M3", "M4", "M5"];

function err(field: string, messageKey: string): ValidationError {
  return { field, messageKey };
}

function uniqueFeatures(list: SimpleRulesFeature[]): SimpleRulesFeature[] {
  return [...new Set(list)];
}

function validateSimpleRulesFeatures(
  benign: SimpleRulesFeature[],
  malignant: SimpleRulesFeature[],
): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const f of benign) {
    if (!B_FEATURES.includes(f)) errors.push(err("benignFeatures", "iota.validation.simple.invalidBenignFeature"));
  }
  for (const f of malignant) {
    if (!M_FEATURES.includes(f)) errors.push(err("malignantFeatures", "iota.validation.simple.invalidMalignantFeature"));
  }
  return errors;
}

export function validateAdnexInput(raw: Partial<AdnexInput>): ValidationResult<AdnexInput> {
  const errors: ValidationError[] = [];
  const age = raw.ageYears;
  if (age == null || !Number.isFinite(age) || age < 18 || age > 100) {
    errors.push(err("ageYears", "iota.validation.adnex.ageRange"));
  }
  if (raw.oncologyCenter == null) errors.push(err("oncologyCenter", "iota.validation.adnex.oncologyCenterRequired"));
  const maxD = raw.maxDiameterMm;
  if (maxD == null || !Number.isFinite(maxD) || maxD < 8 || maxD > 400) {
    errors.push(err("maxDiameterMm", "iota.validation.adnex.maxDiameterMm"));
  }
  const solidD = raw.maxSolidDiameterMm;
  if (solidD == null || !Number.isFinite(solidD) || solidD < 0 || solidD > 400) {
    errors.push(err("maxSolidDiameterMm", "iota.validation.adnex.maxSolidMm"));
  }
  if (maxD != null && solidD != null && solidD > maxD) {
    errors.push(err("maxSolidDiameterMm", "iota.validation.adnex.solidExceedsLesion"));
  }
  if (raw.moreThan10Locules == null) errors.push(err("moreThan10Locules", "iota.validation.adnex.loculesRequired"));
  if (raw.papillaryCount == null) errors.push(err("papillaryCount", "iota.validation.adnex.papillaryRequired"));
  if (raw.acousticShadows == null) errors.push(err("acousticShadows", "iota.validation.adnex.shadowsRequired"));
  if (raw.ascites == null) errors.push(err("ascites", "iota.validation.adnex.ascitesRequired"));
  if (raw.ca125Uml != null && (!Number.isFinite(raw.ca125Uml) || raw.ca125Uml < 1 || raw.ca125Uml > 30000)) {
    errors.push(err("ca125Uml", "iota.validation.adnex.ca125Range"));
  }
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      ageYears: age!,
      oncologyCenter: raw.oncologyCenter!,
      maxDiameterMm: maxD!,
      maxSolidDiameterMm: solidD!,
      moreThan10Locules: raw.moreThan10Locules!,
      papillaryCount: raw.papillaryCount!,
      acousticShadows: raw.acousticShadows!,
      ascites: raw.ascites!,
      ca125Uml: raw.ca125Uml,
    },
  };
}

export function validateLr2Input(raw: Partial<Lr2Input>): ValidationResult<Lr2Input> {
  const errors: ValidationError[] = [];
  const age = raw.ageYears;
  if (age == null || !Number.isFinite(age) || age < 18 || age > 100) {
    errors.push(err("ageYears", "iota.validation.lr2.ageRange"));
  }
  if (raw.ascites == null) errors.push(err("ascites", "iota.validation.lr2.ascitesRequired"));
  if (raw.bloodFlowInSolidPapillary == null) {
    errors.push(err("bloodFlowInSolidPapillary", "iota.validation.lr2.bloodFlowRequired"));
  }
  const solid = raw.maxSolidDiameterMm;
  if (solid == null || !Number.isFinite(solid) || solid < 0 || solid > 400) {
    errors.push(err("maxSolidDiameterMm", "iota.validation.lr2.solidMm"));
  }
  if (raw.irregularInternalWalls == null) {
    errors.push(err("irregularInternalWalls", "iota.validation.lr2.wallsRequired"));
  }
  if (raw.acousticShadows == null) errors.push(err("acousticShadows", "iota.validation.lr2.shadowsRequired"));
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      ageYears: age!,
      ascites: raw.ascites!,
      bloodFlowInSolidPapillary: raw.bloodFlowInSolidPapillary!,
      maxSolidDiameterMm: solid!,
      irregularInternalWalls: raw.irregularInternalWalls!,
      acousticShadows: raw.acousticShadows!,
    },
  };
}

export function validateSimpleRulesInput(raw: Partial<SimpleRulesInput>): ValidationResult<SimpleRulesInput> {
  const benign = uniqueFeatures(raw.benignFeatures ?? []);
  const malignant = uniqueFeatures(raw.malignantFeatures ?? []);
  const errors = validateSimpleRulesFeatures(benign, malignant);
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { benignFeatures: benign, malignantFeatures: malignant } };
}

export function validateSimpleRulesRiskInput(
  raw: Partial<SimpleRulesRiskInput>,
): ValidationResult<SimpleRulesRiskInput> {
  if (raw.oncologyCenter == null) {
    return { ok: false, errors: [err("oncologyCenter", "iota.validation.srrisk.oncologyCenterRequired")] };
  }
  const base = validateSimpleRulesInput(raw);
  if (!base.ok) return base;
  return {
    ok: true,
    value: {
      oncologyCenter: raw.oncologyCenter,
      benignFeatures: base.value.benignFeatures,
      malignantFeatures: base.value.malignantFeatures,
    },
  };
}
