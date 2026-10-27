import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImpactTreeFallback } from './ImpactTreeFallback'
import type { ImpactTreeProps } from './ImpactTree.types'
import type { createImpactTreeScene } from './impactTreeScene'

export function ImpactTree({ count, size, active }: ImpactTreeProps) {
  const { t } = useTranslation()
  const host = useRef<HTMLButtonElement>(null), canvas = useRef<HTMLCanvasElement>(null)
  const scene = useRef<ReturnType<typeof createImpactTreeScene> | null>(null)
  const currentCount = useRef(count)
  const [ready, setReady] = useState(false)
  useEffect(() => { currentCount.current = count; scene.current?.setCount(count) }, [count])
  useEffect(() => {
    if (!active) return
    let cancelled = false, dispose = () => {}
    void import('./impactTreeScene').then(({ createImpactTreeScene }) => {
      if (cancelled || !canvas.current || !host.current) return
      const media = matchMedia('(prefers-reduced-motion: reduce)')
      let visible = false
      let model: ReturnType<typeof createImpactTreeScene> | null = null
      const sync = () => model?.setEnabled(visible && !document.hidden, media.matches)
      const resize = new ResizeObserver(([entry]) => { if (entry) model?.resize(entry.contentRect.width, entry.contentRect.height) })
      const observer = new IntersectionObserver(([entry]) => { visible = !!entry?.isIntersecting; sync() })
      dispose = () => {
        resize.disconnect(); observer.disconnect(); document.removeEventListener('visibilitychange', sync); media.removeEventListener('change', sync)
        model?.dispose(); scene.current = null
      }
      model = createImpactTreeScene(canvas.current, currentCount.current, () => { dispose(); setReady(false) })
      scene.current = model
      resize.observe(host.current); observer.observe(host.current)
      document.addEventListener('visibilitychange', sync); media.addEventListener('change', sync)
      setReady(true)
    }).catch(() => { dispose(); if (!cancelled) setReady(false) })
    return () => { cancelled = true; dispose(); setReady(false) }
  }, [active])
  return <button ref={host} type="button" aria-label={`${t('perks.impactTree.accessibility', { count })}. ${t('perks.impactTree.hint')}`}
    onClick={() => scene.current?.celebrate()} onPointerMove={event => {
      if (event.pointerType !== 'mouse') return
      const b = event.currentTarget.getBoundingClientRect()
      scene.current?.tilt((event.clientX - b.left) / b.width - .5, (event.clientY - b.top) / b.height - .5)
    }} onPointerLeave={() => scene.current?.tilt(0, 0)}
    style={{ position: 'relative', width: size, height: size * 1.2, flexShrink: 0, padding: 0, border: 0, borderRadius: 24, background: 'transparent', cursor: 'pointer', touchAction: 'manipulation', outlineOffset: -4 }}>
    <span aria-hidden="true" style={{ display: 'flex', visibility: ready ? 'hidden' : 'visible' }}><ImpactTreeFallback count={count} size={size} /></span>
    <canvas key={String(active)} ref={canvas} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: ready ? 1 : 0, pointerEvents: 'none' }} />
  </button>
}
