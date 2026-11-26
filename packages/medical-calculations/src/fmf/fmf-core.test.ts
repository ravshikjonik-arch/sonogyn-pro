import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bwZ,
  cprZ,
  daveBwZ,
  dvpiZ,
  expectedCpr,
  expectedDvpi,
  expectedFw,
  expectedHb,
  expectedMca,
  expectedMcaPsv,
  expectedUa,
  expectedUtpi,
  fhrDelta,
  fwZ,
  gaFromCrl,
  gaFromHc,
  mcaPsvZ,
  mcaZ,
  ntCentile,
  ntDelta,
  ntMedian,
  uaZ,
  utpiZ,
} from "./fmf-core.ts";

const near = (a: number | null, b: number, eps = 1e-9) =>
  assert.ok(a !== null && Math.abs(a - b) <= Math.max(eps, Math.abs(b) * 1e-9), `${a} ~ ${b}`);

// Values verified against archive.fetalmedicine.org (2026-11-26), 33/33 exact.
test("dating CRL/HC", () => {
  near(gaFromCrl(63)!, 88.61237892873922);
  near(gaFromCrl(45)!, 78.53464945947752);
  near(gaFromCrl(84)!, 98.68065798801763);
  near(gaFromHc(155)!, 131.51472505854554);
  near(gaFromHc(200)!, 158.4490722701967);
  assert.equal(gaFromCrl(100), null);
  assert.equal(gaFromHc(120), null);
});

test("NT mixture (Wright 2008)", () => {
  near(ntMedian(63)!, 1.729486594164418);
  near(ntDelta(1.5, 63)!, -0.229486594164417);
  assert.equal(ntCentile(1.5, 63), 23);
  assert.equal(ntCentile(2.5, 63), 95);
  assert.equal(ntCentile(3.6, 63), 99);
  // FMF archive UI may show «<5»; mixture floor = 21 mm at CRL 45 (verified numerically).
  assert.equal(ntCentile(1.0, 45), 21);
  assert.equal(ntCentile(2.2, 84), 70);
});

test("FHR", () => {
  near(fhrDelta(155, 84)!, -8.351992000000052);
});

test("EFW / weight charts (Wright 2018)", () => {
  near(expectedFw(210)!, 1504.8099867850738);
  near(fwZ(330, 210)!, -18.0621719087218);
  near(fwZ(500, 252)!, -19.06128055942742);
  near(daveBwZ(3000, 266)!, -0.390452861273775);
  near(bwZ(1600, 30)!, 1.0271181978090345);
  near(bwZ(3500, 40)!, 0.0977347033257736);
});

test("Doppler PI ranges", () => {
  near(expectedUa(168)!, 1.1426041420000002);
  near(uaZ(1.1, 168)!, -0.257031221643746);
  near(expectedMca(168)!, 1.6818909183921207);
  near(mcaZ(1.6, 168)!, -0.341437122168457);
  near(expectedCpr(168)!, 1.4924130731646552);
  near(cprZ(1.45, 168)!, -0.152889695727315);
  near(expectedUtpi(154)!, 1.0188624244246487);
  near(utpiZ(1.2, 154)!, 0.6105370260653391);
  near(expectedDvpi(196)!, 0.50339025);
  near(dvpiZ(1.0, 196)!, 3.1371490280777534);
});

test("Fetal anemia", () => {
  near(expectedMcaPsv(24)!, 31.49198239602285);
  near(mcaPsvZ(42, 24)!, 1.5848038018198196);
  near(expectedHb(24)!, 12.46);
});