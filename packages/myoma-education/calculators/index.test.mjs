import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ellipsoidVolume,
  intramuralComponent,
  classifySubmucosalByIntramuralPercent,
  classifySubserosalByIntramuralPercent,
  classifyFigo,
  hybridFigo,
  growthDynamics,
  dopplerIndices,
} from './index.mjs';

const close = (actual, expected, tolerance = 1e-8) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
};

test('ellipsoid volume and mean diameter', () => {
  const result = ellipsoidVolume([30, 25, 20]);
  close(result.volumeCm3, 7.853981633974483);
  close(result.meanDiameterMm, 25);
});

test('volume rejects missing and non-positive diameters', () => {
  assert.throws(() => ellipsoidVolume([30, 20]), /exactly three/);
  assert.throws(() => ellipsoidVolume([30, 0, 20]), /greater than 0/);
});

test('intramural component uses mean diameter', () => {
  close(intramuralComponent(40, 20), 50);
  assert.throws(() => intramuralComponent(40, 41), /between 0/);
});

test('FIGO exact 50% boundaries', () => {
  assert.equal(classifySubmucosalByIntramuralPercent(49.999).figo, '1');
  assert.equal(classifySubmucosalByIntramuralPercent(50).figo, '2');
  assert.equal(classifySubserosalByIntramuralPercent(50).figo, '5');
  assert.equal(classifySubserosalByIntramuralPercent(49.999).figo, '6');
});

test('FIGO structured questionnaire', () => {
  assert.equal(classifyFigo({ location: 'intracavitary', pedunculated: true }).figo, '0');
  assert.equal(classifyFigo({ location: 'intramural', contactsEndometrium: true }).figo, '3');
  assert.equal(classifyFigo({ location: 'intramural' }).figo, '4');
  assert.equal(classifyFigo({ location: 'subserosal', pedunculated: true }).figo, '7');
  assert.equal(classifyFigo({ location: 'other' }).figo, '8');
});

test('hybrid notation order', () => {
  assert.equal(hybridFigo(2, 5).figo, '2–5');
  assert.throws(() => hybridFigo(5, 2), /endometrialType/);
});

test('growth dynamics example', () => {
  const result = growthDynamics([30, 25, 20], [36, 30, 24], 180);
  close(result.previous.volumeCm3, 7.853981633974483);
  close(result.current.volumeCm3, 13.57168026330783);
  close(result.volumeChangePercent, 72.8);
  close(result.annualizedLinearChangePercent, 147.62222222222223);
});

test('Doppler indices example and validation', () => {
  const result = dopplerIndices(40, 10, 20);
  close(result.ri, 0.75);
  close(result.pi, 1.5);
  assert.throws(() => dopplerIndices(0, 10, 20), /greater than 0/);
  assert.throws(() => dopplerIndices(40, 50, 20), /cannot exceed/);
});
