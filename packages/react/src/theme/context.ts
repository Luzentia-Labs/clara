import { createContext, useContext } from 'react'
import type { ClaraSettings } from './resolve'

/**
 * Theme and density travel through React context, not DOM inheritance (TRD ADR-006).
 *
 * DOM inheritance cannot work: every overlay portals to `document.body`, so it leaves the themed
 * subtree in the DOM while remaining a descendant in the React tree. Context follows the component
 * tree, which is the tree that actually describes ownership.
 */
export const ClaraSettingsContext = createContext<ClaraSettings | null>(null)

/** The resolved theme and density at this point in the tree. */
export function useClaraSettings (): ClaraSettings {
  return useContext(ClaraSettingsContext) ?? { theme: 'light', density: 'comfortable' }
}
