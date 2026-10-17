import type { ReactNode } from 'react'
import type { MotionSceneProps } from './Motion.types'
export type { MotionSceneProps } from './Motion.types'

// Native retains its existing presentation; web resolves Motion.web.tsx.
export function MotionScene(_props: MotionSceneProps) { return null }
export function MotionHeader(_props: { children?: ReactNode; kind?: 'road' | 'request' | 'details' }) { return null }
export function PerksHeader() { return null }
export function ArtIcon(_props: { name: string; size?: number }) { return null }
export function IconCredits() { return null }
