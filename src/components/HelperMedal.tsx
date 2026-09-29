import { useId } from 'react'
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg'
import { ACTIVITY_LEVEL_COLORS, type ActivityLevel } from '../lib/activityLevel'
import { palette } from '../lib/theme'

/** The earned tier controls the metal; a new helper gets an unfilled emblem. */
export function HelperMedal({ level, size = 52 }: { level: ActivityLevel; size?: number }) {
  const id = useId().replace(/:/g, '')
  const metal = level === 'none' ? palette.slate300 : ACTIVITY_LEVEL_COLORS[level]
  const emblem = level === 'gold' || level === 'bronze' ? palette.goldPressed : level === 'green' ? palette.tealPressed : palette.slate600
  return (
    <Svg width={size} height={size * 1.25} viewBox="0 0 64 80" accessible={false}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={palette.white} />
          <Stop offset="0.55" stopColor={metal} />
          <Stop offset="1" stopColor={metal} />
        </LinearGradient>
      </Defs>
      <Path d="M8 2H25L39 35H23Z" fill={level === 'none' ? palette.slate200 : palette.signalBlue} />
      <Path d="M39 2H56L41 35H25Z" fill={level === 'none' ? palette.slate300 : palette.bluePressed} />
      <Circle cx="32" cy="51" r="26" fill={`url(#${id})`} stroke={metal} strokeWidth="2" />
      <Circle cx="32" cy="51" r="20" fill="none" stroke={palette.whiteAlpha60} strokeWidth="2" />
      <Path d="m32 36 4.5 9.4 10.4 1.5-7.5 7.3 1.8 10.3L32 59.6l-9.2 4.9 1.8-10.3-7.5-7.3 10.4-1.5Z" fill={level === 'none' ? 'none' : emblem} stroke={emblem} strokeWidth="2" />
    </Svg>
  )
}
