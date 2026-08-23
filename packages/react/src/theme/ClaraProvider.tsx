import { useEffect, useState, type ReactNode } from 'react'
import { ClaraSettingsContext } from './context'
import { claraAttributes, resolveDensity, resolveTheme, type Density, type ThemePreference } from './resolve'
import { useSystemTheme } from './useSystemTheme'

export interface ClaraProviderProps {
  children?: ReactNode
  /** `system` follows the OS preference. Omit for `light`. */
  theme?: ThemePreference
  density?: Density
}

/**
 * The root of a Clara tree.
 *
 * `system` is resolved in an EFFECT, never during render - nothing may read `matchMedia` while
 * rendering, because that render also happens on the server (PRD F23). The consequence is that a
 * `system` provider paints its default first and corrects after mount, which is a flash. The
 * documented way to avoid it is to resolve the theme on the server from a cookie and pass it
 * explicitly; `theme="system"` is the convenience, not the recommendation.
 */
export function ClaraProvider ({ children, theme, density }: ClaraProviderProps) {
  const system = useSystemTheme(theme === 'system')
  const settings = {
    theme: resolveTheme(theme, undefined, system),
    density: resolveDensity(density, undefined),
  }
  return (
    <ClaraSettingsContext.Provider value={settings}>
      <div {...claraAttributes(settings)}>{children}</div>
    </ClaraSettingsContext.Provider>
  )
}
