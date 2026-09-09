import { createContext, useContext, useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { getDarkModeEnabled, setDarkModeEnabled } from '../lib/themePreference'

type ThemeModeContextValue = {
  isDark: boolean
  setDark: (value: boolean) => void
}

const ThemeModeContext = createContext<ThemeModeContextValue>({ isDark: false, setDark: () => {} })

// A manual, user-controlled light/dark switch (the Account screen's "Dark
// Mode" toggle) - defaults to light regardless of the OS scheme, since this
// is an explicit choice for the user to make rather than something the app
// silently follows.
export function ThemeModeProvider({ children }: PropsWithChildren) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    getDarkModeEnabled().then(setIsDark)
  }, [])

  function setDark(value: boolean) {
    setIsDark(value)
    void setDarkModeEnabled(value)
  }

  return <ThemeModeContext.Provider value={{ isDark, setDark }}>{children}</ThemeModeContext.Provider>
}

export function useThemeMode() {
  return useContext(ThemeModeContext)
}
