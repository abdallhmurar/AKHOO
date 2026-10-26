import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HelperMedalArtwork } from '../HelperMedalArtwork'
import { medalHint, REWARD_METALS, type RewardsMedalProps } from './RewardsMedal.types'
import type { createMedalScene } from './medalScene'

export function RewardsMedal({ level, size, active, label }: RewardsMedalProps) {
  const { i18n } = useTranslation()
  const host = useRef<HTMLButtonElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const scene = useRef<ReturnType<typeof createMedalScene> | null>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (level === 'none' || !active) return
    let cancelled = false
    let dispose = () => {}
    void import('./medalScene').then(({ createMedalScene }) => {
      if (cancelled || !canvas.current || !host.current) return
      const media = matchMedia('(prefers-reduced-motion: reduce)')
      let visible = false
      let model: ReturnType<typeof createMedalScene> | null = null
      const unavailable = () => { model?.dispose(); scene.current = null; setReady(false) }
      const sync = () => model?.setEnabled(visible && !document.hidden, media.matches)
      const resize = new ResizeObserver(([entry]) => {
        if (entry) model?.resize(entry.contentRect.width, entry.contentRect.height)
      })
      const observer = new IntersectionObserver(([entry]) => { visible = !!entry?.isIntersecting; sync() })
      dispose = () => {
        resize.disconnect(); observer.disconnect()
        document.removeEventListener('visibilitychange', sync); media.removeEventListener('change', sync)
        model?.dispose(); scene.current = null
      }
      model = createMedalScene(canvas.current, REWARD_METALS[level], unavailable, { hero: true })
      scene.current = model
      resize.observe(host.current); observer.observe(host.current)
      document.addEventListener('visibilitychange', sync); media.addEventListener('change', sync)
      setReady(true)
    }).catch(() => { dispose(); if (!cancelled) setReady(false) })
    return () => { cancelled = true; dispose(); setReady(false) }
  }, [level, active])
  return <button ref={host} type="button" aria-label={level === 'none' ? label : `${label}. ${medalHint(i18n.language)}`} disabled={level === 'none'}
    onClick={() => scene.current?.celebrate()} onPointerMove={event => {
      if (event.pointerType !== 'mouse') return
      const bounds = event.currentTarget.getBoundingClientRect()
      scene.current?.tilt((event.clientX - bounds.left) / bounds.width - .5, (event.clientY - bounds.top) / bounds.height - .5)
    }} onPointerLeave={() => scene.current?.tilt(0, 0)}
    style={{ position: 'relative', width: size, height: size * 1.25, flexShrink: 0, padding: 0, border: 0, borderRadius: 25, background: 'transparent', cursor: level === 'none' ? 'default' : 'pointer', touchAction: 'manipulation', outlineOffset: 2 }}>
    <span aria-hidden="true" style={{ display: 'flex', visibility: ready ? 'hidden' : 'visible' }}><HelperMedalArtwork level={level} size={size} /></span>
    <canvas key={`${level}-${active}`} ref={canvas} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: ready ? 1 : 0, pointerEvents: 'none' }} />
  </button>
}
