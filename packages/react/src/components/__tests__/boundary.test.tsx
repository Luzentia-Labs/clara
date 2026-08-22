import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement, type ComponentType } from 'react'
import * as Clara from '../../index'
import classification from '../../../client-boundary.json'

/**
 * The classification's runtime claim, tested rather than asserted.
 *
 * Two things this suite gets deliberately right, because the first version got both wrong:
 *
 *   1. It watches the globals the REQUIREMENT names - `window`, `document`, `matchMedia` (TRD
 *      Section 7, PRD F23). The first version watched `matchMedia` and `localStorage`, so a
 *      component reading `document.title` during render was invisible to it.
 *   2. It enumerates the package's exports rather than importing two components by name. A
 *      hardcoded list goes quietly under-inclusive the moment a third component lands - the
 *      criterion says "every component", so the test has to mean it.
 */
const WATCHED = ['window', 'document', 'matchMedia'] as const

type Renderable = ComponentType<Record<string, never>>

const components: Array<[string, Renderable]> = Object.entries(Clara)
  .filter(([name, value]) => typeof value === 'function' && /^[A-Z]/.test(name))
  .map(([name, value]) => [name, value as Renderable])

const boundaryOf = (name: string) =>
  classification.components.find((c) => c.name === name)?.boundary

/** Render with the watched globals replaced by getters that record any read. */
function renderRecordingGlobalReads (component: Renderable) {
  const touched: string[] = []
  const saved = WATCHED.map((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key)
    const original = (globalThis as unknown as Record<string, unknown>)[key]
    Object.defineProperty(globalThis, key, {
      configurable: true,
      get () { touched.push(key); return original },
    })
    return { key, descriptor }
  })
  try {
    return { markup: renderToStaticMarkup(createElement(component)), touched }
  } finally {
    // Restore the ORIGINAL descriptor. Replacing jsdom's prototype accessor with an own data
    // property would leave later tests reading a frozen snapshot instead of the live accessor.
    for (const { key, descriptor } of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete (globalThis as unknown as Record<string, unknown>)[key]
    }
  }
}

describe('server render', () => {
  it('enumerates the real exported surface, so this suite cannot go under-inclusive', () => {
    expect(components.length).toBeGreaterThan(0)
    for (const [name] of components) expect(boundaryOf(name)).toMatch(/^(client|server)$/)
  })

  // A client component still has to server-render its initial markup without crashing - that is
  // what "no hydration mismatch" requires. What NO component may do is read a browser API.
  it.each(components)('%s renders on the server without reading a browser global', (_name, component) => {
    const { touched } = renderRecordingGlobalReads(component as Renderable)
    expect(touched).toEqual([])
  })

  it.each(components)('%s renders identically twice, so hydration has nothing to disagree with', (_n, component) => {
    expect(renderToStaticMarkup(createElement(component as Renderable)))
      .toBe(renderToStaticMarkup(createElement(component as Renderable)))
  })

  it('the recording getters actually detect a read', () => {
    const Probe: Renderable = () => createElement('i', null, String(Boolean((globalThis as { document?: unknown }).document)))
    const { touched } = renderRecordingGlobalReads(Probe)
    expect(touched).toContain('document')
  })
})
