import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { completeness } from "../completeness";
import { emptyT1Fields, emptyT2Fields } from "../fields";
import { renderProtocolText, renderT1ProtocolText } from "../render";
import { resolveGuidedProtocol } from "../resolve";
import { getStepsForWindow } from "../steps";
import { resolveGuidedWindow, gaDaysFromWeeksDays } from "../windows";

describe("resolveGuidedWindow", () => {
  it("maps 12+4 to t1_screening", () => {
    const r = resolveGuidedWindow(gaDaysFromWeeksDays(12, 4));
    assert.equal(r.windowId, "t1_screening");
    assert.equal(r.outsidePrimaryWindow, false);
  });

  it("maps 20+1 to t2_anomaly", () => {
    const r = resolveGuidedWindow(gaDaysFromWeeksDays(20, 1));
    assert.equal(r.windowId, "t2_anomaly");
  });

  it("maps 30+0 to t3_growth", () => {
    const r = resolveGuidedWindow(gaDaysFromWeeksDays(30, 0));
    assert.equal(r.windowId, "t3_growth");
  });

  it("flags between_windows for 16+0", () => {
    const r = resolveGuidedWindow(gaDaysFromWeeksDays(16, 0));
    assert.equal(r.windowId, "between_windows");
    assert.ok(r.bannerRu);
  });
});

describe("step order", () => {
  it("T1 steps are strictly ordered and start with header", () => {
    const steps = getStepsForWindow("t1_screening");
    assert.ok(steps.length >= 10);
    for (let i = 1; i < steps.length; i++) {
      assert.ok(steps[i]!.order > steps[i - 1]!.order);
    }
    assert.equal(steps[0]!.id, "t1-header");
    assert.ok(steps.some((s) => s.kind === "red_flag"));
  });
});

describe("resolveGuidedProtocol", () => {
  it("returns T1 empty fields for screening GA", () => {
    const r = resolveGuidedProtocol({ gaWeeks: 12, gaDaysPart: 4 });
    assert.ok(!("error" in r));
    if ("error" in r) return;
    assert.equal(r.catalogWindowId, "t1_screening");
    assert.ok("crlMm" in r.emptyFields);
  });

  it("errors without GA", () => {
    const r = resolveGuidedProtocol({});
    assert.ok("error" in r);
  });
});

describe("completeness + render", () => {
  it("blank T1 protocol contains placeholders and disclaimer", () => {
    const text = renderT1ProtocolText(emptyT1Fields(), "12+4");
    assert.ok(text.includes("___"));
    assert.ok(text.includes("CDS"));
    assert.ok(text.includes("I пренатальный"));
  });

  it("completeness 0 on empty required T1", () => {
    const steps = getStepsForWindow("t1_screening");
    const c = completeness(emptyT1Fields(), steps);
    assert.equal(c.percent, 0);
    assert.ok(c.requiredTotal > 0);
  });

  it("renderProtocolText routes T2", () => {
    const text = renderProtocolText(emptyT2Fields(), "t2_anomaly", "20+1");
    assert.ok(text.includes("Фетометрия"));
    assert.ok(text.includes("___"));
  });
});
