import type { ImageSourcePropType } from 'react-native'

export type IllustrationScene = 'login' | 'signup' | 'forgotPassword' | 'roleSelection' | 'requestHelp' | 'volunteer' | 'searching' | 'success'

export type IllustrationAccent = 'forest' | 'sage' | 'sand'

export type IllustrationSpec = {
  gradientColors: [string, string, ...string[]]
  accent: IllustrationAccent
  // Left undefined until real artwork exists - IllustrationHero renders the
  // gradient + shape placeholder below and swaps to this Image once set, with
  // no change needed to any screen that consumes it.
  imageSource?: ImageSourcePropType
}

export const illustrations: Record<IllustrationScene, IllustrationSpec> = {
  login: { gradientColors: ['#EAF0EA', '#CFDFCF', '#8FAE97'], accent: 'forest' },
  signup: { gradientColors: ['#F5EBD6', '#E3D3A8', '#B79A64'], accent: 'sand' },
  forgotPassword: { gradientColors: ['#EAF0EA', '#C7DACB', '#7C9B85'], accent: 'sage' },
  roleSelection: { gradientColors: ['#F7F3EA', '#E3D3A8', '#8FAE97'], accent: 'sand' },
  requestHelp: { gradientColors: ['#EAF0EA', '#C7DACB', '#6F927D'], accent: 'sage' },
  volunteer: { gradientColors: ['#EAF0EA', '#B9CFBE', '#315E48'], accent: 'forest' },
  searching: { gradientColors: ['#EAF0EA', '#CFDFCF', '#8FAE97'], accent: 'forest' },
  success: { gradientColors: ['#F5EBD6', '#E3D3A8', '#2F9D70'], accent: 'sage' }
}
