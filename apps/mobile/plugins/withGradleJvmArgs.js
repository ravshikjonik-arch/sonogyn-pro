const { withGradleProperties } = require("expo/config-plugins");

/** Память Gradle на EAS — expo-build-properties не поддерживает org.gradle.jvmargs. */
module.exports = function withGradleJvmArgs(config) {
  return withGradleProperties(config, (cfg) => {
    cfg.modResults = cfg.modResults.filter(
      (item) => item.type !== "property" || item.key !== "org.gradle.jvmargs",
    );
    cfg.modResults.push({
      type: "property",
      key: "org.gradle.jvmargs",
      value: "-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError",
    });
    return cfg;
  });
};
