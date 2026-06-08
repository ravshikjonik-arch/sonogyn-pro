# Smoke Test Protocol (RC 1.1.0)

## Environment

- Device 1: iOS (real or simulator)
- Device 2: Android (real or emulator)
- Network modes: online + airplane mode

## A. O-RADS Pro (10 scenarios)

1. Open O-RADS Pro from feed and verify single-screen layout.
2. `pre + physiological + follicle <=3 cm` -> expect O-RADS 1.
3. `post + unilocular simple + >5 cm` -> expect O-RADS 3.
4. `multilocular + solid component + moderate flow` -> expect O-RADS >=4.
5. `solid irregular + marked flow` -> expect O-RADS 5.
6. Add ascites to moderate case -> category not below O-RADS 4.
7. Add peritoneal nodules + ascites -> expect O-RADS 5.
8. Export report button copies formatted text to clipboard.
9. Reset clears all fields and TTFR current-session metric.
10. History route opens and latest case appears.

## B. O-RADS Offline + AI Queue (6 scenarios)

1. Turn on airplane mode and press `Мнение AI (Beta)` -> queued message shown.
2. Verify queue size increments and badge shows failed/pending states.
3. Re-enable network; wait retry cycle -> queued item is flushed.
4. Verify source marker transitions (`queued_store` -> `queued_flush` / `live`).
5. Confirm retry hint shows next retry delay and last error when failing.
6. Queue persists after app restart.

## C. History + Template (5 scenarios)

1. Filter by O-RADS 4-5.
2. Enable `Критичные`.
3. Sort by `риск`.
4. Open details screen from list.
5. Use `Как шаблон` / `Дублировать как новый кейс` and verify prefill.

## D. BI-RADS Regression (6 scenarios)

1. Open BI-RADS flow/screen from current app path.
2. Typical benign pattern -> low category.
3. Suspicious signs (irregular/non-parallel/marked flow) -> higher category.
4. Decision path text renders complete.
5. BI-RADS ruleset version displayed correctly.
6. No crashes or route mismatches after O-RADS Pro integration.

## Exit Criteria

- All scenarios pass on iOS and Android.
- No blocker/critical issues.
- Any algorithm discrepancy is logged with exact input snapshot and expected output.
