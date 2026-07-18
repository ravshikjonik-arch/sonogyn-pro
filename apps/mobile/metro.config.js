// @ts-check
const fs = require("fs");
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const packagesRoot = path.resolve(workspaceRoot, "packages");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...config.watchFolders, workspaceRoot];

const mobileNm = path.resolve(projectRoot, "node_modules");

config.resolver.nodeModulesPaths = [
  mobileNm,
  path.resolve(workspaceRoot, "node_modules"),
];

/** Resolve @repo/* workspace packages (Metro не читает exports из pnpm hoisted link). */
function resolveWorkspacePackage(moduleName) {
  if (!moduleName.startsWith("@repo/")) return null;

  const rest = moduleName.slice("@repo/".length);
  const slashIdx = rest.indexOf("/");
  const pkgName = slashIdx === -1 ? rest : rest.slice(0, slashIdx);
  const subpath = slashIdx === -1 ? "." : `./${rest.slice(slashIdx + 1)}`;

  const pkgDir = path.join(packagesRoot, pkgName);
  const pkgJsonPath = path.join(pkgDir, "package.json");
  if (!fs.existsSync(pkgJsonPath)) return null;

  const pkgJson = require(pkgJsonPath);
  const exportsMap = pkgJson.exports;
  let target = exportsMap?.[subpath];
  if (!target && subpath === ".") {
    target = exportsMap?.["."] ?? pkgJson.main ?? "./src/index.ts";
  }
  if (!target) return null;

  const filePath = path.resolve(pkgDir, target);
  if (!fs.existsSync(filePath)) return null;
  return { type: "sourceFile", filePath };
}

/** Force resolution from apps/mobile/node_modules (RN-paired react), not repo root (Next). */
function resolveFromMobileOrNull(moduleName) {
  const searchPaths = [mobileNm, path.resolve(workspaceRoot, "node_modules")];
  try {
    const filePath = require.resolve(moduleName, { paths: searchPaths });
    return { type: "sourceFile", filePath };
  } catch {
    return null;
  }
}

function resolveThreeModule() {
  const candidates = [
    path.join(mobileNm, "three/build/three.module.js"),
    path.join(workspaceRoot, "node_modules/three/build/three.module.js"),
  ];
  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) return { type: "sourceFile", filePath };
  }
  return null;
}

function resolveZustandCjs(moduleName) {
  if (moduleName !== "zustand" && !moduleName.startsWith("zustand/")) return null;

  const suffix = moduleName === "zustand" ? "index" : moduleName.slice("zustand/".length);
  const candidates = [
    path.join(mobileNm, "zustand", `${suffix}.js`),
    path.join(workspaceRoot, "node_modules/zustand", `${suffix}.js`),
  ];
  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) return { type: "sourceFile", filePath };
  }
  return null;
}

function mustPinToMobile(moduleName) {
  return (
    moduleName === "react" ||
    moduleName.startsWith("react/") ||
    moduleName === "react-dom" ||
    moduleName.startsWith("react-dom/") ||
    moduleName === "scheduler" ||
    moduleName.startsWith("scheduler/") ||
    moduleName === "use-sync-external-store" ||
    moduleName.startsWith("use-sync-external-store/") ||
    moduleName === "zustand" ||
    moduleName.startsWith("zustand/") ||
    moduleName === "three" ||
    moduleName.startsWith("three/")
  );
}

const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const zustand = resolveZustandCjs(moduleName);
  if (zustand) return zustand;
  if (moduleName === "three" || moduleName === "three/build/three.module.js") {
    const three = resolveThreeModule();
    if (three) return three;
  }
  if (mustPinToMobile(moduleName)) {
    const pinned = resolveFromMobileOrNull(moduleName);
    if (pinned) return pinned;
  }
  const workspace = resolveWorkspacePackage(moduleName);
  if (workspace) return workspace;
  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  react: path.resolve(workspaceRoot, "node_modules/react"),
  "react-dom": path.resolve(workspaceRoot, "node_modules/react-dom"),
  scheduler: path.resolve(workspaceRoot, "node_modules/scheduler"),
  "use-sync-external-store": path.resolve(workspaceRoot, "node_modules/use-sync-external-store"),
  zustand: path.resolve(workspaceRoot, "node_modules/zustand"),
  three: path.resolve(workspaceRoot, "node_modules/three"),
};

// React version must match react-native-renderer inside RN (0.81.x → react 19.1.0).

if (!config.resolver.assetExts.includes("glb")) {
  config.resolver.assetExts.push("glb", "gltf");
}

module.exports = config;
