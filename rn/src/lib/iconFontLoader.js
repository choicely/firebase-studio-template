import React, {forwardRef, useEffect, useState} from 'react'
import {Platform} from 'react-native'
import NativeIconAPI from 'react-native-vector-icons/dist/lib/NativeRNVectorIcons'
import AntDesignBase from 'react-native-vector-icons/dist/AntDesign'
import EntypoBase from 'react-native-vector-icons/dist/Entypo'
import EvilIconsBase from 'react-native-vector-icons/dist/EvilIcons'
import FeatherBase from 'react-native-vector-icons/dist/Feather'
import FontAwesomeBase from 'react-native-vector-icons/dist/FontAwesome'
import FontAwesome5Base from 'react-native-vector-icons/dist/FontAwesome5'
import FontAwesome6Base from 'react-native-vector-icons/dist/FontAwesome6'
import FontistoBase from 'react-native-vector-icons/dist/Fontisto'
import FoundationBase from 'react-native-vector-icons/dist/Foundation'
import IoniconsBase from 'react-native-vector-icons/dist/Ionicons'
import MaterialCommunityIconsBase from 'react-native-vector-icons/dist/MaterialCommunityIcons'
import MaterialIconsBase from 'react-native-vector-icons/dist/MaterialIcons'
import OcticonsBase from 'react-native-vector-icons/dist/Octicons'
import SimpleLineIconsBase from 'react-native-vector-icons/dist/SimpleLineIcons'
import ZocialBase from 'react-native-vector-icons/dist/Zocial'

let preloadPromise = null
const loadedFonts = new Set()
const failedFonts = new Set()
const loadingFonts = new Map()
const warnedMissingIcons = new Set()

const ICON_FAMILY_DEFINITIONS = {
  AntDesign: {
    name: 'AntDesign',
    baseIcon: AntDesignBase,
    fontFiles: ['AntDesign.ttf'],
    assetModules: [require('react-native-vector-icons/Fonts/AntDesign.ttf')],
  },
  Entypo: {
    name: 'Entypo',
    baseIcon: EntypoBase,
    fontFiles: ['Entypo.ttf'],
    assetModules: [require('react-native-vector-icons/Fonts/Entypo.ttf')],
  },
  EvilIcons: {
    name: 'EvilIcons',
    baseIcon: EvilIconsBase,
    fontFiles: ['EvilIcons.ttf'],
    assetModules: [require('react-native-vector-icons/Fonts/EvilIcons.ttf')],
  },
  Feather: {
    name: 'Feather',
    baseIcon: FeatherBase,
    fontFiles: ['Feather.ttf'],
    assetModules: [require('react-native-vector-icons/Fonts/Feather.ttf')],
  },
  FontAwesome: {
    name: 'FontAwesome',
    baseIcon: FontAwesomeBase,
    fontFiles: ['FontAwesome.ttf'],
    assetModules: [require('react-native-vector-icons/Fonts/FontAwesome.ttf')],
  },
  FontAwesome5: {
    name: 'FontAwesome5',
    baseIcon: FontAwesome5Base,
    fontFiles: [
      'FontAwesome5_Brands.ttf',
      'FontAwesome5_Regular.ttf',
      'FontAwesome5_Solid.ttf',
    ],
    assetModules: [
      require('react-native-vector-icons/Fonts/FontAwesome5_Brands.ttf'),
      require('react-native-vector-icons/Fonts/FontAwesome5_Regular.ttf'),
      require('react-native-vector-icons/Fonts/FontAwesome5_Solid.ttf'),
    ],
  },
  FontAwesome6: {
    name: 'FontAwesome6',
    baseIcon: FontAwesome6Base,
    fontFiles: [
      'FontAwesome6_Brands.ttf',
      'FontAwesome6_Regular.ttf',
      'FontAwesome6_Solid.ttf',
    ],
    assetModules: [
      require('react-native-vector-icons/Fonts/FontAwesome6_Brands.ttf'),
      require('react-native-vector-icons/Fonts/FontAwesome6_Regular.ttf'),
      require('react-native-vector-icons/Fonts/FontAwesome6_Solid.ttf'),
    ],
  },
  Fontisto: {
    name: 'Fontisto',
    baseIcon: FontistoBase,
    fontFiles: ['Fontisto.ttf'],
    assetModules: [require('react-native-vector-icons/Fonts/Fontisto.ttf')],
  },
  Foundation: {
    name: 'Foundation',
    baseIcon: FoundationBase,
    fontFiles: ['Foundation.ttf'],
    assetModules: [require('react-native-vector-icons/Fonts/Foundation.ttf')],
  },
  Ionicons: {
    name: 'Ionicons',
    baseIcon: IoniconsBase,
    fontFiles: ['Ionicons.ttf'],
    assetModules: [require('react-native-vector-icons/Fonts/Ionicons.ttf')],
  },
  MaterialCommunityIcons: {
    name: 'MaterialCommunityIcons',
    baseIcon: MaterialCommunityIconsBase,
    fontFiles: ['MaterialCommunityIcons.ttf'],
    assetModules: [
      require('react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'),
    ],
  },
  MaterialIcons: {
    name: 'MaterialIcons',
    baseIcon: MaterialIconsBase,
    fontFiles: ['MaterialIcons.ttf'],
    assetModules: [require('react-native-vector-icons/Fonts/MaterialIcons.ttf')],
  },
  Octicons: {
    name: 'Octicons',
    baseIcon: OcticonsBase,
    fontFiles: ['Octicons.ttf'],
    assetModules: [require('react-native-vector-icons/Fonts/Octicons.ttf')],
  },
  SimpleLineIcons: {
    name: 'SimpleLineIcons',
    baseIcon: SimpleLineIconsBase,
    fontFiles: ['SimpleLineIcons.ttf'],
    assetModules: [
      require('react-native-vector-icons/Fonts/SimpleLineIcons.ttf'),
    ],
  },
  Zocial: {
    name: 'Zocial',
    baseIcon: ZocialBase,
    fontFiles: ['Zocial.ttf'],
    assetModules: [require('react-native-vector-icons/Fonts/Zocial.ttf')],
  },
}

const FONT_DEFINITIONS = Object.values(ICON_FAMILY_DEFINITIONS)

function warnDev(message, error) {
  if (!__DEV__) {
    return
  }

  if (error) {
    console.warn(`[vector-icons] ${message}`, error)
    return
  }

  console.warn(`[vector-icons] ${message}`)
}

async function loadFontFileWithNativeModule(fontFile) {
  if (Platform.OS !== 'ios') {
    return false
  }

  if (!NativeIconAPI || typeof NativeIconAPI.loadFontWithFileName !== 'function') {
    return false
  }

  const dotIndex = fontFile.lastIndexOf('.')
  if (dotIndex < 1 || dotIndex === fontFile.length - 1) {
    return false
  }

  const fileName = fontFile.slice(0, dotIndex)
  const fileExtension = fontFile.slice(dotIndex + 1)
  await NativeIconAPI.loadFontWithFileName(fileName, fileExtension)
  return true
}

async function loadWithVectorIcons(loadFont, fontFiles = []) {
  if (typeof loadFont === 'function') {
    await loadFont()
    return true
  }

  let loadedAtLeastOne = false

  for (const fontFile of fontFiles) {
    const loaded = await loadFontFileWithNativeModule(fontFile)
    loadedAtLeastOne = loadedAtLeastOne || loaded
  }

  return loadedAtLeastOne
}

async function ensureIconFontLoaded({
  name,
  baseIcon,
  assetModules = [],
  loadFont,
  fontFiles = [],
}) {
  if (loadedFonts.has(name)) {
    return
  }

  if (failedFonts.has(name)) {
    throw new Error(`Font previously failed to load: ${name}`)
  }

  const inFlightPromise = loadingFonts.get(name)
  if (inFlightPromise) {
    await inFlightPromise
    return
  }

  const loadPromise = (async () => {
    try {
      // Keep explicit TTF requires so Metro bundles these assets with the JS bundle.
      if (!Array.isArray(assetModules) || assetModules.length === 0) {
        warnDev(`Missing asset modules for ${name}`)
      }

      const loadFontFn =
        typeof loadFont === 'function'
          ? loadFont
          : baseIcon && typeof baseIcon.loadFont === 'function'
            ? baseIcon.loadFont.bind(baseIcon)
            : undefined

      const loadedByRuntime = await loadWithVectorIcons(loadFontFn, fontFiles)

      if (!loadedByRuntime && Platform.OS === 'ios') {
        throw new Error(`Unable to load ${name} font on iOS runtime`)
      }

      loadedFonts.add(name)
    } catch (error) {
      failedFonts.add(name)
      warnDev(`Font load failed for ${name}`, error)
      throw error
    } finally {
      loadingFonts.delete(name)
    }
  })()

  loadingFonts.set(name, loadPromise)
  await loadPromise
}

function useIconFont(fontDefinition) {
  const [isReady, setIsReady] = useState(() => loadedFonts.has(fontDefinition.name))

  useEffect(() => {
    let isMounted = true

    ensureIconFontLoaded(fontDefinition)
      .catch(() => undefined)
      .finally(() => {
        if (isMounted) {
          setIsReady(loadedFonts.has(fontDefinition.name))
        }
      })

    return () => {
      isMounted = false
    }
  }, [fontDefinition])

  return isReady
}

export function useIconFontStatus(fontName) {
  const fontDefinition = ICON_FAMILY_DEFINITIONS[fontName]

  const [status, setStatus] = useState(() => {
    if (!fontDefinition) return 'missing'
    if (loadedFonts.has(fontName)) return 'ready'
    if (failedFonts.has(fontName)) return 'failed'
    return 'loading'
  })

  useEffect(() => {
    if (!fontDefinition) {
      setStatus('missing')
      return
    }

    let isMounted = true

    ensureIconFontLoaded(fontDefinition)
      .then(() => {
        if (isMounted) {
          setStatus('ready')
        }
      })
      .catch(() => {
        if (isMounted) {
          setStatus('failed')
        }
      })

    return () => {
      isMounted = false
    }
  }, [fontDefinition, fontName])

  return status
}

function createOnDemandIcon(fontDefinition) {
  const BaseIcon = fontDefinition.baseIcon

  const OnDemandIcon = forwardRef((props, ref) => {
    useIconFont(fontDefinition)

    if (
      __DEV__ &&
      typeof props.name === 'string' &&
      typeof BaseIcon.hasIcon === 'function' &&
      !BaseIcon.hasIcon(props.name)
    ) {
      const warnKey = `${fontDefinition.name}:${props.name}`
      if (!warnedMissingIcons.has(warnKey)) {
        warnedMissingIcons.add(warnKey)
        warnDev(
          `Unknown icon "${props.name}" for ${fontDefinition.name}. Check icon family/name mismatch.`,
        )
      }
    }

    return <BaseIcon ref={ref} {...props} />
  })

  OnDemandIcon.displayName = `OnDemand${fontDefinition.name}`

  if (BaseIcon.Button !== undefined) {
    OnDemandIcon.Button = BaseIcon.Button
  }
  if (BaseIcon.getImageSource !== undefined) {
    OnDemandIcon.getImageSource = BaseIcon.getImageSource
  }
  if (BaseIcon.getImageSourceSync !== undefined) {
    OnDemandIcon.getImageSourceSync = BaseIcon.getImageSourceSync
  }
  if (BaseIcon.hasIcon !== undefined) {
    OnDemandIcon.hasIcon = BaseIcon.hasIcon
  }
  if (BaseIcon.getRawGlyphMap !== undefined) {
    OnDemandIcon.getRawGlyphMap = BaseIcon.getRawGlyphMap
  }
  if (BaseIcon.getFontFamily !== undefined) {
    OnDemandIcon.getFontFamily = BaseIcon.getFontFamily
  }

  OnDemandIcon.loadFont = () => ensureIconFontLoaded(fontDefinition)

  return OnDemandIcon
}

const WRAPPED_ICON_FAMILIES = FONT_DEFINITIONS.reduce((acc, definition) => {
  acc[definition.name] = createOnDemandIcon(definition)
  return acc
}, {})

export const supportedIconFamilies = Object.keys(WRAPPED_ICON_FAMILIES)

export function getWrappedIconFamily(familyName) {
  return WRAPPED_ICON_FAMILIES[familyName] || null
}

export const Ionicons = getWrappedIconFamily('Ionicons')
export const MaterialIcons = getWrappedIconFamily('MaterialIcons')

export function loadNamedIconFont(fontName) {
  const definition = ICON_FAMILY_DEFINITIONS[fontName]
  if (!definition) {
    warnDev(`Unknown font requested: ${fontName}`)
    return Promise.resolve()
  }
  return ensureIconFontLoaded(definition)
}

export function preloadIconFonts() {
  if (preloadPromise) {
    return preloadPromise
  }

  preloadPromise = Promise.all(
    FONT_DEFINITIONS.map((definition) => ensureIconFontLoaded(definition)),
  )
    .then(() => undefined)
    .catch((error) => {
      warnDev('Unexpected icon font preload failure', error)
    })

  return preloadPromise
}
