import { useEffect, useRef } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import type { MembershipTiltProps } from './MembershipTilt.types'

export function MembershipTilt({ front, back, height, flipped, onFlip, active, reduced, label, hint }: MembershipTiltProps) {
  const plane = useRef<HTMLDivElement>(null)
  const origin = useRef<{ x: number; y: number } | null>(null)
  const reset = () => { plane.current?.style.removeProperty('--rx'); plane.current?.style.removeProperty('--ry') }
  useEffect(() => { if (!active || reduced) reset() }, [active, reduced])
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    if (!active || reduced || flipped) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1))
    const y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1))
    plane.current?.style.setProperty('--rx', `${-y * 4}deg`)
    plane.current?.style.setProperty('--ry', `${x * 6 - 5}deg`)
  }
  const face: CSSProperties = { position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 22, overflow: 'hidden' }
  return <button type="button" aria-label={label} aria-description={hint} aria-pressed={flipped} data-membership-face={flipped ? 'back' : 'front'}
    onClick={event => { if (event.detail > 0 && origin.current && Math.abs(event.clientX - origin.current.x) > 12) return; reset(); onFlip() }}
    onPointerDown={event => { origin.current = { x: event.clientX, y: event.clientY } }}
    onPointerMove={move} onPointerUp={reset} onPointerCancel={reset} onPointerLeave={reset}
    style={{ display: 'block', position: 'relative', width: '100%', height, padding: 0, border: 0, background: 'transparent', cursor: 'pointer', touchAction: 'pan-y', outlineOffset: 5, borderRadius: 23 }}>
    <div ref={plane} style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d',
      transform: reduced ? 'none' : `perspective(1000px) rotateX(var(--rx, -2deg)) rotateY(calc(var(--ry, -5deg) + ${flipped ? 180 : 0}deg)) rotateZ(1deg)`,
      transition: reduced ? 'none' : 'transform 450ms cubic-bezier(.2,.75,.25,1)', borderRadius: 22,
      boxShadow: '0 13px 19px -8px rgba(10,55,78,.32), -3px 2px 0 #a37d3a' }}>
      <div aria-hidden={flipped} style={{ ...face, visibility: reduced && flipped ? 'hidden' : 'visible' }}>{front}</div>
      <div aria-hidden={!flipped} style={{ ...face, transform: reduced ? 'none' : 'rotateY(180deg)', visibility: reduced && !flipped ? 'hidden' : 'visible' }}>{back}</div>
    </div>
  </button>
}
