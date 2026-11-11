// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// The on-device Content Credentials engine is shipped as a self-contained HTML asset.
config.resolver.assetExts.push('html');
module.exports = config;
