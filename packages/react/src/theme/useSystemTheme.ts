import { useEffect, useState } from 'react'

/**
 * The OS colour-scheme preference, resolved in an EFFECT.
 *
 * Never read during render: the same render runs on the server, where `matchMedia` does not exist,
 * and PRD F23 forbids a component reading a browser API while rendering. The cost is that a
 * `system` tree paints its default first and corrects after mount - which is why the documented
 * no-flash pattern is to resolve the theme on the server and pass it explicitly.
 */
export function useSystemTheme (enabled: boolean) {
  const [system, setSystem] = useState<'light' | 'dark' | undefined>(undefined)
  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !window.matchMedia) return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => setSystem(query.matches ? 'dark' : 'light')
    apply()
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [enabled])
  return system
}
