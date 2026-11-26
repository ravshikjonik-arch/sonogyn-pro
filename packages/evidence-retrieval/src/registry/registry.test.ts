import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  REGISTRY,
  registryCategories,
  registryClassificationByKey,
  registryClassifications,
  registryOrganizationByAbbr,
  registryOrganizations,
  validateChunkAttribution,
} from "./registry";

describe("international-standards registry", () => {
  it("contains 50+ organizations with unique abbreviations", () => {
    const orgs = registryOrganizations();
    assert.ok(orgs.length >= 50, `ожидалось ≥50 организаций, получено ${orgs.length}`);
    const abbrs = orgs.map((o) => o.abbr);
    assert.equal(new Set(abbrs).size, abbrs.length, "дубликаты аббревиатур");
  });

  it("tier is always 1|2|3 and cats reference known categories", () => {
    const catIds = new Set(registryCategories().map((c) => c.id));
    for (const o of registryOrganizations()) {
      assert.ok([1, 2, 3].includes(o.tier), `${o.abbr}: tier=${o.tier}`);
      for (const c of o.cats) assert.ok(catIds.has(c), `${o.abbr}: неизвестная категория ${c}`);
    }
    for (const cl of registryClassifications()) {
      for (const c of cl.cats) assert.ok(catIds.has(c), `${cl.key}: неизвестная категория ${c}`);
    }
  });

  it("all key RADS/IOTA/FIGO classifications present with platform mapping", () => {
    for (const key of ["o-rads-us", "bi-rads", "ti-rads-acr", "iota-adnex", "figo-leiomyoma", "palm-coein", "bishop"]) {
      const cl = registryClassificationByKey(key);
      assert.ok(cl, `нет классификации ${key}`);
      assert.ok(cl!.status.length > 0);
    }
    assert.match(registryClassificationByKey("figo-leiomyoma")!.platform_module!, /mapping\/uterus/);
    assert.match(registryClassificationByKey("bishop")!.platform_module!, /bishop\.ts/);
  });

  it("priority fill order starts with ISUOG", () => {
    assert.match(REGISTRY.priority_fill_order[0], /ISUOG/);
    assert.ok(REGISTRY.priority_fill_order.length >= 9);
  });

  it("copyright note is explicit", () => {
    assert.match(REGISTRY.meta.copyright_note, /НЕ да[её]т права копировать/);
  });

  it("chunk attribution validation enforces the golden rule", () => {
    assert.equal(validateChunkAttribution({ organization: "ISUOG" }), null);
    assert.equal(validateChunkAttribution({ organization: "МЗ РФ" }), null);
    assert.match(
      validateChunkAttribution({ organization: "Кто-то" })!,
      /отсутствует в реестре/,
    );
    assert.match(validateChunkAttribution({})!, /без organization/);
  });

  it("lookup helpers resolve", () => {
    assert.equal(registryOrganizationByAbbr("ACR")?.tier, 1);
    assert.ok(registryOrganizations({ category: "us" }).length >= 4);
    assert.ok(registryClassifications({ category: "gyn" }).length >= 5);
  });
});
