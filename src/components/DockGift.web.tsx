import { useEffect, useRef, useState } from 'react'
import type { createRewardsGift } from '../features/home/rewardsGiftScene.web'

const asset = require('./dock-assets/gift.png')
const poster: string = typeof asset === 'string' ? asset : asset.uri

// Same home-card model, without idle motion or delayed navigation.
export function DockGift({ active, press }: { active: boolean; press: number }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const scene = useRef<ReturnType<typeof createRewardsGift> | null>(null)
  const props = useRef({ active, press })
  const syncRef = useRef<(() => void) | null>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => { props.current = { active, press }; syncRef.current?.() }, [active, press])
  useEffect(() => {
    const target = canvas.current
    if (!target) return
    let disposed = false, loading = false, failed = false, visible = false, lastPress = 0
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const resize = () => { const bounds = target.getBoundingClientRect(); scene.current?.resize(bounds.width, bounds.height) }
    const sync = () => {
      const enabled = props.current.active && visible && !document.hidden
      scene.current?.setEnabled(enabled, motion.matches)
      if (enabled && scene.current && props.current.press !== lastPress) {
        lastPress = props.current.press
        if (!motion.matches) scene.current.celebrate()
      }
      if (!enabled || loading || failed || scene.current) return
      loading = true
      void import('../features/home/rewardsGiftScene.web').then(({ createRewardsGift }) => {
        if (disposed) return
        scene.current = createRewardsGift(target, () => { failed = true; setReady(false) }, () => {}, { idle: false })
        resize()
        setReady(true)
        sync()
      }).catch(() => { if (!disposed) { failed = true; setReady(false) } })
    }
    syncRef.current = sync
    const intersection = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); sync() })
    const observer = new ResizeObserver(resize)
    intersection.observe(target)
    observer.observe(target)
    motion.addEventListener('change', sync)
    document.addEventListener('visibilitychange', sync)
    return () => {
      disposed = true
      syncRef.current = null
      observer.disconnect(); intersection.disconnect()
      motion.removeEventListener('change', sync)
      document.removeEventListener('visibilitychange', sync)
      scene.current?.dispose(); scene.current = null
    }
  }, [])
  return <span className="akh-dock-gift" data-rendering={active && ready}>
    <img src={poster} alt="" draggable={false} />
    <canvas ref={canvas} aria-hidden="true" />
  </span>
}
