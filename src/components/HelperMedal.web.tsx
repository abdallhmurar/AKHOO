import { createElement, useCallback, useEffect, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { HelperMedalArtwork } from './HelperMedalArtwork'
import { ACTIVITY_LEVEL_COLORS, ACTIVITY_LEVEL_LABEL_KEYS, type ActivityLevel } from '../lib/activityLevel'
import { useMotionEnabled } from './motion/Motion.web'
import { useGuide } from '../features/guide/GuideProvider'

export function HelperMedal({ level, size = 52 }: { level: ActivityLevel; size?: number }) {
  const [focused, setFocused] = useState(false)
  const enabled = useMotionEnabled()
  const guide = useGuide()
  const { t } = useTranslation()
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false) }, []))
  useEffect(() => {
    if (level === 'none' || document.querySelector('script[data-akhoo-medal]')) return
    const script = document.createElement('script')
    script.type = 'module'; script.src = '/motion/medal-element.js'; script.dataset.akhooMedal = 'true'
    document.head.append(script)
  }, [level])
  // The unearned emblem remains unfilled, as it was before the visual transfer.
  if (level === 'none') return <HelperMedalArtwork level={level} size={size} />
  return createElement('akhoo-medal', {
    metal: level === 'silver' ? '#ced8e2' : ACTIVITY_LEVEL_COLORS[level], paused: String(!focused || !enabled || !!guide?.blocking),
    role: 'button', tabIndex: 0, 'aria-label': t(ACTIVITY_LEVEL_LABEL_KEYS[level]),
    style: { display: 'block', width: size, height: size * 1.25, flexShrink: 0, cursor: 'pointer', borderRadius: 20 }
  }, <HelperMedalArtwork level={level} size={size} />)
}
