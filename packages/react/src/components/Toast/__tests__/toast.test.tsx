import { StrictMode, Suspense, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { runAxe } from '../../../../../../test/axe'
import { ClaraProvider } from '../../../theme/ClaraProvider'
import { resetToastStore } from '../toast-store'
import { Toast } from '../Toast'
import type { ToastIntent } from '../Toast'

const INTENTS: ToastIntent[] = ['info', 'success', 'warning', 'danger']

/**
 * Fake ONLY the two timer functions Radix's dismiss countdown uses.
 *
 * `vi.useFakeTimers()` with no arguments also replaces `Date`, `performance`, `queueMicrotask` and
 * `process.nextTick`. Stryker's vitest runner depends on some of those for its per-test coverage
 * hooks, and faking them crashed its dry run outright - "Test runner crashed... Cannot convert
 * object to primitive value", with `pnpm test` passing all the while, so the failure appeared only
 * in `check:mutation-config`.
 *
 * Narrowing it is not merely a workaround: these tests are about a `setTimeout` countdown, and
 * replacing the clock, the microtask queue and `performance` to assert on one is more collateral
 * than the assertion needs.
 */
const useTimerFakes = () => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

afterEach(() => {
  vi.useRealTimers()
  // The store is module state and outlives a render, so a toast left registered by one test is
  // found by the next - which two review seats hit as an order-dependent flake.
  resetToastStore()
})

/** The announcer Radix renders, which is what a screen reader actually reads. */
const politeness = () =>
  [...document.querySelectorAll('[aria-live]')].map((e) => e.getAttribute('aria-live'))

describe('Toast live region politeness by intent', () => {
  it('announces an error ASSERTIVELY', async () => {
    // AC1. An error is the one toast whose content the user has to act on, so it must not wait
    // behind whatever is already speaking - by which time the toast may be gone.
    render(<Toast open onClose={() => {}} intent="danger" title="Could not post the journal" />)
    await waitFor(() => expect(politeness()).toContain('assertive'))
  })

  it.each(['info', 'success', 'warning'] as const)('announces %s POLITELY', async (intent) => {
    // The other direction. Without this, "announces assertively" passes on a component that
    // announces everything assertively, which is a screen reader interrupting the user on every
    // saved field.
    render(<Toast open onClose={() => {}} intent={intent} title="Saved" />)
    await waitFor(() => expect(politeness()).toContain('polite'))
    expect(politeness()).not.toContain('assertive')
  })

  it.each(INTENTS)('joins the %s intent to the accessible name, so colour is never alone', async (intent) => {
    // The stripe down the side is colour. A red toast and a green toast are the same announcement
    // to anyone who cannot separate the two hues - the same rule Badge and Alert follow.
    //
    // Asserted through the ACCESSIBILITY TREE, not `textContent`. A review showed the difference is
    // not academic: replacing `clara-visually-hidden` with `display: none` moved the word out of
    // the tree entirely - measured, the element was no longer exposed - while `textContent` was
    // byte-identical and this test stayed green. `textContent` includes subtrees a screen reader
    // will never reach, so it is a proxy for the property, which is the D0065 shape this project
    // keeps finding.
    const WORD = { info: 'Information', success: 'Success', warning: 'Warning', danger: 'Error' }
    render(<Toast open onClose={() => {}} intent={intent} title="Journal 4471" />)
    const title = await screen.findByText(/Journal 4471/)
    // The intent word must be VISIBLE to assistive technology, which `display: none` is not.
    //
    // Scope, stated: this catches an INLINE `display: none` and nothing in a stylesheet. jsdom
    // loads no CSS here (`document.styleSheets.length === 0`), so hiding `.clara-visually-hidden`
    // from the stylesheet leaves this green - AGENTS.md names that trap by name. The stylesheet
    // route is covered by `check:component-css`'s visually-hidden entries, not by this file.
    const hidden = title.querySelector('.clara-visually-hidden')
    expect(hidden, 'the intent word element is gone').not.toBeNull()
    expect(hidden).toBeVisible()
    expect(hidden!.textContent).toContain(WORD[intent])
    // And it precedes the title in DOM order, so it is announced as "Error: Journal 4471" rather
    // than after the fact.
    expect(title.textContent).toMatch(new RegExp(`^\\s*${WORD[intent]}`))
  })
})

describe('error Toast does not auto-dismiss', () => {
  it('is still there long after every other toast would have gone', async () => {
    // AC2. Radix's default is 5 s; this waits 60 s of fake time.
    useTimerFakes()
    const onClose = vi.fn()
    render(<Toast open onClose={onClose} intent="danger" title="Could not post the journal" />)
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000) })
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByText(/Could not post the journal/)).toBeInTheDocument()
  })

  it('but a success toast DOES dismiss itself', async () => {
    // Without this, the assertion above passes on a component where nothing auto-dismisses at all -
    // which is not "errors persist", it is a toast that never goes away.
    useTimerFakes()
    const onClose = vi.fn()
    render(<Toast open onClose={onClose} intent="success" title="Journal posted" />)
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000) })
    expect(onClose).toHaveBeenCalled()
  })
})

describe('Toast timer pauses on hover and focus', () => {
  it('does not dismiss while the pointer is over the stack', async () => {
    // AC3. Radix binds the pause to the VIEWPORT, so the events are dispatched there.
    useTimerFakes()
    const onClose = vi.fn()
    render(<Toast open onClose={onClose} intent="success" title="Journal posted" />)
    const viewport = document.querySelector('.clara-toast__viewport')!
    await act(async () => { await vi.advanceTimersByTimeAsync(1_000) })
    fireEvent.pointerMove(viewport)
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000) })
    expect(onClose, 'the toast dismissed itself while the pointer was on it').not.toHaveBeenCalled()
  })

  it('does not dismiss while something inside it has focus', async () => {
    useTimerFakes()
    const onClose = vi.fn()
    render(<Toast open onClose={onClose} intent="success" title="Journal posted" />)
    const viewport = document.querySelector('.clara-toast__viewport')!
    await act(async () => { await vi.advanceTimersByTimeAsync(1_000) })
    fireEvent.focusIn(viewport)
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000) })
    expect(onClose, 'the toast dismissed itself while it held focus').not.toHaveBeenCalled()
  })

  it('resumes once the pointer leaves again', async () => {
    // A pause that never resumes is not a pause, it is the auto-dismiss quietly disabled.
    useTimerFakes()
    const onClose = vi.fn()
    render(<Toast open onClose={onClose} intent="success" title="Journal posted" />)
    const viewport = document.querySelector('.clara-toast__viewport')!
    // Radix binds BOTH handlers to a wrapper it renders around the viewport list. `pointermove`
    // bubbles, so dispatching it on the list reaches the wrapper - but `pointerleave` does NOT
    // bubble, so the resume has to be dispatched on the wrapper itself. Getting that wrong makes
    // this test fail against a component whose resume works perfectly.
    const wrapper = viewport.parentElement!
    fireEvent.pointerMove(viewport)
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000) })
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.pointerLeave(wrapper)
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000) })
    expect(onClose, 'the timer never resumed after the pointer left').toHaveBeenCalled()
  })
})

describe('Toast dismissal', () => {
  it('closes from the close button, by its accessible name', async () => {
    function Harness () {
      const [open, setOpen] = useState(true)
      return <Toast open={open} onClose={() => setOpen(false)} title="Journal posted" />
    }
    render(<Harness />)
    await userEvent.click(await screen.findByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByText(/Journal posted/)).not.toBeInTheDocument())
  })

  it('renders an action when given one', async () => {
    render(
      <Toast open onClose={() => {}} intent="danger" title="Could not post"
        action={<button>Retry</button>} />,
    )
    expect(await screen.findByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })
})

describe('Toast theme and density matrix', () => {
  it.each([
    ['light', 'comfortable'], ['light', 'compact'],
    ['dark', 'comfortable'], ['dark', 'compact'],
  ] as const)('renders and passes axe in %s / %s', async (theme, density) => {
    const { container } = render(
      <ClaraProvider theme={theme} density={density}>
        <Toast open onClose={() => {}} intent="danger" title="Could not post the journal"
          description="The period is closed." action={<button>Retry</button>} />
      </ClaraProvider>,
    )
    await screen.findByText(/Could not post the journal/)
    // Walked UP from an element INSIDE the panel, not `container.querySelector`.
    //
    // The panel is portalled to `document.body`, so `container` holds only the trigger and the
    // provider's own wrapper - and that wrapper carries the theme attributes too. Querying it found
    // a correct-looking answer that was never the portal's scope: stripping the attributes from
    // ClaraPortal entirely left this assertion green (BG review B3, D0065 - observe the property,
    // not a proxy for it).
    const scope = (await screen.findByText(/Could not post the journal/)).closest('[data-clara-theme]')
    expect(scope).toHaveAttribute('data-clara-theme', theme)
    expect(scope).toHaveAttribute('data-clara-density', density)
    await expect(runAxe(document.body)).resolves.toHaveNoBlockingViolations()
  })
})

/**
 * BG-01M0Y2H2 - one stack, not one stack per toast.
 *
 * Every `<Toast>` used to render its own Radix Provider and Viewport, so two toasts produced two
 * fixed viewports at the identical rect. A review measured the consequence in Chromium:
 * `elementFromPoint` on the first toast's close button returned the SECOND toast's close button, so
 * the covered toast's controls were unreachable - and with `duration: Infinity` on `danger`, a
 * covered error toast persisted forever, invisible and unactionable.
 *
 * Asserted on the DOM rather than on geometry, deliberately: jsdom computes no layout, so "they
 * overlap" is not observable here. What IS observable is the cause - how many viewports exist - and
 * that is the thing the repair changes.
 */
describe('Toast stacks in one shared viewport', () => {
  it('renders ONE viewport for three toasts, holding all three', async () => {
    render(
      <>
        <Toast open onClose={() => {}} title="First" />
        <Toast open onClose={() => {}} title="Second" />
        <Toast open onClose={() => {}} intent="danger" title="Third" />
      </>,
    )
    await screen.findByText(/First/)
    const viewports = document.querySelectorAll('.clara-toast__viewport')
    expect(viewports, 'each toast still brings its own fixed viewport').toHaveLength(1)
    expect(document.querySelectorAll('.clara-toast')).toHaveLength(3)
  })

  it('keeps every toast reachable by its own accessible name', async () => {
    // The defect was not cosmetic: a covered toast's close button could not be hit. Addressing each
    // by name is the jsdom-visible form of "all three are reachable".
    render(
      <>
        <Toast open onClose={() => {}} title="First" closeLabel="Close first" />
        <Toast open onClose={() => {}} title="Second" closeLabel="Close second" />
      </>,
    )
    expect(await screen.findByRole('button', { name: 'Close first' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Close second' })).toBeInTheDocument()
  })

  it('holds them in arrival order', async () => {
    render(
      <>
        <Toast open onClose={() => {}} title="First" />
        <Toast open onClose={() => {}} title="Second" />
      </>,
    )
    await screen.findByText(/First/)
    const titles = [...document.querySelectorAll('.clara-toast__title')].map((e) => e.textContent)
    expect(titles[0]).toContain('First')
    expect(titles[1]).toContain('Second')
  })

  it('survives the owning toast unmounting', async () => {
    // Ownership of the shared host belongs to the first toast to mount. If it goes away, the host
    // has to pass to one that is still there - otherwise closing the first toast takes every other
    // toast off the screen with it.
    function Harness () {
      const [first, setFirst] = useState(true)
      return (
        <>
          {first && <Toast open onClose={() => setFirst(false)} title="First" closeLabel="Close first" />}
          <Toast open onClose={() => {}} title="Second" />
        </>
      )
    }
    render(<Harness />)
    await screen.findByText(/Second/)
    await userEvent.click(screen.getByRole('button', { name: 'Close first' }))
    await waitFor(() => expect(screen.queryByText(/First/)).not.toBeInTheDocument())
    // The survivor is still on screen, in a viewport that still exists.
    expect(screen.getByText(/Second/)).toBeInTheDocument()
    expect(document.querySelectorAll('.clara-toast__viewport')).toHaveLength(1)
  })
})

/**
 * A DISCARDED render must not poison the shared stack.
 *
 * React re-invokes a component body with fresh hook state on a render it then throws away.
 * StrictMode does that deliberately; in production any suspended sibling does it too. The first
 * version of the shared stack claimed its id and published DURING RENDER, so a discarded pass
 * claimed a second id and published under it while the cleanup closed over only the survivor. The
 * orphan was never retracted - and because ownership is `entries[0]`, a dead orphan owned the
 * shared host forever, so no toast rendered again on that page, ever.
 *
 * Measured before the repair: under StrictMode, `entries=[{id:1}] owner=1 nextId=3` and
 * `document.body` was an empty div. The poisoning was global and permanent - the NEXT ordinary
 * toast rendered nothing either, which is why the second test here matters as much as the first.
 */
describe('Toast survives a discarded render', () => {
  it('renders under StrictMode, where every render happens twice', async () => {
    render(
      <StrictMode>
        <Toast open onClose={() => {}} intent="success" title="Journal posted" />
      </StrictMode>,
    )
    expect(await screen.findByText(/Journal posted/)).toBeInTheDocument()
    expect(document.querySelectorAll('.clara-toast__viewport')).toHaveLength(1)
  })

  it('renders after a suspended sibling resolves - the production form of the same thing', async () => {
    // No StrictMode here on purpose. A review reproduced the defect with an ordinary Suspense
    // boundary, which is React.lazy, or App Router streaming, or any data-fetching boundary.
    let resolve: (() => void) | undefined
    const pending = new Promise<void>((r) => { resolve = () => r() })
    let done = false
    function Suspending () {
      if (!done) throw pending.then(() => { done = true })
      return <span>ready</span>
    }
    render(
      <Suspense fallback={<span>loading</span>}>
        <Suspending />
        <Toast open onClose={() => {}} intent="success" title="Journal posted" />
      </Suspense>,
    )
    await act(async () => { resolve!(); await pending })
    expect(await screen.findByText('ready')).toBeInTheDocument()
    expect(screen.getByText(/Journal posted/), 'the toast never rendered after the boundary resolved')
      .toBeInTheDocument()
  })

  it('a LATER ordinary toast still renders, so no orphan owns the host', async () => {
    // The poisoning was permanent and cross-render. This is the assertion that catches it: an
    // ordinary toast mounted after a StrictMode one must still appear.
    const { unmount } = render(
      <StrictMode><Toast open onClose={() => {}} title="First" /></StrictMode>,
    )
    await screen.findByText(/First/)
    unmount()
    render(<Toast open onClose={() => {}} title="Second" />)
    expect(await screen.findByText(/Second/), 'a dead entry still owns the shared host')
      .toBeInTheDocument()
  })
})

/**
 * The store's NOTIFICATION half, which no gate reached.
 *
 * A review made `emit()` notify nobody, and separately made `subscribe()` register nobody, and
 * measured 1173 tests, 26 guards, typecheck, size and all 29 e2e still green.
 * `useSyncExternalStore` re-reads its snapshot during React's own render for a single root, so the
 * subscription only earns its keep ACROSS independent roots - which is exactly the case nothing
 * exercised.
 *
 * Two React roots is not a contrived scenario for this component: a toast raised by a widget mounted
 * separately from the main app is the ordinary shape of an incrementally-adopted design system,
 * which is what this library is for.
 */
describe('Toast notifies across independent React roots', () => {
  it('a toast in a SECOND root joins the first root\'s stack', async () => {
    const a = document.createElement('div')
    const b = document.createElement('div')
    document.body.append(a, b)
    const rootA = createRoot(a)
    const rootB = createRoot(b)
    try {
      await act(async () => {
        rootA.render(<Toast open onClose={() => {}} title="From root A" />)
      })
      await waitFor(() => expect(screen.getByText(/From root A/)).toBeInTheDocument())

      await act(async () => {
        rootB.render(<Toast open onClose={() => {}} title="From root B" />)
      })
      // The second root's toast must appear, and both must share ONE viewport - which can only
      // happen if the first root was NOTIFIED that the store changed.
      await waitFor(() => expect(screen.getByText(/From root B/)).toBeInTheDocument())
      expect(document.querySelectorAll('.clara-toast__viewport'),
        'the two roots each built their own stack, so the subscription did nothing')
        .toHaveLength(1)
      expect(document.querySelectorAll('.clara-toast')).toHaveLength(2)
    } finally {
      await act(async () => { rootA.unmount(); rootB.unmount() })
      a.remove(); b.remove()
    }
  })
})
