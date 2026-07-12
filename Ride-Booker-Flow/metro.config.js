const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

const reactIsPath = path.resolve(__dirname, "node_modules/react-is");
const mapsShimPath = path.resolve(__dirname, "shims/react-native-maps.js");

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Fix react-native-maps on web — use a stub that exports null components
  if (platform === "web" && moduleName === "react-native-maps") {
    return { type: "sourceFile", filePath: mapsShimPath };
  }

  // Fix react-is resolution for @react-navigation/core nested lookup
  if (moduleName === "react-is" || moduleName.startsWith("react-is/")) {
    const subPath = moduleName === "react-is" ? "" : moduleName.slice("react-is".length);
    return {
      type: "sourceFile",
      filePath: subPath
        ? path.resolve(reactIsPath, subPath)
        : path.resolve(reactIsPath, "index.js"),
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
