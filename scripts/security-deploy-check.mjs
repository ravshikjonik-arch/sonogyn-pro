#!/usr/bin/env node
import fs from "fs";

const checks = [];

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function assertCheck(name, ok, detail = "") {
  checks.push({ name, ok, detail });
}

const webPkg = JSON.parse(read("apps/web/package.json"));
const mobilePkg = JSON.parse(read("apps/mobile/package.json"));
const deps = {
  ...webPkg.dependencies,
  ...webPkg.devDependencies,
  ...mobilePkg.dependencies,
  ...mobilePkg.devDependencies,
};

assertCheck(
  "No GraphQL server dependency",
  !Object.keys(deps).some((name) => /graphql|apollo|yoga|mercurius/i.test(name)),
  "Add query depth/cost limits before introducing GraphQL.",
);

const middleware = read("apps/web/middleware.ts");
assertCheck("API bot-detection middleware is wired", middleware.includes("shouldBlockSuspiciousApiBot"));

const prodSecrets = read("apps/web/lib/security/production-secrets.ts");
assertCheck("Production blocks relaxed auth rate limits", prodSecrets.includes("AUTH_RATE_LIMIT_RELAXED"));
assertCheck("Production blocks disabled bot detection", prodSecrets.includes("BOT_DETECTION_ENABLED"));
assertCheck("Production requires security alert webhook", prodSecrets.includes("SECURITY_ALERT_WEBHOOK_URL"));

const safeLog = read("apps/web/lib/security/safeLog.ts");
assertCheck("Web safeLog uses telemetry redaction", safeLog.includes("redactTelemetryContext"));

const appJson = JSON.parse(read("apps/mobile/app.json"));
assertCheck("Android cleartext traffic disabled", appJson.expo?.android?.usesCleartextTraffic === false);
assertCheck("Android unencrypted OS backup disabled", appJson.expo?.android?.allowBackup === false);
assertCheck(
  "iOS ATS arbitrary loads disabled",
  appJson.expo?.ios?.infoPlist?.NSAppTransportSecurity?.NSAllowsArbitraryLoads === false,
);

const mobileRedactionExists = fs.existsSync("apps/mobile/src/lib/security/piiRedaction.ts");
assertCheck("Mobile PII redaction utility exists", mobileRedactionExists);

const failed = checks.filter((check) => !check.ok);
for (const check of checks) {
  console.log(`${check.ok ? "✓" : "✗"} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
}

if (failed.length) {
  console.error(`\nSecurity deploy check failed: ${failed.length} issue(s).`);
  process.exit(1);
}
