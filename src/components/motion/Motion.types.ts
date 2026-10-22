import type { CSSProperties, ReactNode } from 'react'

export type MotionSceneProps = { name: string; className?: string; style?: CSSProperties; fit?: 'contain' | 'cover'; children?: ReactNode }
