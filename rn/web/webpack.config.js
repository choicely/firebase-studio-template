console.log('Loading webpack.config.js...')

const fs = require('node:fs')
const path = require('node:path')

const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const babelConfig = require('./babel.config')

const repoRoot = path.resolve(__dirname, '../..')
const rnRoot = path.resolve(__dirname, '..')

function getComponentEntries(errors) {
  try {
    const content = fs.readFileSync(path.resolve(rnRoot, 'src/componentRegistry.js'), 'utf-8')
    const vars = {}
    for (const [, name, value] of content.matchAll(/const\s+(\w+)\s*=\s*['"]([^'"]+)['"]/g)) {
      vars[name] = value
    }
    const entries = []
    const mapping = content.match(/componentMapping\s*=\s*\{([\s\S]*?)\}/)
    if (mapping) {
      for (const [, computed, quoted, plain, requirePath] of mapping[1].matchAll(
        /(?:\[(\w+)\]|['"]([^'"]+)['"]|(\w+))\s*:\s*\(\)\s*=>\s*require\(['"]([^'"]+)['"]\)/g
      )) {
        const name = computed ? (vars[computed] || computed) : (quoted || plain)
        entries.push({ name, requirePath })
      }
    }
    return entries
  } catch (err) {
    errors.push({ phase: 'registry', file: 'src/componentRegistry.js', message: err.message })
    return []
  }
}

function parseDefaultValue(raw) {
  const trimmed = raw.trim()
  const strMatch = trimmed.match(/^(['"])(.*)\1$/)
  if (strMatch) return strMatch[2]
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed)
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed === 'null') return null
  return undefined
}

function parseOptionParam(segment) {
  try {
    const match = segment.trim().match(/^(\w+)(?:\s*=\s*([\s\S]+))?$/)
    if (!match) return null
    const option = { option_id: match[1] }
    if (match[2] !== undefined) {
      const defaultVal = parseDefaultValue(match[2])
      if (defaultVal !== undefined) option.default_value = defaultVal
    }
    return option
  } catch (err) {
    return { _error: err.message, _segment: segment.trim() }
  }
}

function getComponentOptions(componentId, requirePath, errors) {
  let filePath
  try {
    const basePath = path.resolve(rnRoot, 'src', requirePath)
    let content = null
    for (const ext of ['.jsx', '.js', '.tsx', '.ts']) {
      filePath = basePath + ext
      try { content = fs.readFileSync(filePath, 'utf-8'); break } catch {}
    }
    if (!content) {
      errors.push({ phase: 'read', component_id: componentId, requirePath, message: 'No source file found' })
      return { name: null, options: [] }
    }

    const exportMatch = content.match(/export\s+default\s+function\s+(\w+)\s*\(/)
    if (!exportMatch) return { name: null, options: [] }

    // Find matching closing ')' tracking nesting depth
    const start = exportMatch.index + exportMatch[0].length
    let depth = 1
    let i = start
    while (i < content.length && depth > 0) {
      if (content[i] === '(') depth++
      else if (content[i] === ')') depth--
      i++
    }
    const paramBlock = content.substring(start, i - 1).trim()
    const funcName = exportMatch[1]

    if (!paramBlock.startsWith('{') || !paramBlock.endsWith('}')) return { name: funcName, options: [] }

    const inner = paramBlock.slice(1, -1).trim()
    if (!inner) return { name: funcName, options: [] }

    // Split by commas respecting nested brackets
    const segments = []
    let nestDepth = 0
    let current = ''
    for (const ch of inner) {
      if (ch === '{' || ch === '[' || ch === '(') nestDepth++
      else if (ch === '}' || ch === ']' || ch === ')') nestDepth--
      else if (ch === ',' && nestDepth === 0) {
        segments.push(current)
        current = ''
        continue
      }
      current += ch
    }
    segments.push(current)

    const options = []
    for (const seg of segments) {
      try {
        const option = parseOptionParam(seg)
        if (option) {
          if (option._error) {
            errors.push({ phase: 'option_parse', component_id: componentId, segment: option._segment, message: option._error })
          } else {
            options.push(option)
          }
        }
      } catch (err) {
        errors.push({ phase: 'option_parse', component_id: componentId, segment: seg.trim(), message: err.message })
      }
    }
    return { name: funcName, options }
  } catch (err) {
    errors.push({ phase: 'options', component_id: componentId, requirePath, message: err.message })
    return { name: null, options: [] }
  }
}

function getComponentsJson() {
  const errors = []
  const entries = getComponentEntries(errors)
  const components = []
  for (const { name, requirePath } of entries) {
    try {
      const { name: funcName, options } = getComponentOptions(name, requirePath, errors)
      components.push({
        component_id: name,
        ...(funcName && { component_name: funcName }),
        options,
      })
    } catch (err) {
      errors.push({ phase: 'component', component_id: name, message: err.message })
    }
  }
  const result = { components }
  if (errors.length) result.errors = errors
  return JSON.stringify(result)
}
const webRoot = path.resolve(rnRoot, 'web')
const nodeModulesRoot = path.resolve(repoRoot, 'node_modules')

const { getPorts } = require('../dev/ports')
const { webPort } = getPorts(repoRoot)

const indexHtmlPath = path.resolve(webRoot, 'index.html')
const indexJsPath = path.resolve(webRoot, 'index.web.js')

const transpileModules = [
  'react-native-vector-icons',
  'react-native-toast-message',
  'react-native-reanimated',
  'react-native-gesture-handler',
]

const babelLoaderConfiguration = {
  test: /\.[jt]sx?$/,
  include: [
    webRoot,
    indexJsPath,
    path.resolve(repoRoot, 'index.js'),
    path.resolve(rnRoot, 'src'),
    ...transpileModules.map((m) => path.resolve(nodeModulesRoot, m)),
  ],
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: path.resolve(repoRoot, '.cache/babel-loader'),
      presets: ['module:@react-native/babel-preset'],
      plugins: ['react-native-web', ...(babelConfig.plugins || [])],
    },
  },
}

const imageLoaderConfiguration = {
  test: /\.(gif|jpe?g|png|svg)$/i,
  type: 'asset', // webpack 5-friendly; replaces url-loader/file-loader
}

const ttfLoaderConfiguration = {
  test: /\.ttf$/i,
  type: 'asset/resource',
}

const isWorkspace = Boolean(process.env.WORKSPACE_SLUG)

module.exports = {
  entry: { app: indexJsPath },
  output: {
    clean: true,
    path: path.resolve(repoRoot, 'dist'),
    filename: 'app.bundle.js',
  },
  resolve: {
    extensions: [
      '.web.tsx', '.web.ts', '.web.jsx', '.web.js',
      '.tsx', '.ts', '.jsx', '.js', '.json',
    ],
    alias: {
      'react-native$': 'react-native-web',
      '../Utilities/Platform': 'react-native-web/dist/exports/Platform',
      '../../Utilities/Platform': 'react-native-web/dist/exports/Platform',
      './Platform': 'react-native-web/dist/exports/Platform',
    },
    fallback: {
      process: require.resolve('process/browser'),
    },
  },
  module: {
    rules: [
      babelLoaderConfiguration,
      imageLoaderConfiguration,
      ttfLoaderConfiguration,
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: indexHtmlPath }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    }),
    {
      apply(compiler) {
        compiler.hooks.thisCompilation.tap('ComponentsJsonPlugin', (compilation) => {
          compilation.hooks.processAssets.tap(
            { name: 'ComponentsJsonPlugin', stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL },
            () => compilation.emitAsset('_components.json', new webpack.sources.RawSource(getComponentsJson())),
          )
        })
      },
    },
  ],
  devServer: {
    port: webPort,
    open: false,
    hot: true,
    compress: true,
    allowedHosts: 'all',
    setupMiddlewares: (middlewares) => {
      middlewares.unshift((req, res, next) => {
        if (req.url === '/_components' || req.url === '/_components.json') {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-store')
          res.end(getComponentsJson())
        } else {
          next()
        }
      })
      return middlewares
    },
    ...(isWorkspace
      ? {
        client: {
          webSocketURL: {
            port: 443,
            pathname: '/ws',
          },
        },
        webSocketServer: 'ws',
      }
      : {}),
  },
  cache: {
    type: 'filesystem',
    cacheDirectory: path.resolve(repoRoot, '.cache/webpack'),
    name: 'webpack',
  },
}
