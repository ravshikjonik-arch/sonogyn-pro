const { withSettingsGradle } = require("expo/config-plugins");

/**
 * EAS Linux builders sometimes restore a stale android/build/generated/autolinking
 * cache (wrong absolute paths) → "No matching variant / No variants exist".
 * Force-delete before Gradle configures so paths regenerate on the builder.
 * @see https://github.com/expo/expo/issues/42370
 */
module.exports = function withClearAutolinkingCache(config) {
  return withSettingsGradle(config, (cfg) => {
    const marker = "Force-delete the autolinking cache";
    if (cfg.modResults.contents.includes(marker)) {
      return cfg;
    }
    const snippet = `// ${marker} so it always regenerates with correct paths on the build machine.
// Also clear app CMake/.cxx leftovers that EAS cache restore can poison (SDK 54).
def autolinkingCacheDir = new File(rootDir, "build/generated/autolinking")
def appCxxDir = new File(rootDir, "app/.cxx")
def appBuildGenerated = new File(rootDir, "app/build/generated")
if (!System.getProperty("os.name").toLowerCase().contains("windows")) {
  autolinkingCacheDir.deleteDir()
  appCxxDir.deleteDir()
  appBuildGenerated.deleteDir()
}

`;
    cfg.modResults.contents = snippet + cfg.modResults.contents;
    return cfg;
  });
};
