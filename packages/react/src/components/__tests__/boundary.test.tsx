import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { Box } from '../Box/Box'
import { Button } from '../Button/Button'

/**
 * The classification's runtime claim, tested rather than asserted.
 *
 * `client-boundary.json` says Box is server-capable and Button is not. That is a claim about what
 * happens during a SERVER render, so it is checked with the server renderer.
 */
describe('server render', () => {
  it('renders a server-capable component to markup', () => {
    expect(renderToStaticMarkup(createElement(Box, { padding: 'md' }, 'hello')))
      .toBe('<div class="clara-box clara-box--md">hello</div>')
  })

  // A client component still has to server-render its initial markup without crashing - that is
  // what "no hydration mismatch" requires (PRD F23). What it must not do is read a browser API
  // during render.
  it('renders a client component without reading a browser API', () => {
    const globals = ['matchMedia', 'localStorage'] as const
    const touched: string[] = []
    const saved = globals.map((k) => {
      const had = k in globalThis
      const original = (globalThis as unknown as Record<string, unknown>)[k]
      Object.defineProperty(globalThis, k, {
        configurable: true,
        get () { touched.push(k); return original },
      })
      return { k, had, original }
    })
    try {
      expect(renderToStaticMarkup(createElement(Button, { variant: 'secondary' }, 'go')))
        .toContain('clara-button--secondary')
    } finally {
      for (const { k, had, original } of saved) {
        if (had) Object.defineProperty(globalThis, k, { configurable: true, writable: true, value: original })
        else delete (globalThis as unknown as Record<string, unknown>)[k]
      }
    }
    expect(touched).toEqual([])
  })

  it('generates stable markup across two renders, so hydration has nothing to disagree with', () => {
    const once = renderToStaticMarkup(createElement(Button, {}, 'x'))
    const twice = renderToStaticMarkup(createElement(Button, {}, 'x'))
    expect(once).toBe(twice)
  })
})
