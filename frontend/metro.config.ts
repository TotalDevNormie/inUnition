const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true,
});

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
config.watchFolders = [workspaceRoot];
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

const { withNativeWind } = require("nativewind/metro");
const mergedConfig = withNativeWind(config, {
  // 3. Set `input` to your CSS file with the Tailwind at-rules
  input: "global.css",
  // This is optional
  projectRoot,
  inlineRem: false,
});

const { transformer, resolver } = mergedConfig;

mergedConfig.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer/expo")
};
mergedConfig.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...resolver.sourceExts, "svg"]
};

module.exports = mergedConfig;
