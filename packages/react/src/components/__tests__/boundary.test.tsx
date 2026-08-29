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
// TRD Section 7 names window, document and matchMedia. The other three are here because the
// previous version watched localStorage and dropping it was a quiet loss of coverage presented as
// a gain - a component reading localStorage or navigator during render is just as broken.
const WATCHED = ['window', 'document', 'matchMedia', 'localStorage', 'sessionStorage', 'navigator'] as const

type Renderable = ComponentType<Record<string, never>>

// `typeof value === 'function'` was wrong: forwardRef() and memo() return OBJECTS, so any
// component using either silently left the set while the self-check still passed on the two that
// did not. For a library whose single polymorphism idiom is `as` and which must forward refs, that
// is close to certain (review finding 5).
const isRenderable = (value: unknown) =>
  typeof value === 'function' ||
  (typeof value === 'object' && value !== null && '$$typeof' in value)

const components: Array<[string, Renderable]> = Object.entries(Clara)
  .filter(([name, value]) => isRenderable(value) && /^[A-Z]/.test(name))
  .map(([name, value]) => [name, value as Renderable])

const boundaryOf = (name: string) =>
  classification.components.find((c) => c.name === name)?.boundary

/**
 * The props a component cannot render without.
 *
 * Kept explicit rather than rendering everything bare: a component with a REQUIRED prop is that
 * way on purpose - `IconButton` without a label and `RadioGroup` without a legend are the defects
 * those props exist to prevent - so the suite supplies them rather than treating the component as
 * untestable.
 */
const REQUIRED_PROPS: Record<string, Record<string, unknown>> = {
  Field: { label: 'Label' },
  IconButton: { label: 'Action', icon: null },
  ButtonGroup: { label: 'Actions' },
  Link: { href: '/x' },
  RadioGroup: { name: 'r', legend: 'Question', options: [{ value: 'a', label: 'A' }] },
  CheckboxGroup: { name: 'c', legend: 'Question', options: [{ value: 'a', label: 'A' }] },
  Heading: { level: 2 },
  // `intent` is required by design - there is no neutral Alert, that is a paragraph - so the
  // sweep has to supply one. Without it this suite crashed inside Stryker's dry run rather
  // than in `pnpm test`, because the sweep enumerates whatever the classification calls built.
  Alert: { intent: 'info', children: 'Message' },
  Badge: { children: 'Draft' },
  Tag: { children: 'Draft' },
  Spinner: { label: 'Loading invoices' },
  Popover: { open: false, onOpen: () => {}, onClose: () => {}, label: 'Options', trigger: null, children: null },
  ProgressBar: { label: 'Posting invoices', value: 62 },
  SkeletonGroup: { label: 'Loading invoices', children: null },
  // `options` is required and has no sensible default - a select over nothing is not a
  // control. Without it the sweep crashed on `options.length` rather than reporting a
  // boundary verdict, which is the failure the Alert entry above records.
  Select: { options: [{ value: 'a', label: 'A' }] },
  Combobox: { options: [{ value: 'a', label: 'A' }] },
  MultiSelect: { options: [{ value: 'a', label: 'A' }] },
  DatePicker: {},
}

/** Render with the watched globals replaced by getters that record any read. */
function renderRecordingGlobalReads (component: Renderable, props: Record<string, unknown> = {}) {
  const touched: string[] = []
  const saved = WATCHED.map((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key)
    const original = (globalThis as unknown as Record<string, unknown>)[key]
    Object.defineProperty(globalThis, key, {
      configurable: true,
      get () {
        // Attributed to the frame that READ it, because the requirement is about CLARA reading a
        // browser API - and this getter cannot tell a guarded probe from an unguarded one. jsdom
        // always has `window`, so `typeof window !== 'undefined'` invokes this getter and looks
        // identical to a bare `window.innerWidth`, while the first is the correct SSR idiom and
        // cannot throw.
        //
        // A dependency doing that guarded check is not Clara reading a browser API. Radix's
        // `react-primitive` does exactly it - `if (typeof window !== 'undefined') window[Symbol
        // .for('radix-ui')] = true` - and it is reached by any component that renders a primitive
        // while CLOSED, which Popover does and Modal does not. Attributing by frame keeps the
        // test's teeth on Clara's own code, which is what it was written to guard.
        const caller = (new Error().stack ?? '').split('\n')[2] ?? ''
        if (!caller.includes('node_modules')) touched.push(key)
        return original
      },
    })
    return { key, descriptor }
  })
  try {
    return { markup: renderToStaticMarkup(createElement(component, props as never)), touched }
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
  it('enumerates exactly the components the classification says are built', () => {
    // Compared against the classification rather than against `> 0`: a count check passes while
    // a component quietly drops out of the set, which is the failure this suite must not have.
    const built = classification.components.filter((c) => c.status === 'built').map((c) => c.name).sort()
    expect(components.map(([n]) => n).sort()).toEqual(built)
    for (const [name] of components) expect(boundaryOf(name)).toMatch(/^(client|server)$/)
  })

  // A client component still has to server-render its initial markup without crashing - that is
  // what "no hydration mismatch" requires. What NO component may do is read a browser API.
  it.each(components)('%s renders on the server without reading a browser global', (name, component) => {
    const { touched } = renderRecordingGlobalReads(component as Renderable, REQUIRED_PROPS[name] ?? {})
    expect(touched).toEqual([])
  })

  it.each(components)('%s renders identically twice, so hydration has nothing to disagree with', (name, component) => {
    const props = (REQUIRED_PROPS[name] ?? {}) as never
    expect(renderToStaticMarkup(createElement(component as Renderable, props)))
      .toBe(renderToStaticMarkup(createElement(component as Renderable, props)))
  })

  it('the recording getters actually detect a read', () => {
    const Probe: Renderable = () => createElement('i', null, String(Boolean((globalThis as { document?: unknown }).document)))
    const { touched } = renderRecordingGlobalReads(Probe)
    expect(touched).toContain('document')
  })
})
