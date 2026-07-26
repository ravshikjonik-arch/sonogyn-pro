const { withSettingsGradle } = require("expo/config-plugins");

/**
 * EAS Linux builders sometimes restore a stale android/build/generated/autolinking
 * cache (wrong absolute paths) → "No matching variant / No variants exist".
 * Force-delete when settings.gradle evaluates so paths regenerate on the builder.
 *
 * IMPORTANT: must NOT prepend before pluginManagement {} — Gradle 8+ forbids any
 * statements before pluginManagement/plugins blocks.
 * @see https://github.com/expo/expo/issues/42370
 */
module.exports = function withClearAutolinkingCache(config) {
  return withSettingsGradle(config, (cfg) => {
    const marker = "Force-delete the autolinking cache";
    let contents = cfg.modResults.contents;
    if (contents.includes(marker)) {
      return cfg;
    }

    const snippet = `
// ${marker} so it always regenerates with correct paths on the build machine.
// Also clear app CMake/.cxx leftovers that EAS cache restore can poison (SDK 54).
// Placed after plugins {} — pluginManagement must stay first (Gradle 8+).
def autolinkingCacheDir = new File(rootDir, "build/generated/autolinking")
def appCxxDir = new File(rootDir, "app/.cxx")
def appBuildGenerated = new File(rootDir, "app/build/generated")
if (!System.getProperty("os.name").toLowerCase().contains("windows")) {
  autolinkingCacheDir.deleteDir()
  appCxxDir.deleteDir()
  appBuildGenerated.deleteDir()
}

`;

    // Prefer insert right after the plugins { ... } block.
    const pluginsMatch = contents.match(/plugins\s*\{[\s\S]*?\n\}\s*\n/);
    if (pluginsMatch && typeof pluginsMatch.index === "number") {
      const idx = pluginsMatch.index + pluginsMatch[0].length;
      contents = contents.slice(0, idx) + snippet + contents.slice(idx);
    } else {
      // Fallback: after pluginManagement { ... }
      const pmMatch = contents.match(/pluginManagement\s*\{[\s\S]*?\n\}\s*\n/);
      if (pmMatch && typeof pmMatch.index === "number") {
        const idx = pmMatch.index + pmMatch[0].length;
        contents = contents.slice(0, idx) + snippet + contents.slice(idx);
      } else {
        contents = contents + "\n" + snippet;
      }
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
};
