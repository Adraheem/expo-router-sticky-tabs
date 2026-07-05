// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// The library root has its OWN node_modules (it installs React, Expo Router,
// Reanimated, etc. as dev/peer deps to build + test the library). Because the
// library is symlinked in from `..`, Metro would otherwise resolve those shared
// packages from the root copy — creating a SECOND copy of React/Expo Router with
// separate context instances. That breaks context-based hooks (e.g. Expo
// Router's `useContextKey` → "No filename found") and Reanimated/Fast Refresh.
//
// Fix: block the entire root node_modules so every dependency resolves from the
// example's single copy. The library itself is resolved via `extraNodeModules`
// (it points at `..`, not `../node_modules`), so it is unaffected.
config.resolver.blockList = [
  ...Array.from(config.resolver.blockList ?? []),
  // On windows the path resolves with `\`; escape it to `\\` for the RegExp.
  new RegExp(`${path.resolve('..', 'node_modules').replace(/\\/g, '\\\\')}\\/.*`),
];

config.resolver.nodeModulesPaths = [path.resolve(__dirname, './node_modules')];

config.resolver.extraNodeModules = {
  'expo-router-sticky-tabs': '..',
};

config.watchFolders = [path.resolve(__dirname, '..')];

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
