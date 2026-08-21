import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

// shadcn/ui semantic slots resolve through CSS variables defined in
// src/index.css (HSL triplets converted from ../src/lib/theme.ts's exact
// hex palette - the mobile app's single source of truth). The raw
// `sanad.*` scale below is hardcoded hex for direct use outside the
// shadcn slot system (status badges, Activity Star colors, charts, map
// markers) where a literal color string is more convenient than a
// CSS-variable-backed Tailwind class.
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        sanad: {
          bg: '#F7F3EA',
          surface: '#FFFFFF',
          surfaceMuted: '#FBF9F4',
          forest: '#315E48',
          forestPressed: '#274C3A',
          sage: '#6F927D',
          sageSoft: '#EAF0EA',
          sand: '#D4B06A',
          sandSoft: '#F5EBD6',
          text: '#20342A',
          muted: '#6E7C74',
          border: '#E2E5E1',
          success: '#2F9D70',
          successSoft: '#E4F5EC',
          warning: '#D99B37',
          warningSoft: '#FBF0DD',
          danger: '#D95C5C',
          dangerSoft: '#FBEAEA',
          info: '#4C7A9C',
          infoSoft: '#E9F1F6'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)'
      },
      fontFamily: {
        sans: ['Tajawal', 'system-ui', 'sans-serif']
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [animate]
} satisfies Config
