console.log('Loading metro.config.js...')

const path = require('node:path')
const fs = require('node:fs')

const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config')
const {FileStore} = require('metro-cache')

const repoRoot = path.resolve(__dirname, '..')
const rnRoot = path.resolve(repoRoot, 'rn')
const iconFamilyNames = [
  'AntDesign',
  'Entypo',
  'EvilIcons',
  'Feather',
  'FontAwesome',
  'FontAwesome5',
  'FontAwesome6',
  'Fontisto',
  'Foundation',
  'Ionicons',
  'MaterialCommunityIcons',
  'MaterialIcons',
  'Octicons',
  'SimpleLineIcons',
  'Zocial',
]

const iconModuleAliases = iconFamilyNames.reduce((aliases, familyName) => {
  aliases[`react-native-vector-icons/${familyName}`] = path.join(
    rnRoot,
    `src/lib/vector-icons/${familyName}.js`,
  )
  return aliases
}, {})

const {getPorts} = require('./dev/ports')
const {metroPort} = getPorts(repoRoot)

if (metroPort === null) {
  throw new Error(
    'RCT_METRO_PORT is not set. Define it in `.env`, `default.env`, or export it.',
  )
}

const defaultConfig = getDefaultConfig(rnRoot)

module.exports = mergeConfig(defaultConfig, {
  projectRoot: rnRoot,
  watchFolders: [path.join(repoRoot, 'node_modules')],
  server: {port: metroPort},
  resolver: {
    nodeModulesPaths: [path.join(repoRoot, 'node_modules')],
    disableHierarchicalLookup: true,
    resolveRequest: (context, moduleName, platform) => {
      const aliasedPath = iconModuleAliases[moduleName]
      if (aliasedPath) {
        return {
          type: 'sourceFile',
          filePath: aliasedPath,
        }
      }

      if (moduleName.startsWith('react-native-vector-icons/')) {
        const familyName = moduleName.replace('react-native-vector-icons/', '')
        const dynamicAliasPath = path.join(
          rnRoot,
          `src/lib/vector-icons/${familyName}.js`,
        )

        if (fs.existsSync(dynamicAliasPath)) {
          return {
            type: 'sourceFile',
            filePath: dynamicAliasPath,
          }
        }
      }

      if (typeof context.resolveRequest === 'function') {
        return context.resolveRequest(context, moduleName, platform)
      }

      return null
    },
  },
  cacheStores: [
    new FileStore({
      root: path.join(repoRoot, '.cache/metro'),
    }),
  ],
})
