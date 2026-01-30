// web_root_preview_list.js
import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

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
  } catch (_) {}

  return false
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

function CopyIcon({ size = 15 }) {
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
  const tipTimer = React.useRef(null)

  const clearTipTimer = React.useCallback(() => {
    if (tipTimer.current) {
      clearTimeout(tipTimer.current)
      tipTimer.current = null
    }
  }, [])

  React.useEffect(() => {
    return () => clearTipTimer()
  }, [clearTipTimer])

  const showCopied = React.useCallback(() => {
    clearTipTimer()
    setTip('Copied')
    tipTimer.current = setTimeout(() => setTip(null), 1100)
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
        // if we're hovering, keep any tooltip alive
        clearTipTimer()
      }}
      onHoverOut={() => {
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

export function WebRootPreviewList({ names, components, queryProps = {} }) {
  return <PreviewList names={names} components={components} queryProps={queryProps} />
}

const styles = StyleSheet.create({
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

  componentHost: {
    flex: 1,
    backgroundColor: '#fff',
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

  messageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    fontSize: 16,
  },
})
