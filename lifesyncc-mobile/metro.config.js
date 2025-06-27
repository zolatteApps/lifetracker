const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add custom resolver to handle module resolution
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    app: path.resolve(__dirname, 'app'),
  },
};

module.exports = config;