const fs = require("node:fs");
const path = require("node:path");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function assertVersion(version) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`Invalid version "${version}". Use format x.y.z (e.g. 0.1.0).`);
  }
}

function main() {
  const version = process.argv[2];
  assertVersion(version);

  const root = process.cwd();
  const packagePath = path.join(root, "package.json");
  const appPath = path.join(root, "app.json");

  const pkg = readJson(packagePath);
  const app = readJson(appPath);

  pkg.version = version;
  app.expo.version = version;

  const currentBuildNumber = Number(app.expo.ios?.buildNumber ?? "0");
  const currentVersionCode = Number(app.expo.android?.versionCode ?? 0);

  if (!app.expo.ios) app.expo.ios = {};
  if (!app.expo.android) app.expo.android = {};

  app.expo.ios.buildNumber = String(Math.max(0, currentBuildNumber) + 1);
  app.expo.android.versionCode = Math.max(0, currentVersionCode) + 1;

  writeJson(packagePath, pkg);
  writeJson(appPath, app);

  const swPath = path.join(root, "public", "sw.js");
  if (fs.existsSync(swPath)) {
    let sw = fs.readFileSync(swPath, "utf8");
    const next = sw.replace(/const CACHE_VERSION = "pwa-ag-us-v(\d+)"/, (_, n) => {
      const v = Number(n);
      return `const CACHE_VERSION = "pwa-ag-us-v${Number.isFinite(v) ? v + 1 : 1}"`;
    });
    if (next !== sw) {
      fs.writeFileSync(swPath, next, "utf8");
      const m = next.match(/const CACHE_VERSION = "([^"]+)"/);
      console.log(`PWA CACHE_VERSION -> ${m ? m[1] : "updated"}`);
    }
  }

  console.log(`Version set to ${version}`);
  console.log(`iOS buildNumber -> ${app.expo.ios.buildNumber}`);
  console.log(`Android versionCode -> ${app.expo.android.versionCode}`);
}

main();
