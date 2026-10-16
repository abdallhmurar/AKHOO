import type { ActivityLevel } from '../../lib/activityLevel'
export type PointsPanelProps = { balance: number; count: number; target: number; level: ActivityLevel; levelLabel: string; remainingLabel: string }
export type IdentityProps = { name: string; email: string; avatar?: string | null; busy: boolean; onPhoto: () => void; onEdit: () => void }
export function PointsPanel(_props: PointsPanelProps) { return null }
export function AccountIdentity(_props: IdentityProps) { return null }
export function AccountHeading(_props: { title: string; subtitle: string }) { return null }
