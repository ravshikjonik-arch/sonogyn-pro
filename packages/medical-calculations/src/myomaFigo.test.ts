import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyMyomaFigo } from "./myomaFigo.js";
import { FIGO_CITATION } from "./myomaFigo.js";

describe("myomaFigo: классификация миомы по системе FIGO 0–8", () => {
  it("тип 0: подслизистый на ножке без интрамурального компонента", () => {
    const r = classifyMyomaFigo({ primaryLocation: "submucosal", pedunculatedIntracavitary: true });
    assert.equal(r!.figoType, 0);
    assert.ok(r!.label.includes("FIGO 0"));
    assert.equal(r!.category, "submucosal");
    assert.ok(r!.managementNotes[0].includes("полости"));
  });

  it("тип 1/2: подслизистый с интрамуральным компонентом <50% и ≥50%", () => {
    assert.equal(classifyMyomaFigo({ primaryLocation: "submucosal", pedunculatedIntracavitary: false, intramuralExtension: "less50" })!.figoType, 1);
    assert.equal(classifyMyomaFigo({ primaryLocation: "submucosal", pedunculatedIntracavitary: false, intramuralExtension: "ge50" })!.figoType, 2);
  });

  it("тип 3/4: интрамуральный с контактом с эндометрием и без", () => {
    assert.equal(classifyMyomaFigo({ primaryLocation: "intramural", contactsEndometrium: true })!.figoType, 3);
    assert.equal(classifyMyomaFigo({ primaryLocation: "intramural", contactsEndometrium: false })!.figoType, 4);
  });

  it("тип 5/6/7: субсерозные", () => {
    assert.equal(classifyMyomaFigo({ primaryLocation: "subserosal", pedunculatedSubserosal: false, subserosalExtension: "ge50" })!.figoType, 5);
    assert.equal(classifyMyomaFigo({ primaryLocation: "subserosal", pedunculatedSubserosal: false, subserosalExtension: "less50" })!.figoType, 6);
    assert.equal(classifyMyomaFigo({ primaryLocation: "subserosal", pedunculatedSubserosal: true })!.figoType, 7);
  });

  it("тип 8: шеечный/паразитирующий", () => {
    const r = classifyMyomaFigo({ primaryLocation: "cervical_or_parasitic" });
    assert.equal(r!.figoType, 8);
    assert.ok(r!.managementNotes[0].includes("Тип 8"));
  });

  it("не хватает ветвного признака → null (переспросить, не додумывать)", () => {
    assert.equal(classifyMyomaFigo({ primaryLocation: "intramural" }), null);
    assert.equal(classifyMyomaFigo({ primaryLocation: "submucosal" }), null);
    assert.equal(classifyMyomaFigo({ primaryLocation: "submucosal", pedunculatedIntracavitary: false }), null);
    assert.equal(classifyMyomaFigo({ primaryLocation: "subserosal" }), null);
    assert.equal(classifyMyomaFigo({ primaryLocation: "subserosal", pedunculatedSubserosal: false }), null);
  });

  it("атрибуция FIGO 2018 присутствует", () => {
    assert.equal(FIGO_CITATION.organization, "FIGO");
    assert.equal(FIGO_CITATION.year, 2018);
    assert.ok(FIGO_CITATION.document.includes("FIGO"));
  });
});
