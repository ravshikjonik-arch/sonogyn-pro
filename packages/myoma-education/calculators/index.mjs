/**
 * SonoGyn Pro: framework-agnostic educational calculations for uterine myoma.
 * No diagnostic thresholds, treatment recommendations or probability estimates.
 */

const EPSILON = 1e-9;

function finite(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
  return value;
}

function positive(value, name) {
  finite(value, name);
  if (value <= 0) throw new RangeError(`${name} must be greater than 0`);
  return value;
}

function percent(value, name = 'intramuralPercent') {
  finite(value, name);
  if (value < 0 || value > 100) throw new RangeError(`${name} must be between 0 and 100`);
  return value;
}

function validDiameters(diametersMm) {
  if (!Array.isArray(diametersMm) || diametersMm.length !== 3) {
    throw new TypeError('diametersMm must contain exactly three values');
  }
  return diametersMm.map((value, index) => positive(value, `diametersMm[${index}]`));
}

/** Volume of a triaxial ellipsoid: V = π/6 × D1 × D2 × D3. */
export function ellipsoidVolume(diametersMm) {
  const [d1, d2, d3] = validDiameters(diametersMm);
  const volumeMm3 = (Math.PI / 6) * d1 * d2 * d3;
  return {
    volumeMm3,
    volumeCm3: volumeMm3 / 1000,
    meanDiameterMm: (d1 + d2 + d3) / 3,
    formula: 'V = π/6 × D1 × D2 × D3',
  };
}

/** Intramural component is measured against the mean diameter, not volume. */
export function intramuralComponent(meanDiameterMm, intramuralComponentMm) {
  positive(meanDiameterMm, 'meanDiameterMm');
  finite(intramuralComponentMm, 'intramuralComponentMm');
  if (intramuralComponentMm < 0 || intramuralComponentMm > meanDiameterMm + EPSILON) {
    throw new RangeError('intramuralComponentMm must be between 0 and meanDiameterMm');
  }
  return (intramuralComponentMm / meanDiameterMm) * 100;
}

export function classifySubmucosalByIntramuralPercent(intramuralPercent) {
  const value = percent(intramuralPercent);
  return {
    figo: value < 50 ? '1' : '2',
    rule: value < 50 ? 'Intramural component <50%' : 'Intramural component ≥50%',
  };
}

export function classifySubserosalByIntramuralPercent(intramuralPercent) {
  const value = percent(intramuralPercent);
  return {
    figo: value < 50 ? '6' : '5',
    rule: value < 50 ? 'Intramural component <50%' : 'Intramural component ≥50%',
  };
}

/**
 * Structured FIGO topography helper. It does not infer features from an image.
 * location: intracavitary | submucosal | intramural | subserosal | other
 */
export function classifyFigo(features) {
  if (!features || typeof features !== 'object') throw new TypeError('features are required');
  const { location, pedunculated = false, contactsEndometrium = false, intramuralPercent } = features;
  if (location === 'intracavitary') {
    if (!pedunculated) throw new RangeError('FIGO 0 requires a pedunculated intracavitary lesion');
    return { figo: '0', labelRu: 'Внутриполостной узел на ножке' };
  }
  if (location === 'submucosal') {
    const result = classifySubmucosalByIntramuralPercent(intramuralPercent);
    return { ...result, labelRu: 'Субмукозный узел' };
  }
  if (location === 'intramural') {
    return contactsEndometrium
      ? { figo: '3', labelRu: 'Интрамуральный узел, контактирующий с эндометрием' }
      : { figo: '4', labelRu: 'Интрамуральный узел' };
  }
  if (location === 'subserosal') {
    if (pedunculated) return { figo: '7', labelRu: 'Субсерозный узел на ножке' };
    const result = classifySubserosalByIntramuralPercent(intramuralPercent);
    return { ...result, labelRu: 'Субсерозный узел' };
  }
  if (location === 'other') return { figo: '8', labelRu: 'Прочая локализация' };
  throw new RangeError('Unknown location');
}

/** Hybrid notation: endometrial relationship first, serosal relationship second. */
export function hybridFigo(endometrialType, serosalType) {
  const first = String(endometrialType);
  const second = String(serosalType);
  if (!['0', '1', '2', '3', '4'].includes(first)) {
    throw new RangeError('endometrialType must be one of 0, 1, 2, 3, 4');
  }
  if (!['5', '6', '7'].includes(second)) {
    throw new RangeError('serosalType must be one of 5, 6, 7');
  }
  return {
    figo: `${first}–${second}`,
    labelRu: 'Гибридный узел: сначала отношение к эндометрию, затем к серозной оболочке',
  };
}

/** Compare the same lesion using comparable planes and units. */
export function growthDynamics(previousDiametersMm, currentDiametersMm, intervalDays) {
  positive(intervalDays, 'intervalDays');
  const previous = ellipsoidVolume(previousDiametersMm);
  const current = ellipsoidVolume(currentDiametersMm);
  const volumeDeltaCm3 = current.volumeCm3 - previous.volumeCm3;
  const volumeChangePercent = (volumeDeltaCm3 / previous.volumeCm3) * 100;
  return {
    previous,
    current,
    intervalDays,
    meanDiameterDeltaMm: current.meanDiameterMm - previous.meanDiameterMm,
    volumeDeltaCm3,
    volumeChangePercent,
    annualizedLinearChangePercent: volumeChangePercent * (365 / intervalDays),
    caveatRu: 'Темп — линейная экстраполяция выбранного интервала, не прогноз и не диагностический критерий.',
  };
}

/** Resistive index. EDV may be negative when flow reversal is present. */
export function resistiveIndex(psv, edv) {
  positive(psv, 'psv');
  finite(edv, 'edv');
  if (edv > psv) throw new RangeError('edv cannot exceed psv');
  return (psv - edv) / psv;
}

/** Pulsatility index. TAMV is time-averaged maximum velocity, not mean diameter. */
export function pulsatilityIndex(psv, edv, tamv) {
  positive(psv, 'psv');
  finite(edv, 'edv');
  positive(tamv, 'tamv');
  if (edv > psv) throw new RangeError('edv cannot exceed psv');
  if (tamv > psv) throw new RangeError('tamv cannot exceed psv');
  return (psv - edv) / tamv;
}

export function dopplerIndices(psv, edv, tamv) {
  return {
    ri: resistiveIndex(psv, edv),
    pi: pulsatilityIndex(psv, edv, tamv),
    caveatRu: 'Нормативные пороги не заданы: интерпретировать с учётом сосуда, методики и клинического контекста.',
  };
}
