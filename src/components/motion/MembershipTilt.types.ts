import type { ReactNode } from 'react'
export type MembershipTiltProps = {
  front: ReactNode
  back: ReactNode
  height: number
  flipped: boolean
  onFlip: () => void
  active: boolean
  reduced: boolean
  label: string
  hint: string
}
