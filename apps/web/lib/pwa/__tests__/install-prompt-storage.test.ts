import assert from "node:assert/strict";
import test from "node:test";

import {
  PWA_INSTALL_CADENCE_MS,
  shouldShowAutoInstallPrompt,
} from "../install-prompt-storage";

test("shouldShowAutoInstallPrompt allows first show", () => {
  assert.equal(shouldShowAutoInstallPrompt(1_000_000, null), true);
});

test("shouldShowAutoInstallPrompt respects 7-day cadence", () => {
  const now = 10_000_000;
  const dismissed = now - PWA_INSTALL_CADENCE_MS + 1;
  assert.equal(shouldShowAutoInstallPrompt(now, dismissed), false);

  const oldEnough = now - PWA_INSTALL_CADENCE_MS;
  assert.equal(shouldShowAutoInstallPrompt(now, oldEnough), true);
});
