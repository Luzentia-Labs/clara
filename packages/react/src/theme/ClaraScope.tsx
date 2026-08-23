import type { ReactNode } from 'react'
import { ClaraSettingsContext, useClaraSettings } from './context'
import { claraAttributes, resolveDensity, resolveTheme, type Density, type ThemePreference } from './resolve'
import { useSystemTheme } from './useSystemTheme'

export interface ClaraScopeProps {
  children?: ReactNode
  theme?: ThemePreference
  density?: Density
}

/**
 * A subtree with its own theme or density. Anything not given is inherited, so a scope that only
 * changes density keeps the theme it was placed in.
 */
export function ClaraScope ({ children, theme, density }: ClaraScopeProps) {
  const inherited = useClaraSettings()
  const system = useSystemTheme(theme === 'system')
  const settings = {
    theme: resolveTheme(theme, inherited.theme, system),
    density: resolveDensity(density, inherited.density),
  }
  return (
    <ClaraSettingsContext.Provider value={settings}>
      <div {...claraAttributes(settings)}>{children}</div>
    </ClaraSettingsContext.Provider>
  )
}
