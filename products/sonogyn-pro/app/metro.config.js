// @ts-check
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...config.watchFolders, workspaceRoot];

const mobileNm = path.resolve(projectRoot, "node_modules");

config.resolver.nodeModulesPaths = [
  mobileNm,
  path.resolve(workspaceRoot, "node_modules"),
];

/** Force resolution from apps/mobile/node_modules (RN-paired react), not repo root (Next). */
function resolveFromMobileOrNull(moduleName) {
  try {
    const filePath = require.resolve(moduleName, { paths: [mobileNm] });
    return { type: "sourceFile", filePath };
  } catch {
    return null;
  }
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
    moduleName === "three" ||
    moduleName.startsWith("three/")
  );
}

const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (mustPinToMobile(moduleName)) {
    const pinned = resolveFromMobileOrNull(moduleName);
    if (pinned) return pinned;
  }
  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  react: path.resolve(mobileNm, "react"),
  "react-dom": path.resolve(mobileNm, "react-dom"),
  scheduler: path.resolve(mobileNm, "scheduler"),
  "use-sync-external-store": path.resolve(mobileNm, "use-sync-external-store"),
  three: path.resolve(mobileNm, "three"),
};

// React version must match react-native-renderer inside RN (0.81.x → react 19.1.0).

if (!config.resolver.assetExts.includes("glb")) {
  config.resolver.assetExts.push("glb", "gltf");
}

module.exports = config;
