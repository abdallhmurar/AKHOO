import Svg, { Ellipse, G, Path } from 'react-native-svg'
import { treeGrowth } from './impactTreeGrowth'

// A lightweight, count-aware fallback when WebGL is unavailable or suspended.
export function ImpactTreeFallback({ count, size }: { count: number; size: number }) {
  const growth = treeGrowth(count)
  const canopy = (cx: number, cy: number, scale: number) => <G transform={`translate(${cx},${cy}) scale(${scale})`}>
    {Array.from({ length: 58 }, (_, i) => {
      const angle = i * 2.4, radius = Math.sqrt((i + 1) / 58)
      const x = Math.cos(angle) * radius * 43, y = Math.sin(angle) * radius * 27
      return <Ellipse key={i} cx={x} cy={y} rx={7} ry={11} transform={`rotate(${angle * 57.3} ${x} ${y})`} fill={['#248773', '#57a767', '#81b95c', '#156f62'][i % 4]} />
    })}
  </G>
  return <Svg width={size} height={size * 1.2} viewBox="0 0 210 252">
    <Ellipse cx={105} cy={226} rx={69} ry={11} fill="#d3e6e4" />
    <Ellipse cx={105} cy={219} rx={63} ry={14} fill="#79a76b" />
    <G transform={`translate(105,217) scale(${.3 + growth.trunk * .7},${growth.trunk}) translate(-105,-217)`}>
      <Path d="M94 218 C119 196 117 173 99 155 C85 138 99 112 102 80 L112 78 C103 116 100 136 111 149 C138 181 119 208 119 218 Z" fill="#a27e51" />
      <Path d="M108 218 C127 186 111 166 105 158 C94 140 102 107 108 83" stroke="#d4af7a" strokeWidth={3} fill="none" />
      <G opacity={growth.left}><Path d="M103 156 Q69 170 53 139" stroke="#a27e51" strokeWidth={8} fill="none" />{canopy(49, 134, .72 * growth.left)}</G>
      <G opacity={growth.right}><Path d="M120 185 Q144 164 159 140" stroke="#a27e51" strokeWidth={9} fill="none" />{canopy(163, 142, .72 * growth.right)}</G>
      {canopy(105, 79, growth.crown)}
    </G>
    <Ellipse cx={79} cy={216} rx={12} ry={7} fill="#acb6a1" /><Ellipse cx={143} cy={216} rx={10} ry={6} fill="#9fae99" />
  </Svg>
}
