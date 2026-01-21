console.log('Loading metro.config.js...')

const path = require('node:path')

const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config')
const {FileStore} = require('metro-cache')

const repoRoot = path.resolve(__dirname, '..')
const rnRoot = path.resolve(repoRoot, 'rn')

const {getPorts} = require('./dev/ports')
const {metroPort} = getPorts(repoRoot)

const defaultConfig = getDefaultConfig(rnRoot)

module.exports = mergeConfig(defaultConfig, {
  projectRoot: rnRoot,
  watchFolders: [path.join(repoRoot, 'node_modules')],
  server: {port: metroPort},
  resolver: {
    nodeModulesPaths: [path.join(repoRoot, 'node_modules')],
    disableHierarchicalLookup: true,
  },
  cacheStores: [
    new FileStore({
      root: path.join(repoRoot, '.cache/metro'),
    }),
  ],
})
