import { ImpactTreeFallback } from './ImpactTreeFallback'
import type { ImpactTreeProps } from './ImpactTree.types'
export function ImpactTree({ count, size }: ImpactTreeProps) { return <ImpactTreeFallback count={count} size={size} /> }
