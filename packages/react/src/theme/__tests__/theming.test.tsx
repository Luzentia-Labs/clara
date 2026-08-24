import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ClaraProvider } from '../ClaraProvider'
import { ClaraScope } from '../ClaraScope'
import { ClaraPortal } from '../ClaraPortal'
import { resolveTheme, resolveDensity } from '../resolve'

/**
 * Pretend the OS has a colour-scheme preference. jsdom has no matchMedia.
 *
 * Returns a handle that MUTATES the same query object the component subscribed to. Re-stubbing the
 * global instead would leave the live listener holding the previous query, so a change would be
 * announced and then read back as the old value - the test would pass or fail for reasons that
 * have nothing to do with the component.
 */
function mockSystem (prefersDark: boolean) {
  const listeners = new Set<() => void>()
  const query = {
    matches: prefersDark,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  }
  vi.stubGlobal('matchMedia', (q: string) => (q.includes('dark') ? query : { ...query, matches: false }))
  return {
    set (next: boolean) { query.matches = next; for (const fn of listeners) fn() },
  }
}
afterEach(() => vi.unstubAllGlobals())

describe('theme follows system preference', () => {
  it.each([[true, 'dark'], [false, 'light']] as const)('prefers-color-scheme dark=%s resolves to %s', async (dark, expected) => {
    mockSystem(dark)
    const { container } = render(<ClaraProvider theme="system">x</ClaraProvider>)
    await waitFor(() => {
      expect(container.firstElementChild).toHaveAttribute('data-clara-theme', expected)
    })
  })

  it('follows a later change of the system preference', async () => {
    const system = mockSystem(false)
    const { container } = render(<ClaraProvider theme="system">x</ClaraProvider>)
    await waitFor(() => expect(container.firstElementChild).toHaveAttribute('data-clara-theme', 'light'))
    system.set(true)
    await waitFor(() => expect(container.firstElementChild).toHaveAttribute('data-clara-theme', 'dark'))
  })
})

describe('explicit theme wins', () => {
  it('ignores the system preference when a theme is given', async () => {
    mockSystem(true)
    const { container } = render(<ClaraProvider theme="light">x</ClaraProvider>)
    await waitFor(() => expect(container.firstElementChild).toHaveAttribute('data-clara-theme', 'light'))
  })

  it.each([
    [{ preference: 'dark', inherited: 'light', system: 'light' }, 'dark'],
    [{ preference: 'system', inherited: 'light', system: 'dark' }, 'dark'],
    [{ preference: undefined, inherited: 'dark', system: 'light' }, 'dark'],
    [{ preference: undefined, inherited: undefined, system: undefined }, 'light'],
  ] as const)('resolveTheme(%j) is %s', (input, expected) => {
    expect(resolveTheme(input.preference, input.inherited, input.system)).toBe(expected)
  })

  it('inherits what a scope does not override', () => {
    expect(resolveDensity(undefined, 'compact')).toBe('compact')
    expect(resolveTheme(undefined, 'dark', undefined)).toBe('dark')
  })
})

describe('portal inherits scoped theme', () => {
  // The case DOM inheritance cannot handle: the portal leaves the themed subtree in the DOM but
  // stays a descendant in the React tree, so only context can carry the setting to it.
  it('renders portalled content with the theme of where it was written, not the page', async () => {
    render(
      <ClaraProvider theme="light" density="comfortable">
        <ClaraScope theme="dark" density="compact">
          <ClaraPortal><span data-testid="overlay">content</span></ClaraPortal>
        </ClaraScope>
      </ClaraProvider>,
    )
    const overlay = await screen.findByTestId('overlay')
    const host = overlay.closest('[data-clara-theme]')
    expect(host).toHaveAttribute('data-clara-theme', 'dark')
    expect(host).toHaveAttribute('data-clara-density', 'compact')
    // And it really did leave the provider's subtree - which is why this had to be context.
    expect(overlay.closest('[data-clara-theme="light"]')).toBeNull()
  })

  it('a scope that changes only density keeps the inherited theme', async () => {
    render(
      <ClaraProvider theme="dark">
        <ClaraScope density="compact"><ClaraPortal><span data-testid="o">c</span></ClaraPortal></ClaraScope>
      </ClaraProvider>,
    )
    const host = (await screen.findByTestId('o')).closest('[data-clara-theme]')
    expect(host).toHaveAttribute('data-clara-theme', 'dark')
    expect(host).toHaveAttribute('data-clara-density', 'compact')
  })
})

describe('no theme flash on hydration', () => {
  // An explicit theme is resolved identically on the server and the client, so the first paint is
  // already correct. That is the documented no-flash pattern: resolve on the server, pass it in.
  it.each(['light', 'dark'] as const)('server-renders %s with the attribute already set', (theme) => {
    const html = renderToStaticMarkup(<ClaraProvider theme={theme} density="compact">x</ClaraProvider>)
    expect(html).toContain(`data-clara-theme="${theme}"`)
    expect(html).toContain('data-clara-density="compact"')
  })

  it('server-renders without reading matchMedia, even for theme="system"', () => {
    const touched: string[] = []
    vi.stubGlobal('matchMedia', () => { touched.push('matchMedia'); return { matches: false, addEventListener () {}, removeEventListener () {} } })
    const html = renderToStaticMarkup(<ClaraProvider theme="system">x</ClaraProvider>)
    expect(touched).toEqual([])
    // It falls back to light rather than guessing, so the markup is deterministic.
    expect(html).toContain('data-clara-theme="light"')
  })
})

describe('portal renders nothing on the server', () => {
  // The host element is created in an effect precisely so that `document` is never touched during
  // render. A component that reads it while rendering throws on the server, and an overlay has
  // nowhere to go before there is a document anyway - so rendering nothing is the correct output,
  // not a limitation.
  it('produces empty markup and does not touch document', () => {
    const html = renderToStaticMarkup(
      <ClaraProvider theme="dark">
        <ClaraPortal><span>should not appear</span></ClaraPortal>
      </ClaraProvider>,
    )
    expect(html).not.toContain('should not appear')
  })

  it('throws nothing when document is unavailable during render', () => {
    // The assertion that matters is not "the markup is empty" but "rendering did not reach for a
    // browser global". A component reading `document` in render would throw here, not return ''.
    const { document: real } = globalThis
    // @ts-expect-error - deliberately removing a global to prove the render path never reads it
    delete globalThis.document
    try {
      expect(() => renderToStaticMarkup(
        <ClaraProvider><ClaraPortal><span>x</span></ClaraPortal></ClaraProvider>,
      )).not.toThrow()
    } finally {
      globalThis.document = real
    }
  })

  it('mounts into the document once there IS one, OUTSIDE the React root', async () => {
    const { container } = render(
      <ClaraProvider theme="dark"><ClaraPortal><span data-testid="late">here</span></ClaraPortal></ClaraProvider>,
    )
    const el = await screen.findByTestId('late')
    expect(el.closest('[data-clara-theme]')).toHaveAttribute('data-clara-theme', 'dark')
    // `document.body.contains(el)` was the assertion here, under this same comment - and it is true
    // of every rendered element, so replacing the portal with a plain inline div left it green.
    // What makes it a portal is that the content is NOT inside the container React rendered into.
    expect(container.contains(el)).toBe(false)
    expect(document.body.contains(el)).toBe(true)
  })
})

describe('portals stack by open order', () => {
  /**
   * The mechanism the layer scale depends on, and therefore the thing that has to be asserted
   * rather than assumed.
   *
   * Every portalled surface shares one layer, so which of two overlays paints on top is decided by
   * DOM order: among positioned elements with equal z-index in the same stacking context, later in
   * tree order paints later. That is only correct if each portal APPENDS its host to document.body,
   * so a later-opened overlay is a later sibling. If the host were prepended, or reused, or mounted
   * anywhere but the end, the model would invert silently and no z-index assertion would notice.
   *
   * jsdom paints nothing, so this asserts the DOM relationship the painting rule reads - which is
   * the property, not a proxy for it.
   */
  it('appends each host to the end of the body, so later opens are later siblings', async () => {
    render(
      <ClaraProvider>
        <ClaraPortal><span data-testid="first">first</span></ClaraPortal>
      </ClaraProvider>,
    )
    const first = await screen.findByTestId('first')

    render(
      <ClaraProvider>
        <ClaraPortal><span data-testid="second">second</span></ClaraPortal>
      </ClaraProvider>,
    )
    const second = await screen.findByTestId('second')

    const hostOf = (el: HTMLElement) => {
      let node: HTMLElement | null = el
      while (node?.parentElement && node.parentElement !== document.body) node = node.parentElement
      return node
    }
    const position = Node.DOCUMENT_POSITION_FOLLOWING
    // eslint-disable-next-line no-bitwise -- compareDocumentPosition returns a bitmask
    expect(hostOf(first)!.compareDocumentPosition(hostOf(second)!) & position).toBeTruthy()
  })

  it('removes its host on unmount, so a closed overlay leaves nothing behind to stack against', async () => {
    const { unmount } = render(
      <ClaraProvider><ClaraPortal><span data-testid="gone">x</span></ClaraPortal></ClaraProvider>,
    )
    await screen.findByTestId('gone')
    const before = document.body.childElementCount
    unmount()
    expect(document.body.childElementCount).toBeLessThan(before)
    expect(screen.queryByTestId('gone')).toBeNull()
  })
})
