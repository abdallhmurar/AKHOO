import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useFocusEffect } from 'expo-router'
import { useTranslation } from 'react-i18next'
import type { MotionSceneProps } from './Motion'
import { useGuide } from '../../features/guide/GuideProvider'
import './motion.css'

export function MotionScene({ name, className = '', style, fit = 'cover', children }: MotionSceneProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const [focused, setFocused] = useState(false)
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false) }, []))
  const guide = useGuide()
  const file = name === 'perks' ? 'assets/perks/header-people-motion-v3' : name === 'help' || name === 'helper-home' ? `assets/${name === 'help' ? 'help' : 'helper'}-3d` : name === 'helper' ? 'helper/assets/helper' : `requester/assets/${name}`
  const poster = `/motion/${file}${['perks', 'help', 'helper-home'].includes(name) ? '-poster' : ''}.png`
  useEffect(() => {
    const video = ref.current
    if (!video) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let visible = false, disposed = false, failed = false
    const canPlay = () => !disposed && !failed && visible && focused && !guide?.blocking && !document.hidden && !reduced.matches
    const sync = () => {
      if (!canPlay()) { video.pause(); return }
      if (video.getAttribute('src') !== `/motion/${file}.mp4`) video.src = `/motion/${file}.mp4`
      video.muted = true
      void video.play().then(() => { if (!canPlay()) video.pause() }).catch(() => {})
    }
    const error = () => { failed = true; video.pause(); video.removeAttribute('src'); video.load() }
    const observer = new IntersectionObserver(([entry]) => { visible = !!entry?.isIntersecting; sync() }, { threshold: 0.08 })
    observer.observe(video)
    document.addEventListener('visibilitychange', sync)
    reduced.addEventListener('change', sync)
    video.addEventListener('error', error)
    return () => { disposed = true; observer.disconnect(); video.pause(); document.removeEventListener('visibilitychange', sync); reduced.removeEventListener('change', sync); video.removeEventListener('error', error) }
  }, [file, focused, guide?.blocking])
  return <div className={`akhoo-motion motion-scene ${className}`} style={style}>
    <video key={file} ref={ref} muted loop playsInline preload="none" poster={poster} disablePictureInPicture tabIndex={-1} aria-hidden="true" style={{ objectFit: fit }} />
    {children}
  </div>
}

export function MotionHeader({ children, kind = 'details' }: { children?: ReactNode; kind?: 'road' | 'request' | 'details' }) {
  const src = kind === 'road' ? 'assets/road-header.png' : `requester/assets/${kind === 'request' ? 'header' : 'details-header'}.png`
  return <div className={`akhoo-motion motion-header motion-header-${kind}`}><img src={`/motion/${src}`} alt="" /><div className="motion-header-content">{children}</div></div>
}

export function PerksHeader() {
  const { t, i18n } = useTranslation()
  const arabic = i18n.language.startsWith('ar')
  return <header className={`akhoo-motion perks-motion-header ${arabic ? '' : 'translated'}`}>
    <MotionScene name="perks" fit="contain" />
    {arabic ? <h1 className="motion-sr-only">{t('perks.title')}</h1> : <div className="perks-translated-copy"><h1>{t('perks.title')}</h1><p>{t('perks.hubSubtitle')}</p></div>}
  </header>
}

export function ArtIcon({ name, size = 32 }: { name: string; size?: number }) {
  const directory = ['compass', 'globe', 'moon'].includes(name) ? 'account/assets' : name === 'rating-star' ? 'helper/assets' : 'activity/assets/icons'
  return <img src={`/motion/${directory}/${name}.png`} alt="" width={size} height={size} className="motion-art-icon" />
}
export function IconCredits() {
  return <small className="akhoo-motion motion-credits" dir="ltr">Icons by <a href="https://www.flaticon.com/free-icon/trophy_7937805" target="_blank" rel="noreferrer">setiawanap</a>, <a href="https://www.flaticon.com/free-icon/car-battery_3294292" target="_blank" rel="noreferrer">IconMarketPK</a>, <a href="https://www.flaticon.com/free-icon/handshake_8635541" target="_blank" rel="noreferrer">smashingstocks</a>, <a href="https://www.flaticon.com/free-icon/user_1077012" target="_blank" rel="noreferrer">Magnific</a>, <a href="https://www.flaticon.com/free-icon/world-globe_3516105" target="_blank" rel="noreferrer">DinosoftLabs</a>, <a href="https://www.flaticon.com/free-icon/compass_187758" target="_blank" rel="noreferrer">Roundicons</a>, <a href="https://www.flaticon.com/free-icon/fuel-pump_9084001" target="_blank" rel="noreferrer">VectorPortal</a>, <a href="https://www.flaticon.com/free-icon/star_1828884" target="_blank" rel="noreferrer">Pixel perfect</a> · <a href="https://www.flaticon.com" target="_blank" rel="noreferrer">Flaticon</a></small>
}
