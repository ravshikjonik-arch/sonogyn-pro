import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildPublicMetadata,
  stripTrailingBrand,
  truncateAtWord,
} from "@/lib/seo/build-public-metadata";

describe("stripTrailingBrand", () => {
  it("removes · SonoGyn Pro suffix", () => {
    assert.equal(stripTrailingBrand("O-RADS US · комната · SonoGyn Pro"), "O-RADS US · комната");
  });

  it("leaves plain title", () => {
    assert.equal(stripTrailingBrand("Калькулятор O-RADS US онлайн"), "Калькулятор O-RADS US онлайн");
  });
});

describe("truncateAtWord", () => {
  it("keeps short text", () => {
    assert.equal(truncateAtWord("короткий текст", 60), "короткий текст");
  });

  it("cuts on word boundary", () => {
    const long =
      "Пошаговый калькулятор O-RADS US v2022 и IOTA для оценки аднексальных образований на УЗИ для врачей";
    const out = truncateAtWord(long, 60);
    assert.ok(out.length <= 60);
    assert.ok(!out.endsWith(" "));
    assert.ok(long.startsWith(out));
  });
});

describe("buildPublicMetadata", () => {
  it("sets absolute canonical and strips brand for template", () => {
    const meta = buildPublicMetadata({
      title: "O-RADS US · комната · SonoGyn Pro",
      description: "Одна комната ACR O-RADS US v2022.",
      path: "/tools/o-rads",
    });
    assert.equal(meta.title, "O-RADS US · комната");
    assert.equal(meta.alternates?.canonical, "https://sonogyn-pro.ru/tools/o-rads");
    assert.ok(typeof meta.description === "string");
    assert.ok((meta.description as string).length <= 155);
  });

  it("supports noindex", () => {
    const meta = buildPublicMetadata({
      title: "Профиль",
      description: "Кабинет",
      path: "/profile",
      noindex: true,
      skipCdsDisclaimer: true,
    });
    assert.deepEqual(meta.robots, { index: false, follow: false });
  });
});
