import { useState } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { runAxe } from '../../../../../../test/axe'
import { ClaraProvider } from '../../../theme/ClaraProvider'
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

afterEach(() => { vi.useRealTimers() })

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
