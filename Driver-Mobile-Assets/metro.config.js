const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const emptyMock = require.resolve("./empty-mock.js");

// Mock ALL node: prefixed modules that AWS SDK tries to import
const nodeModulesToMock = [
  "node:https",
  "node:http",
  "node:http2",
  "node:stream",
  "node:crypto",
  "node:zlib",
  "node:net",
  "node:tls",
  "node:fs",
  "node:fs/promises",
  "node:path",
  "node:os",
  "node:url",
  "node:util",
  "node:buffer",
  "node:events",
  "node:assert",
  "node:child_process",
  "node:dns",
  "node:process",
  "node:querystring",
  "node:string_decoder",
  "node:timers",
  "node:async_hooks",
  "node:diagnostics_channel",
  "node:worker_threads",
  "node:perf_hooks",
];

const extraNodeModules = {};
nodeModulesToMock.forEach((mod) => {
  extraNodeModules[mod] = emptyMock;
});

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  ...extraNodeModules,
};

// Intercept resolution of node: prefixed modules that have subpaths like node:fs/promises
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Catch any node: prefixed module
  if (moduleName.startsWith("node:")) {
    return {
      filePath: emptyMock,
      type: "sourceFile",
    };
  }
  // Fall back to default resolution
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
