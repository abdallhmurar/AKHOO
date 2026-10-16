import type { CSSProperties, ReactNode } from 'react'

export type MotionSceneProps = { name: string; className?: string; style?: CSSProperties; fit?: 'contain' | 'cover'; children?: ReactNode }
// Native retains its existing presentation; web resolves Motion.web.tsx.
export function MotionScene(_props: MotionSceneProps) { return null }
export function MotionControls() { return null }
export function MotionHeader(_props: { children?: ReactNode; kind?: 'road' | 'request' | 'details' }) { return null }
export function PerksHeader() { return null }
export function ArtIcon(_props: { name: string; size?: number }) { return null }
export function IconCredits() { return null }
