import React from 'react'
import {
  AppRegistry,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'

import {
  componentMapping,
  defaultComponentName,
  registerComponents,
} from '../src/index'

registerComponents({ useSafeAreaProvider: false })

if (typeof document === 'undefined' || document.documentElement == null) {
  throw new Error('Document is undefined. This file should be run in a web environment.')
}

const rootTag = document.getElementById('root')

if (rootTag == null) {
  throw new Error(
    'Root tag not found. Please ensure there is a <div id="root"></div> in your HTML file.',
  )
}

document.documentElement.style.height = '100%'
document.body.style.height = '100%'
document.body.style.margin = '0'
rootTag.style.height = '100%'
rootTag.style.display = 'flex'
rootTag.style.flexDirection = 'column'

const HIGHLIGHT = '#37ff95'
const GALLERY_MODES = new Set(['chips', 'preview_list'])

function afterScheme(uri) {
  const i = uri.indexOf(':')
  const rest = i === -1 ? uri : uri.slice(i + 1)
  return rest.replace(/^\/+/, '')
}

async function copyToClipboard(text) {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch (e) {
    // clipboard blocked by permissions policy etc -> fall through
  }

  try {
    if (typeof document !== 'undefined') {
      const el = document.createElement('textarea')
      el.value = text
      el.setAttribute('readonly', '')
      el.style.position = 'fixed'
      el.style.left = '-9999px'
      document.body.appendChild(el)
      el.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(el)
      return ok
    }
  } catch (e) {
    // fall through
  }

  try {
    if (typeof window !== 'undefined') {
      window.prompt('Copy this:', text)
      return false
    }
  } catch (_) { }

  return false
}

function getQueryState() {
  if (typeof window === 'undefined') {
    return { forcedComponentName: null, queryProps: {}, galleryMode: 'chips' }
  }
  const params = new URLSearchParams(window.location.search)

  const queryProps = {}
  for (const [key, value] of params.entries()) {
    queryProps[key] = value
  }

  const forcedComponentName = params.get('_component') ?? params.get('component') ?? null

  const rawMode = params.get('_gallery_mode') ?? ''
  const galleryMode = GALLERY_MODES.has(rawMode) ? rawMode : 'chips'

  return { forcedComponentName, queryProps, galleryMode }
}

const { forcedComponentName, queryProps, galleryMode } = getQueryState()

function RootSafeArea({ children }) {
  return (
    <SafeAreaProvider style={styles.safeAreaProvider}>
      <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
    </SafeAreaProvider>
  )
}

function MessageScreen({ text }) {
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>{text}</Text>
      </View>
    </ScrollView>
  )
}

export function TopBar({ names, active, onSelect }) {
  return (
    <View style={styles.topBar}>
      {names.map((name) => {
        const selected = name === active
        return (
          <Pressable
            key={name}
            onPress={() => onSelect(name)}
            style={({ pressed }) => [
              styles.chipBase,
              selected ? styles.chipSelected : styles.chipUnselected,
              !selected && pressed && styles.chipPressed,
            ]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {name}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function CopyIcon({ size = 15 }) {
  // Your provided SVG, translated to react-native-svg.
  // Uses current text color via `color` prop on Svg, and Path uses `fill="currentColor"`.
  return (
    <Svg
      viewBox="0 0 488.3 488.3"
      width={size}
      height={size}
      style={styles.copyIconSvg}
      color="currentColor"
    >
      <Path
        fill="currentColor"
        d="M314.25 85.4h-227c-21.3 0-38.6 17.3-38.6 38.6v325.7c0 21.3 17.3 38.6 38.6 38.6h227c21.3 0 38.6-17.3 38.6-38.6V124c-.1-21.3-17.4-38.6-38.6-38.6m11.5 364.2c0 6.4-5.2 11.6-11.6 11.6h-227c-6.4 0-11.6-5.2-11.6-11.6V124c0-6.4 5.2-11.6 11.6-11.6h227c6.4 0 11.6 5.2 11.6 11.6z"
      />
      <Path
        fill="currentColor"
        d="M401.05 0h-227c-21.3 0-38.6 17.3-38.6 38.6 0 7.5 6 13.5 13.5 13.5s13.5-6 13.5-13.5c0-6.4 5.2-11.6 11.6-11.6h227c6.4 0 11.6 5.2 11.6 11.6v325.7c0 6.4-5.2 11.6-11.6 11.6-7.5 0-13.5 6-13.5 13.5s6 13.5 13.5 13.5c21.3 0 38.6-17.3 38.6-38.6V38.6c0-21.3-17.3-38.6-38.6-38.6"
      />
    </Svg>
  )
}

function CopyFooter({ name, toCopy }) {
  const [tip, setTip] = React.useState(null) // null | 'Copied'
  const [isHovered, setIsHovered] = React.useState(false)
  const tipTimer = React.useRef(null)

  const clearTipTimer = React.useCallback(() => {
    if (tipTimer.current) {
      clearTimeout(tipTimer.current)
      tipTimer.current = null
    }
  }, [])

  const scheduleHide = React.useCallback(() => {
    clearTipTimer()
    tipTimer.current = setTimeout(() => setTip(null), 1100)
  }, [clearTipTimer])

  React.useEffect(() => {
    return () => clearTipTimer()
  }, [clearTipTimer])

  const showCopied = React.useCallback(() => {
    clearTipTimer()
    setTip('Copied')
  }, [clearTipTimer])

  const onCopy = React.useCallback(async () => {
    await copyToClipboard(toCopy)
    showCopied()
  }, [toCopy, showCopied])

  return (
    <Pressable
      onPress={() => {
        void onCopy()
      }}
      onHoverIn={() => {
        setIsHovered(true)
        // if we're hovering, keep any "Copied" tooltip alive
        clearTipTimer()
      }}
      onHoverOut={() => {
        setIsHovered(false)
        clearTipTimer()
        setTip(null)
      }}
      accessibilityRole="button"
      style={({ pressed, hovered }) => [
        styles.previewFooterButton,
        pressed && styles.previewFooterButtonPressed,
        hovered && styles.previewFooterButtonHovered,
      ]}
    >
      {({ hovered, pressed }) => {
        const tipText = tip === 'Copied' ? 'Copied' : hovered ? 'Copy' : null

        return (
          <View style={styles.footerRow}>
            <View style={styles.footerTextRow}>
              <Text style={styles.previewLinkText} numberOfLines={1}>
                {'choicely://special/rn/'}
                <Text style={styles.previewLinkName}>{name}</Text>
              </Text>

              <View
                style={[
                  styles.copyIconWrap,
                  (hovered || pressed || tip === 'Copied') && styles.copyIconWrapVisible,
                ]}
                pointerEvents="none"
              >
                <CopyIcon size={15} />
              </View>
            </View>

            {tipText ? (
              <View
                pointerEvents="none"
                style={[
                  styles.tooltip,
                  tipText === 'Copied' && styles.tooltipCopied,
                ]}
              >
                <Text style={styles.tooltipText}>{tipText}</Text>
              </View>
            ) : null}
          </View>
        )
      }}
    </Pressable>
  )
}


function PreviewList({ names, components, queryProps }) {
  return (
    <ScrollView style={styles.previewList} contentContainerStyle={styles.previewListContent}>
      {names.map((name) => {
        const Comp = components[name]?.registeredComponent
        const uri = `choicely://special/rn/${name}`
        const toCopy = afterScheme(uri)

        return (
          <View key={name} style={styles.previewItem}>
            <View style={styles.previewCard}>
              <View style={styles.previewFrame}>
                {/* Make the preview "dead" to interactions so it never steals scroll/clicks */}
                <View pointerEvents="none" style={styles.componentHost}>
                  {Comp ? (
                    <Comp {...queryProps} />
                  ) : (
                    <MessageScreen text={`Component "${String(name)}" not found`} />
                  )}
                </View>
              </View>

              <View style={styles.previewFooter}>
                <CopyFooter name={name} toCopy={toCopy} />
              </View>
            </View>
          </View>
        )
      })}
    </ScrollView>
  )
}

function WebRoot({
  components = {},
  initialComponent,
  forcedComponentName,
  queryProps = {},
  galleryMode = 'chips',
}) {
  const names = Object.keys(components)

  if (names.length === 0) {
    return (
      <RootSafeArea>
        <MessageScreen text="No components found" />
      </RootSafeArea>
    )
  }

  // forced component always wins, regardless of gallery mode
  if (forcedComponentName) {
    const ForcedComponent = components[forcedComponentName]?.registeredComponent
    return (
      <RootSafeArea>
        {ForcedComponent ? (
          <View style={styles.componentHost}>
            <ForcedComponent {...queryProps} />
          </View>
        ) : (
          <MessageScreen text={`Component "${String(forcedComponentName)}" not found`} />
        )}
      </RootSafeArea>
    )
  }

  if (galleryMode === 'preview_list') {
    return (
      <RootSafeArea>
        <View style={styles.webRootContainer}>
          <PreviewList names={names} components={components} queryProps={queryProps} />
        </View>
      </RootSafeArea>
    )
  }

  const initial =
    initialComponent && names.includes(initialComponent) ? initialComponent : names[0]

  const [active, setActive] = React.useState(initial)
  const Active = active ? components[active]?.registeredComponent : undefined

  return (
    <RootSafeArea>
      <View style={styles.webRootContainer}>
        <TopBar names={names} active={active} onSelect={setActive} />
        {Active ? (
          <View style={styles.componentHost}>
            <Active {...queryProps} />
          </View>
        ) : (
          <MessageScreen text={`Component "${String(active)}" not found`} />
        )}
      </View>
    </RootSafeArea>
  )
}

const styles = StyleSheet.create({
  safeAreaProvider: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webRootContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // shared host that forces a white background behind any component
  componentHost: {
    flex: 1,
    backgroundColor: '#fff',
  },

  topBar: {
    backgroundColor: '#0f0f0f',
    borderBottomWidth: 1,
    borderColor: '#232323',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  chipBase: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    borderColor: HIGHLIGHT,
    backgroundColor: 'rgba(55, 255, 149, 0.14)',
  },
  chipUnselected: {
    borderColor: '#2a2a2a',
    backgroundColor: 'transparent',
  },
  chipPressed: {
    backgroundColor: '#1a1a1a',
  },
  chipText: {
    color: '#e5e5e5',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: HIGHLIGHT,
    fontWeight: '600',
  },

  messageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    fontSize: 16,
  },

  // preview list mode
  previewList: {
    flex: 1,
    backgroundColor: '#fff',
  },
  previewListContent: {
    padding: 12,
    paddingBottom: 24,
  },
  previewItem: {
    marginBottom: 16,
  },

  previewCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },

  previewFrame: {
    width: '100%',
    aspectRatio: 9 / 20, // width / height
    backgroundColor: '#fff',
    overflow: 'hidden',
  },

  previewFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e6e6e6',
    backgroundColor: '#37ff95',
  },

  previewFooterButton: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    cursor: 'pointer',
  },
  previewFooterButtonHovered: {
    backgroundColor: '#f5f5f5',
  },
  previewFooterButtonPressed: {
    backgroundColor: '#f0f0f0',
  },

  footerRow: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  footerTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
  },

  previewLinkText: {
    fontSize: 12,
    color: '#111',
    opacity: 0.85,
    textAlign: 'center',
    fontWeight: '600',
  },

  previewLinkName: {
    fontWeight: '800',
  },

  copyIconWrap: {
    marginLeft: 8,
    opacity: 0.85,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyIconWrapVisible: {
    opacity: 0.85,
  },

  copyIconSvg: {
    verticalAlign: 'middle',
  },

  tooltip: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: '#111',
    opacity: 0.92,
    zIndex: 10,
    alignSelf: 'center',
  },
  tooltipCopied: {
    backgroundColor: '#111',
  },
  tooltipText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
  },
})

const WEB_APP_NAME = 'web_root'
AppRegistry.registerComponent(WEB_APP_NAME, () => WebRoot)
AppRegistry.runApplication(WEB_APP_NAME, {
  rootTag,
  initialProps: {
    components: componentMapping,
    initialComponent: defaultComponentName,
    forcedComponentName,
    queryProps,
    galleryMode,
  },
})
