const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);

  // Add support for SVG files using react-native-svg-transformer
  config.transformer = {
    ...config.transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  };

  config.resolver = {
    ...config.resolver,
    // Exclude SVG files from assetExts
    assetExts: config.resolver.assetExts.filter((ext) => ext !== "svg"),
    // Include SVG files as source types
    sourceExts: [...config.resolver.sourceExts, "svg"],
  };

  return withNativeWind(config, { input: "./global.css" });
})();
