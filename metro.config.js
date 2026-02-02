const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Ensure wasm is treated as an asset
if (!config.resolver.assetExts.includes("wasm")) {
  config.resolver.assetExts.push("wasm");
}

// Ensure wasm is NOT treated as a source file (if it happens to be there)
config.resolver.sourceExts = config.resolver.sourceExts.filter((ext) => ext !== "wasm");

module.exports = withNativeWind(config, { input: "./global.css" });
