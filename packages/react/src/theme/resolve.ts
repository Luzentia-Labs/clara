export type Theme = 'light' | 'dark'
export type ThemePreference = Theme | 'system'
export type Density = 'comfortable' | 'compact'

export interface ClaraSettings { theme: Theme, density: Density }

/**
 * The resolved theme, as a pure function of the three inputs that decide it.
 *
 * Pure and separate from the component on purpose: "explicit wins over system" and "system wins
 * over the default" are the rules an SSR render and a client render must agree on exactly, and a
 * rule that lives inside a component can only be tested by rendering one.
 *
 * `system` is resolved by the CALLER, never read here - nothing in this file may touch
 * `matchMedia`, because it runs during a server render (PRD F23).
 */
export function resolveTheme (
  preference: ThemePreference | undefined,
  inherited: Theme | undefined,
  system: Theme | undefined,
): Theme {
  if (preference === 'light' || preference === 'dark') return preference
  if (preference === 'system') return system ?? inherited ?? 'light'
  return inherited ?? 'light'
}

/** Density has no `system` source; it inherits or defaults. */
export function resolveDensity (preference: Density | undefined, inherited: Density | undefined): Density {
  return preference ?? inherited ?? 'comfortable'
}

/** The attributes a themed element - or a portal root - must carry. */
export function claraAttributes ({ theme, density }: ClaraSettings) {
  return { 'data-clara-theme': theme, 'data-clara-density': density }
}
