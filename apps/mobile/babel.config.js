/** Metro / Expo — без этого файла сборка может использовать неполный пресет и падать в codegen React Native. */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
  };
};
