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
def autolinkingCacheDir = new File(rootDir, "build/generated/autolinking")
if (!System.getProperty("os.name").toLowerCase().contains("windows")) {
  autolinkingCacheDir.deleteDir()
}

`;
    cfg.modResults.contents = snippet + cfg.modResults.contents;
    return cfg;
  });
};
