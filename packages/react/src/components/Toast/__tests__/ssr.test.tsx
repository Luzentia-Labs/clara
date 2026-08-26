import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Toast } from '../Toast'

/**
 * A server render must be silent.
 *
 * `useLayoutEffect` does nothing on the server, and React warns about it - a review measured 208
 * warnings across 203 server renders of a Toast. `ClaraPortal` already carries the repo's idiom for
 * this (`typeof document === 'undefined' ? useEffect : useLayoutEffect`); Toast now uses it too.
 *
 * PRD F23 is why this matters beyond noise: the library is meant to render on the server, and a
 * component that fills the log on every request teaches its consumers to ignore the log.
 */
describe('Toast renders on the server', () => {
  it('emits no React warning', () => {
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const html = renderToStaticMarkup(<Toast open onClose={() => {}} title="Posted" />)
      expect(html, 'a portalled surface must render nothing on the server').toBe('')
      const said = warn.mock.calls.flat().join(' ')
      expect(said, 'a server render warned about useLayoutEffect').not.toMatch(/useLayoutEffect/)
    } finally {
      warn.mockRestore()
    }
  })
})
