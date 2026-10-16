import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { createRewardsGift } from './rewardsGiftScene.web'

type GiftScene = ReturnType<typeof createRewardsGift>

export function RewardsGift({ active, label, artwork, onFallback }: { active: boolean; label: string; artwork: string; onFallback: () => void }) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<GiftScene | null>(null)
  const activeRef = useRef(active)
  const syncRef = useRef<(() => void) | null>(null)
  const [ready, setReady] = useState(false)
  const [celebrating, setCelebrating] = useState(false)

  useEffect(() => {
    activeRef.current = active
    syncRef.current?.()
  }, [active])

  useEffect(() => {
    const button = buttonRef.current, canvas = canvasRef.current
    if (!button || !canvas) return
    let disposed = false, visible = false, loading = false, unavailable = false
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const resize = () => {
      const bounds = button.getBoundingClientRect()
      sceneRef.current?.resize(bounds.width, bounds.height)
    }
    const sync = () => {
      const enabled = activeRef.current && visible && !document.hidden
      sceneRef.current?.setEnabled(enabled, preference.matches)
      if (!enabled || loading || unavailable || sceneRef.current) return
      loading = true
      void import('./rewardsGiftScene.web').then(({ createRewardsGift }) => {
        if (disposed) return
        sceneRef.current = createRewardsGift(canvas, () => {
          unavailable = true
          setReady(false)
        }, setCelebrating)
        resize()
        setReady(true)
        sceneRef.current.setEnabled(activeRef.current && visible && !document.hidden, preference.matches)
      }).catch(() => {
        if (!disposed) { unavailable = true; setReady(false) }
      })
    }
    syncRef.current = sync
    const intersection = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting)
      sync()
    }, { threshold: 0.1 })
    const observer = new ResizeObserver(resize)
    intersection.observe(button)
    observer.observe(button)
    preference.addEventListener('change', sync)
    document.addEventListener('visibilitychange', sync)
    return () => {
      disposed = true
      syncRef.current = null
      observer.disconnect()
      intersection.disconnect()
      preference.removeEventListener('change', sync)
      document.removeEventListener('visibilitychange', sync)
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [])

  return <button
    ref={buttonRef}
    className="akh-home-gift"
    type="button"
    aria-label={label}
    data-ready={ready}
    data-celebrating={celebrating}
    onClick={() => ready ? sceneRef.current?.celebrate() : onFallback()}
    style={{ '--gift-fallback': `url("${artwork}")` } as CSSProperties}
  >
    <span className="akh-home-gift-fallback" aria-hidden="true" />
    <canvas ref={canvasRef} aria-hidden="true" />
  </button>
}
