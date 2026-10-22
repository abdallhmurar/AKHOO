import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent, ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import type { BottomTabBarProps } from 'expo-router/js-tabs'
import { GuideTarget, useGuide } from '../features/guide/GuideProvider'
import { useIsRTL } from '../lib/direction'
import { useAppFont } from '../lib/typography'
import { space, useSanadTheme } from '../lib/theme'
import { DockGift } from './DockGift.web'
import './tabBar.web.css'

function assetUri(asset: unknown): string {
  return typeof asset === 'string' ? asset : (asset as { uri: string }).uri
}
const icons: Record<string, string> = {
  index: assetUri(require('./dock-assets/home.png')),
  activity: assetUri(require('./dock-assets/activity.png')),
  account: assetUri(require('./dock-assets/account.png'))
}

function DockTab({ selected, name, label, accessibilityLabel, testId, onPress, onLongPress, children }: {
  selected: boolean; name: string; label: string; accessibilityLabel?: string; testId?: string
  onPress: () => boolean; onLongPress: () => void; children: ReactNode
}) {
  const icon = useRef<HTMLSpanElement>(null)
  const longPress = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const consumed = useRef(false)
  const clearLongPress = () => { if (longPress.current) clearTimeout(longPress.current); longPress.current = null }
  useEffect(() => () => { if (longPress.current) clearTimeout(longPress.current) }, [])
  function startPress(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return
    clearLongPress()
    consumed.current = false
    pointer.current = { x: event.clientX, y: event.clientY }
    longPress.current = setTimeout(() => { consumed.current = true; onLongPress() }, 500)
  }
  function activate() {
    clearLongPress()
    if (consumed.current) { consumed.current = false; return }
    if (!onPress() || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const target = icon.current
    target?.getAnimations().forEach(animation => animation.cancel())
    target?.animate([
      { transform: 'translateY(0) scale(.9) rotate(0deg)' },
      { transform: `translateY(-4px) scale(1.13) rotate(${name === 'activity' ? -9 : 0}deg)`, offset: 0.36 },
      { transform: 'translateY(1px) scale(.98) rotate(0deg)', offset: 0.72 },
      { transform: 'translateY(0) scale(1) rotate(0deg)' }
    ], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' })
  }
  return <button className="akh-dock-tab" type="button" data-route={name} data-selected={selected}
    data-testid={testId} aria-label={accessibilityLabel ?? label} aria-current={selected ? 'page' : undefined}
    onClick={activate} onPointerDown={startPress} onPointerUp={clearLongPress}
    onPointerCancel={() => { clearLongPress(); consumed.current = false }}
    onPointerLeave={() => { clearLongPress(); consumed.current = false; pointer.current = null }}
    onPointerMove={event => { if (pointer.current && Math.hypot(event.clientX - pointer.current.x, event.clientY - pointer.current.y) > 10) clearLongPress() }}
    onContextMenu={event => { event.preventDefault(); clearLongPress(); if (!consumed.current) onLongPress() }}>
    <span className="akh-dock-tab-content"><span className="akh-dock-icon" ref={icon} aria-hidden="true">{children}</span>
      <span className="akh-dock-label">{label}</span></span>
  </button>
}

// Only web navigation changes; native TabBar.tsx remains separate.
export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const theme = useSanadTheme()
  const isRTL = useIsRTL()
  const font = useAppFont('semibold'), bold = useAppFont('bold')
  const guide = useGuide()
  const [giftPress, setGiftPress] = useState(0)
  const nav = useRef<HTMLElement>(null)
  const isHome = state.routes[state.index]?.name === 'index'
  useLayoutEffect(() => {
    const node = nav.current
    if (!node) return
    const update = () => {
      const selected = node.querySelector<HTMLButtonElement>('[data-selected=true]')
      if (!selected) return
      node.style.setProperty('--indicator-x', `${selected.offsetLeft}px`)
      node.style.setProperty('--indicator-width', `${selected.offsetWidth}px`)
      node.dataset.ready = 'true'
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    node.querySelectorAll('button').forEach(button => observer.observe(button))
    return () => observer.disconnect()
  }, [state.index, state.routes.length, isRTL])
  return <GuideTarget id="navigation">
    <View style={[styles.wrap, { backgroundColor: isHome && !theme.isDark ? '#F2FBFF' : theme.colors.background, paddingBottom: Math.max(insets.bottom, space.sm) }]}>
      <div className="akh-dock-shell" dir={isRTL ? 'rtl' : 'ltr'} data-dark={theme.isDark}
        style={{ '--dock-font': font, '--dock-bold': bold, maxWidth: isHome ? 448 : 560 } as CSSProperties}>
        <nav ref={nav} className="akh-dock" aria-label="Navigation">
          <span className="akh-dock-indicator" aria-hidden="true" />
          {state.routes.map((route, index) => {
            const descriptor = descriptors[route.key]
            if (!descriptor) return null
            const { options } = descriptor
            const selected = state.index === index
            const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : (options.title ?? route.name)
            return <DockTab key={route.key} name={route.name} selected={selected}
              label={label} accessibilityLabel={options.tabBarAccessibilityLabel} testId={options.tabBarButtonTestID}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
                if (event.defaultPrevented) return false
                if (route.name === 'community') setGiftPress(value => value + 1)
                if (!selected) { Haptics.selectionAsync().catch(() => {}); navigation.navigate(route.name) }
                return true
              }}>
              {route.name === 'community'
                ? <DockGift active={selected && !guide?.blocking} press={giftPress} />
                : icons[route.name]
                  ? <img src={icons[route.name]} alt="" draggable={false} width={32} height={32} />
                  : options.tabBarIcon?.({ focused: selected, color: selected ? '#FFFFFF' : '#526A80', size: 28 })}
            </DockTab>
          })}
        </nav>
      </div>
    </View>
  </GuideTarget>
}
const styles = StyleSheet.create({ wrap: { paddingHorizontal: space.sm, paddingTop: space.sm } })
