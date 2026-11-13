import assert from "node:assert/strict";
import test from "node:test";

import {
  PWA_INSTALL_CADENCE_MS,
  PWA_INSTALL_MIN_VISITS,
  shouldShowAutoInstallPrompt,
} from "../install-prompt-storage";

test("shouldShowAutoInstallPrompt hides on first visit", () => {
  assert.equal(shouldShowAutoInstallPrompt(1_000_000, null, PWA_INSTALL_CADENCE_MS, 1), false);
});

test("shouldShowAutoInstallPrompt allows first show after min visits", () => {
  assert.equal(
    shouldShowAutoInstallPrompt(1_000_000, null, PWA_INSTALL_CADENCE_MS, PWA_INSTALL_MIN_VISITS),
    true,
  );
});

test("shouldShowAutoInstallPrompt respects 14-day cadence", () => {
  const now = 10_000_000_000;
  const visits = PWA_INSTALL_MIN_VISITS;
  const dismissed = now - PWA_INSTALL_CADENCE_MS + 1;
  assert.equal(shouldShowAutoInstallPrompt(now, dismissed, PWA_INSTALL_CADENCE_MS, visits), false);

  const oldEnough = now - PWA_INSTALL_CADENCE_MS;
  assert.equal(shouldShowAutoInstallPrompt(now, oldEnough, PWA_INSTALL_CADENCE_MS, visits), true);
});
