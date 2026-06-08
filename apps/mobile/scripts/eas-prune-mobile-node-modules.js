/**
 * EAS + pnpm hoisted monorepo: apps/mobile/node_modules may duplicate root native deps.
 * Android autolinking then compiles the same module twice → Gradle "Duplicate class".
 */
const fs = require("fs");
const path = require("path");

const mobileRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(mobileRoot, "../..");
const mobileNm = path.join(mobileRoot, "node_modules");
const rootNm = path.join(repoRoot, "node_modules");

if (!fs.existsSync(mobileNm) || !fs.existsSync(rootNm)) {
  process.exit(0);
}

const dupePackages = [
  "expo",
  "react-native",
  "@expo/vector-icons",
  "@expo/fingerprint",
  "expo-asset",
  "expo-constants",
  "expo-file-system",
  "expo-font",
  "expo-keep-awake",
  "expo-modules-core",
];

for (const pkg of dupePackages) {
  const inMobile = path.join(mobileNm, pkg);
  const inRoot = path.join(rootNm, pkg);
  if (fs.existsSync(inMobile) && fs.existsSync(inRoot)) {
    fs.rmSync(inMobile, { recursive: true, force: true });
    console.log(`[eas-post-install] removed duplicate ${pkg} from apps/mobile/node_modules`);
  }
}
