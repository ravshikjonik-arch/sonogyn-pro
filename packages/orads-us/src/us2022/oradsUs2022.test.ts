import assert from "node:assert/strict";
import test from "node:test";

import { evaluateOradsUs2022 } from "./evaluateOradsUs2022";
import type { OradsUs2022Input } from "./types";

const initial: OradsUs2022Input = {
  incomplete: false,
  menopause: "",
  morphology: "",
  classicType: "",
  sizeCm: null,
  cystContent: "simple",
  innerContour: "smooth",
  solidComponent: false,
  papillae: "0",
  colorScore: null,
  shadowing: false,
  outerContour: "smooth",
  extraSigns: "none",
};

const calc = (patch: Partial<OradsUs2022Input>) => evaluateOradsUs2022({ ...initial, ...patch });

const cases: Array<[string, Partial<OradsUs2022Input>, number | null]> = [
  ["Технически неполное исследование", { incomplete: true }, 0],
  ["Нормальный яичник", { morphology: "normal" }, 1],
  ["Простая киста 3 см в пременопаузе", { morphology: "unilocular", sizeCm: 3, menopause: "pre" }, 1],
  ["Простая киста 3 см в постменопаузе", { morphology: "unilocular", sizeCm: 3, menopause: "postLate" }, 2],
  ["Простая киста 9.9 см", { morphology: "unilocular", sizeCm: 9.9, menopause: "pre" }, 2],
  ["Простая киста 10 см", { morphology: "unilocular", sizeCm: 10, menopause: "pre" }, 3],
  ["Неровная однокамерная киста", { morphology: "unilocular", sizeCm: 4, innerContour: "irregular" }, 3],
  ["Двухкамерная киста 5 см", { morphology: "bilocular", sizeCm: 5 }, 2],
  ["Двухкамерная киста 10 см", { morphology: "bilocular", sizeCm: 10 }, 3],
  ["Многокамерная киста 5 см, CS 3", { morphology: "multilocular", sizeCm: 5, colorScore: 3 }, 3],
  ["Многокамерная киста 5 см, CS 4", { morphology: "multilocular", sizeCm: 5, colorScore: 4 }, 4],
  ["Многокамерная киста 10 см, CS 1", { morphology: "multilocular", sizeCm: 10, colorScore: 1 }, 4],
  ["Неровная многокамерная киста", { morphology: "multilocular", sizeCm: 5, innerContour: "irregular" }, 4],
  ["Однокамерная киста с солидным компонентом", { morphology: "unilocular", sizeCm: 5, solidComponent: true }, 4],
  [
    "Однокамерная киста с 4 папиллярными разрастаниями",
    { morphology: "unilocular", sizeCm: 5, solidComponent: true, papillae: "4+" },
    5,
  ],
  [
    "Многокамерная киста с солидным компонентом, CS 2",
    { morphology: "multilocular", sizeCm: 5, solidComponent: true, colorScore: 2 },
    4,
  ],
  [
    "Многокамерная киста с солидным компонентом, CS 3",
    { morphology: "multilocular", sizeCm: 5, solidComponent: true, colorScore: 3 },
    5,
  ],
  ["Солидное образование, CS 1", { morphology: "solid", sizeCm: 5, colorScore: 1 }, 3],
  ["Солидное образование с тенью, CS 3", { morphology: "solid", sizeCm: 5, colorScore: 3, shadowing: true }, 3],
  ["Солидное образование без тени, CS 2", { morphology: "solid", sizeCm: 5, colorScore: 2 }, 4],
  ["Солидное образование, CS 4", { morphology: "solid", sizeCm: 5, colorScore: 4 }, 5],
  ["Солидное образование с неровным контуром", { morphology: "solid", sizeCm: 5, outerContour: "irregular" }, 5],
  ["Дермоид 9 см", { morphology: "classic", classicType: "dermoid", sizeCm: 9 }, 2],
  ["Дермоид 10 см", { morphology: "classic", classicType: "dermoid", sizeCm: 10 }, 3],
  ["Параовариальная киста любого размера", { morphology: "classic", classicType: "paraovarian" }, 2],
  [
    "Асцит повышает O-RADS 3 до 5",
    { morphology: "unilocular", sizeCm: 4, innerContour: "irregular", extraSigns: "ascites" },
    5,
  ],
];

for (const [name, input, expected] of cases) {
  test(name, () => assert.equal(calc(input).category, expected));
}

test("Геморрагическая киста в поздней постменопаузе требует переклассификации", () => {
  const result = calc({
    morphology: "classic",
    classicType: "hemorrhagic",
    sizeCm: 4,
    menopause: "postLate",
  });
  assert.equal(result.category, null);
  assert.match(result.title, /переклассификация/i);
});

test("Асцит при простой кисте O-RADS 2 не повышает категорию", () => {
  const result = calc({
    morphology: "unilocular",
    sizeCm: 4,
    menopause: "pre",
    cystContent: "simple",
    extraSigns: "ascites",
  });
  assert.equal(result.category, 2);
  assert.match(result.warning ?? "", /не повышает/);
});

test("Простая киста: тактика зависит от размера и менопаузы", () => {
  const preSmall = calc({ morphology: "unilocular", sizeCm: 4, menopause: "pre", cystContent: "simple" });
  const postSmall = calc({ morphology: "unilocular", sizeCm: 4, menopause: "postEarly", cystContent: "simple" });
  const preLarge = calc({ morphology: "unilocular", sizeCm: 6, menopause: "pre", cystContent: "simple" });
  assert.equal(preSmall.category, 2);
  assert.match(preSmall.management, /не требуется/);
  assert.match(postSmall.management, /12 месяц/);
  assert.match(preLarge.management, /12 месяц/);
});

test("Непростая и двухкамерная гладкие кисты: контроль 6 месяцев", () => {
  const nonSimple = calc({
    morphology: "unilocular",
    sizeCm: 6,
    cystContent: "nonSimple",
    menopause: "pre",
  });
  const bilocular = calc({ morphology: "bilocular", sizeCm: 2 });
  assert.match(nonSimple.management, /6 месяц/);
  assert.equal(bilocular.category, 2);
  assert.match(bilocular.management, /6 месяц/);
});

test("Геморрагическая киста в ранней постменопаузе — O-RADS 2", () => {
  assert.equal(
    calc({ morphology: "classic", classicType: "hemorrhagic", sizeCm: 4, menopause: "postEarly" }).category,
    2,
  );
});
