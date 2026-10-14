const { withPodfile } = require("expo/config-plugins");

const MARKER = "SonoGynPro: enforce minimum iOS deployment target for all Pods";
const FMT_MARKER = "SonoGynPro Xcode 26 fmt";
const SNIPPET = `
    # ${FMT_MARKER} — fmt 11.x consteval vs Apple Clang 21+
    fmt_base = File.join(installer.sandbox.root, 'fmt', 'include', 'fmt', 'base.h')
    if File.exist?(fmt_base)
      content = File.read(fmt_base)
      unless content.include?('${FMT_MARKER}')
        patched = content.gsub(
          "#elif defined(__apple_build_version__) && __apple_build_version__ < 14000029L\\n#  define FMT_USE_CONSTEVAL 0  // consteval is broken in Apple clang < 14.",
          "#elif defined(__apple_build_version__)\\n#  define FMT_USE_CONSTEVAL 0  // ${FMT_MARKER}"
        )
        if patched != content
          File.chmod(0644, fmt_base)
          File.write(fmt_base, patched)
        end
      end
    end
    # ${MARKER} (Xcode 16+ rejects pod resource bundles below 15.0)
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |bc|
        t = bc.build_settings["IPHONEOS_DEPLOYMENT_TARGET"]
        next if t.nil?
        bc.build_settings["IPHONEOS_DEPLOYMENT_TARGET"] = "15.1" if t.to_f < 15.1
      end
    end
`;

/** @type {import('expo/config-plugins').ConfigPlugin} */
module.exports = function withIosPodsDeploymentTarget(config) {
  return withPodfile(config, (cfg) => {
    let contents = cfg.modResults.contents;
    if (contents.includes(MARKER)) {
      return cfg;
    }
    const anchor = "react_native_post_install(";
    const idx = contents.indexOf(anchor);
    if (idx === -1) {
      return cfg;
    }
    const closeIdx = contents.indexOf("\n  end", idx);
    if (closeIdx === -1) {
      return cfg;
    }
    contents = contents.slice(0, closeIdx) + SNIPPET + contents.slice(closeIdx);
    cfg.modResults.contents = contents;
    return cfg;
  });
};
