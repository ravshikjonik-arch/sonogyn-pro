import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { KnowledgeLink } from "@repo/clinical-tools";

import { mergeKnowledgeLinks } from "./knowledge-graph-links";

describe("mergeKnowledgeLinks", () => {
  it("returns code-only when DB empty", () => {
    const { links, source } = mergeKnowledgeLinks("nosology", "endometrioma", [], [
      { kind: "calculator", title: "O-RADS", href: "/tools/calc/rads/o-rads" },
    ]);
    assert.equal(source, "code");
    assert.equal(links.length, 1);
  });

  it("merges DB rows with code fallback by href", () => {
    const db = [
      {
        id: "00000000-0000-4000-8000-000000000001",
        from_type: "nosology",
        from_id: "endometrioma",
        relation: "related_tool",
        to_type: "web_route",
        to_id: "/tools/calc/rads/o-rads",
        weight: 1,
        meta: { kind: "calculator", title: "O-RADS US v2022" },
      },
    ];
    const code: KnowledgeLink[] = [
      { kind: "calculator", title: "O-RADS US v2022", href: "/tools/calc/rads/o-rads" },
      { kind: "atlas", title: "Atlas", href: "/tools/refs/orads-echograms" },
    ];
    const { links, source } = mergeKnowledgeLinks("nosology", "endometrioma", db, code);
    assert.equal(source, "merged");
    assert.equal(links.length, 2);
    assert.ok(links.some((l) => l.href.includes("orads-echograms")));
  });
});
