/** @type {import('next').NextConfig} */
const webpack = require('webpack');
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Existing externals
    const existingExternals = config.externals || [];
    config.externals = [
      ...(Array.isArray(existingExternals) ? existingExternals : [existingExternals]),
      'pino-pretty', 
      'lokijs', 
      'encoding',
      // Mark React Native async-storage as external to prevent bundling
      ({ request }, callback) => {
        if (request === '@react-native-async-storage/async-storage') {
          // Return the mock module path
          return callback(null, `commonjs ${path.resolve(__dirname, 'src/lib/mocks/async-storage-mock.js')}`);
        }
        callback();
      }
    ];
    
    // Also add alias for direct imports
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-native-async-storage/async-storage': path.resolve(__dirname, 'src/lib/mocks/async-storage-mock.js'),
      };
    }
    
    return config
  },
};

module.exports = nextConfig;
