const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const config = getDefaultConfig(__dirname);
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Son proyectos/salidas independientes: Metro no debe indexar sus dependencias.
const ignored = ['admin-panel', 'MasCafe', 'work', 'dist', 'web-build', '.expo-verify-admin-integration-ios', '.expo-verify-admin-integration-web'].map(folder =>
  new RegExp(`^${escape(path.resolve(__dirname, folder))}[\\\\/].*`)
);
const existing = config.resolver.blockList;
config.resolver.blockList = [...(Array.isArray(existing) ? existing : existing ? [existing] : []), ...ignored];
module.exports = config;
