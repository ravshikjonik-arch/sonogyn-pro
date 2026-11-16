/**
 * Smoke: FIGO 0 / 2 / 4 / 7 через hit-test слоёв.
 * Запуск: pnpm --filter @repo/clinical-3d exec tsx src/organs/uterus/uterusLayerAnatomy.smoke.ts
 */

import {
  buildUterusProtocolBlock,
  coronalToSagittal,
  hitUterusLayer,
  markerTo3dAnchor,
  resolveFigoForMarker,
  type UterusLesionMarker,
} from "./uterusLayerAnatomy";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function marker(
  partial: Pick<UterusLesionMarker, "id" | "coronal" | "diameterMm" | "pedunculated">,
): UterusLesionMarker {
  return {
    kind: "myoma",
    sagittal: coronalToSagittal(partial.coronal),
    ...partial,
  };
}

const cases: { name: string; expect: number; m: UterusLesionMarker }[] = [
  {
    name: "FIGO 0 — полость на ножке",
    expect: 0,
    m: marker({
      id: "f0",
      coronal: { x: 0.5, y: 0.4 },
      diameterMm: 20,
      pedunculated: true,
    }),
  },
  {
    name: "FIGO 2 — эндометрий глубже (≥50% интрамурально)",
    expect: 2,
    m: marker({
      id: "f2",
      // Чуть кнаружи от полости → endometrium с depth01 ≥ 0.26
      coronal: { x: 0.5, y: 0.4 + 0.14 * 1.12 },
      diameterMm: 35,
      pedunculated: false,
    }),
  },
  {
    name: "FIGO 4 — средний миометрий",
    expect: 4,
    m: marker({
      id: "f4",
      coronal: { x: 0.65, y: 0.42 },
      diameterMm: 30,
      pedunculated: false,
    }),
  },
  {
    name: "FIGO 7 — субсерозно на ножке",
    expect: 7,
    m: marker({
      id: "f7",
      coronal: { x: 0.5, y: 0.12 },
      diameterMm: 28,
      pedunculated: true,
    }),
  },
];

let failed = 0;
for (const c of cases) {
  const hit = hitUterusLayer(c.m.coronal, "coronal", c.m.diameterMm, c.m.pedunculated);
  const figo = resolveFigoForMarker(c.m, "coronal");
  const ok = figo === c.expect;
  // eslint-disable-next-line no-console
  console.log(
    `${ok ? "✓" : "✗"} ${c.name}: got FIGO ${figo} (layer=${hit.layer}, depth=${hit.depth01.toFixed(2)}, zone=${hit.zone})`,
  );
  if (!ok) failed += 1;
}

const sync = marker({
  id: "sync",
  coronal: { x: 0.42, y: 0.45 },
  diameterMm: 32,
  pedunculated: false,
});
const sagFigo = resolveFigoForMarker(sync, "sagittal");
const corFigo = resolveFigoForMarker(sync, "coronal");
assert(typeof sagFigo === "number" && typeof corFigo === "number", "sync figo numbers");
const protocol = buildUterusProtocolBlock([cases[0]!.m, cases[2]!.m], "coronal");
assert(protocol.includes("FIGO"), "protocol mentions FIGO");
const anchor = markerTo3dAnchor(cases[0]!.m, "coronal");
assert(anchor.depth01 >= 0 && anchor.axial01 >= 0, "3d anchor");

if (failed > 0) {
  // eslint-disable-next-line no-console
  console.error(`Smoke failed: ${failed} case(s)`);
  process.exit(1);
}
// eslint-disable-next-line no-console
console.log("uterusLayerAnatomy smoke OK");
