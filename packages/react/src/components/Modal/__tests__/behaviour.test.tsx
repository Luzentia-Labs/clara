import { StrictMode, useEffect, useRef, useState } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { runAxe } from '../../../../../../test/axe'
import { ClaraProvider } from '../../../theme/ClaraProvider'
import { Modal } from '../Modal'
import { Button } from '../../Button/Button'
import { Input } from '../../Input/Input'
import { Field } from '../../Field/Field'

/**
 * Modal's tests are written from the keyboard interaction table in US-01M0GM48 (D0024: the table is
 * the specification). Every row there has an assertion here, and the four dismissal routes are
 * asserted SEPARATELY - a single "it restores focus" test passes on an implementation that handles
 * one route and drops the other three, which is the strand this component exists to prevent.
 */

/**
 * Stub the viewport, and put it back afterwards.
 *
 * The scroll-lock test needs a scrollbar to exist, which jsdom has no concept of. The first version
 * defined these properties and never restored them, so every test that ran after it in the file
 * saw a 1000px viewport instead of jsdom's 1024 - 13 of 25 of them, and which 13 changed under
 * `--sequence.shuffle`. A stub that outlives its test is a shared mutable global.
 */
const savedViewport: Array<() => void> = []
function stubViewport (innerWidth: number, clientWidth: number) {
  for (const [obj, prop, value] of [
    [window, 'innerWidth', innerWidth],
    [document.documentElement, 'clientWidth', clientWidth],
  ] as const) {
    // Capture the REAL descriptor and put it back. The first version used `delete`, and
    // `window.innerWidth` is an own data property on jsdom's Window - so deleting it removed the
    // property outright and every later test in the file saw `undefined` rather than jsdom's 1024.
    // That is the same leak in a new shape, which is why the restore is now a captured descriptor
    // rather than a remembered number.
    const original = Object.getOwnPropertyDescriptor(obj, prop)
    Object.defineProperty(obj, prop, { value, configurable: true, writable: true })
    savedViewport.push(() => {
      if (original) Object.defineProperty(obj, prop, original)
      else delete (obj as unknown as Record<string, unknown>)[prop]
    })
  }
}
afterEach(() => {
  while (savedViewport.length) savedViewport.pop()!()
})

/** A harness with a real opener, so focus restoration can be asserted by element IDENTITY. */
function Harness ({
  dismissible = true, withInitialFocus = false, onClose: spy,
}: { dismissible?: boolean, withInitialFocus?: boolean, onClose?: () => void } = {}) {
  const [open, setOpen] = useState(false)
  const initialFocus = useRef<HTMLInputElement>(null)
  const close = () => { setOpen(false); spy?.() }
  return (
    <ClaraProvider>
      <button onClick={() => setOpen(true)} data-testid="opener">Open</button>
      <button data-testid="background-button">Behind</button>
      <Modal
        open={open}
        onClose={close}
        title="Reverse this posting"
        description="The reversal is dated today."
        dismissible={dismissible}
        {...(withInitialFocus ? { initialFocus } : {})}
        footer={<Button onClick={close} data-testid="commit">Reverse</Button>}
      >
        <Input ref={initialFocus} data-testid="reason" aria-label="Reason" />
        <button data-testid="second">Second</button>
      </Modal>
    </ClaraProvider>
  )
}

/**
 * Open the way a user does. `fireEvent.click` does NOT move focus, so an opener clicked with it is
 * never the active element - and every focus-restoration test then asserts against a dialog that
 * had nothing to restore TO. That cost four red tests and one wrong diagnosis of the component.
 */
const open = async () => {
  await userEvent.click(screen.getByTestId('opener'))
  return screen.findByRole('dialog')
}

describe('Modal initial focus target', () => {
  it('moves focus to the named initial target, not the body and not the panel', async () => {
    render(<Harness withInitialFocus />)
    await open()
    // Identity, not "something is focused". The panel itself and document.body both count as
    // failures - a dialog that focuses its own container strands a screen reader at the top with
    // nothing to act on.
    await waitFor(() => expect(screen.getByTestId('reason')).toHaveFocus())
    expect(document.activeElement).not.toBe(document.body)
    expect(screen.getByRole('dialog')).not.toHaveFocus()
  })

  it('falls back to the CLOSE button, never to a destructive action, when the author names none', async () => {
    // Identity, not containment. "Focus the last focusable element" satisfies containment and, in
    // this harness, lands on the footer's "Reverse" button - so a dialog titled "Reverse this
    // posting" would open with focus on the destructive action and a stray Enter would commit it.
    render(<Harness />)
    const dialog = await open()
    const close = screen.getByRole('button', { name: /close/i })
    await waitFor(() => expect(close).toHaveFocus())
    expect(document.activeElement).not.toBe(screen.getByTestId('commit'))
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('applies the focus from INSIDE the portal, so it survives the second-commit rule', async () => {
    // D0090: ClaraPortal creates its host in an effect, so the content lands on its SECOND commit.
    // An implementation that focuses from Modal's own body finds a null ref and silently focuses
    // nothing. This asserts the outcome that only the inside-the-portal placement produces.
    render(<Harness withInitialFocus />)
    await open()
    await waitFor(() => expect(screen.getByTestId('reason')).toHaveFocus())
  })
})

describe('Modal focus restoration per dismissal route', () => {
  // Four routes, four tests. Deliberately not a loop over a table: each route reaches the close
  // through different code, and a shared assertion hides which one regressed.
  it('restores focus to the opener after Escape', async () => {
    render(<Harness />)
    await open()
    // Assert focus LEFT the opener first. `userEvent.click` leaves focus on the button it
    // clicked, so "the opener has focus at the end" is true of an implementation that does
    // nothing at all - both of these passed against a plain div.
    expect(screen.getByTestId('opener')).not.toHaveFocus()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.getByTestId('opener')).toHaveFocus())
  })

  it('restores focus to the opener after a scrim click', async () => {
    const { container } = render(<Harness />)
    await open()
    // Assert focus LEFT the opener first. `userEvent.click` leaves focus on the button it
    // clicked, so "the opener has focus at the end" is true of an implementation that does
    // nothing at all - both of these passed against a plain div.
    expect(screen.getByTestId('opener')).not.toHaveFocus()
    const scrim = document.querySelector('.clara-modal__scrim')!
    fireEvent.pointerDown(scrim)
    fireEvent.pointerUp(scrim)
    fireEvent.click(scrim)
    await waitFor(() => expect(screen.getByTestId('opener')).toHaveFocus())
    expect(container).toBeTruthy()
  })

  it('restores focus to the opener after the close button', async () => {
    render(<Harness />)
    await open()
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    await waitFor(() => expect(screen.getByTestId('opener')).toHaveFocus())
  })

  it('restores focus to the opener after a successful commit', async () => {
    render(<Harness />)
    await open()
    await userEvent.click(screen.getByTestId('commit'))
    await waitFor(() => expect(screen.getByTestId('opener')).toHaveFocus())
  })
})

describe('Modal focus restoration when the dialog is unmounted while open', () => {
  // `{open && <Modal open .../>}` is the first thing a React developer writes, and it is what a
  // router does on a redirect. There is no open -> closed transition: the component goes away.
  // Clara suppresses Radix's restore and owns it in an effect, which does not run on unmount - so
  // focus was stranded on document.body on all four routes, in the behaviour this component is
  // named for, while the docs page promised it was handled.
  function Conditional ({ onClose: spy }: { onClose?: () => void } = {}) {
    const [open, setOpen] = useState(false)
    const close = () => { setOpen(false); spy?.() }
    return (
      <ClaraProvider>
        <button data-testid="opener" onClick={() => setOpen(true)}>Open</button>
        {open && (
          <Modal open onClose={close} title="Reverse this posting"
            footer={<Button onClick={close} data-testid="commit">Reverse</Button>}>
            <button data-testid="second">Second</button>
          </Modal>
        )}
      </ClaraProvider>
    )
  }

  it('restores focus after Escape when the Modal is conditionally rendered', async () => {
    render(<Conditional />)
    await userEvent.click(screen.getByTestId('opener'))
    await screen.findByRole('dialog')
    expect(screen.getByTestId('opener')).not.toHaveFocus()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.getByTestId('opener')).toHaveFocus())
  })

  it('restores focus after the close button when conditionally rendered', async () => {
    render(<Conditional />)
    await userEvent.click(screen.getByTestId('opener'))
    await screen.findByRole('dialog')
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    await waitFor(() => expect(screen.getByTestId('opener')).toHaveFocus())
  })

  it('restores focus after a commit when conditionally rendered', async () => {
    render(<Conditional />)
    await userEvent.click(screen.getByTestId('opener'))
    await screen.findByRole('dialog')
    await userEvent.click(screen.getByTestId('commit'))
    await waitFor(() => expect(screen.getByTestId('opener')).toHaveFocus())
  })

  it('restores focus after a scrim click when conditionally rendered', async () => {
    render(<Conditional />)
    await userEvent.click(screen.getByTestId('opener'))
    await screen.findByRole('dialog')
    expect(screen.getByTestId('opener')).not.toHaveFocus()
    const scrim = document.querySelector('.clara-modal__scrim')!
    fireEvent.pointerDown(scrim)
    fireEvent.pointerUp(scrim)
    fireEvent.click(scrim)
    await waitFor(() => expect(screen.getByTestId('opener')).toHaveFocus())
  })
})

describe('Modal focus restoration under StrictMode and a vanished opener', () => {
  // Both of these were CRITICALs in the restoration path, found in a real browser and reproduced
  // here. Nothing else in this workspace renders under StrictMode, which is the Next.js dev default
  // and the Vite/CRA template default - so a consumer meets this on day one.
  it('does not steal focus when a conditionally rendered Modal mounts under StrictMode', async () => {
    function App () {
      const [open, setOpen] = useState(false)
      return (
        <ClaraProvider>
          <a href="#main" data-testid="skip">Skip</a>
          <button data-testid="opener" onClick={() => setOpen(true)}>Open</button>
          {open && (
            <Modal open onClose={() => setOpen(false)} title="t">
              <button data-testid="in">x</button>
            </Modal>
          )}
        </ClaraProvider>
      )
    }
    render(<StrictMode><App /></StrictMode>)
    await userEvent.click(screen.getByTestId('opener'))
    await screen.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    // The opener, NOT the page's first focusable. StrictMode's double-invoke used to fire the
    // fallback in the window before the portal content existed, steal focus to the skip link, and
    // then record the stolen element as the opener.
    await waitFor(() => expect(screen.getByTestId('opener')).toHaveFocus())
  })

  it('does not override focus the application places after the dialog has gone', async () => {
    // The mainstream ERP flow: commit, then navigate. The app focuses the new record's heading in
    // an effect AFTER the Modal has unmounted - which is a tick before Clara's deferred restore,
    // so the restore used to overwrite it and drop the user on the page's skip link.
    //
    // Deliberately NOT focusing inside `onClose`: while the dialog is still mounted Radix's trap
    // pulls focus straight back, so that scenario tests the trap rather than this. A trace showed
    // exactly that, and the first version of this test was measuring the wrong thing.
    function CommitAndNavigate () {
      const [open, setOpen] = useState(true)
      const [committed, setCommitted] = useState(false)
      const heading = useRef<HTMLHeadingElement>(null)
      useEffect(() => { if (committed) heading.current?.focus() }, [committed])
      return (
        <ClaraProvider>
          <a href="#main" data-testid="skip">Skip</a>
          <h1 tabIndex={-1} ref={heading} data-testid="heading">Record 42</h1>
          {open && (
            <Modal open title="t" onClose={() => { setOpen(false); setCommitted(true) }}>
              <button data-testid="in">x</button>
            </Modal>
          )}
        </ClaraProvider>
      )
    }
    render(<CommitAndNavigate />)
    await screen.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    // Give the deferred restore a tick to do the wrong thing, if it is going to.
    await new Promise((r) => { setTimeout(r, 0) })
    expect(screen.getByTestId('heading')).toHaveFocus()
  })

  it('lands on the real opener when a confirm-over-edit pair closes in one commit', async () => {
    // No consumer focus code at all, which is why this is a component defect rather than an
    // interaction gap. Two restores queue and microtasks are FIFO, so the outermost used to run
    // last and win - backwards for nesting - and the user landed on the page's skip link.
    //
    // Opened the way a user does, not both `open` on mount: a dialog that was open before anything
    // was focused captures no opener at all, so a fixture like that tests the fallback instead.
    function ConfirmOverEdit () {
      const [edit, setEdit] = useState(false)
      const [confirm, setConfirm] = useState(false)
      const closeBoth = () => { setConfirm(false); setEdit(false) }
      return (
        <ClaraProvider>
          <a href="#main" data-testid="skip">Skip</a>
          <button data-testid="opener" onClick={() => setEdit(true)}>Edit</button>
          {edit && (
            <Modal open title="Edit" onClose={() => setEdit(false)}>
              <button data-testid="ask" onClick={() => setConfirm(true)}>Delete</button>
            </Modal>
          )}
          {confirm && <Modal open title="Confirm" onClose={closeBoth}><button data-testid="yes">Yes</button></Modal>}
        </ClaraProvider>
      )
    }
    render(<ConfirmOverEdit />)
    await userEvent.click(screen.getByTestId('opener'))
    await waitFor(() => expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1))
    await userEvent.click(screen.getByTestId('ask'))
    await waitFor(() => expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(2))
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(0))
    await new Promise((r) => { setTimeout(r, 0) })
    // The confirm dialog's own opener (`ask`) went away with the edit dialog, so the only correct
    // landing place is the button that started the whole flow - never the page's skip link.
    expect(screen.getByTestId('skip')).not.toHaveFocus()
    expect(screen.getByTestId('opener')).toHaveFocus()
  })

  it('accepts an aria-hidden candidate rather than stranding focus on the body', async () => {
    // The SECOND pass of the fallback, which the first pass makes unreachable in the ordinary case.
    // Here the only other focusable element is inside an aria-hidden container, so preferring a
    // non-aria-hidden candidate finds nothing - and without the second pass focus lands on the
    // body, which is the strand. Written because the pass was otherwise dead code, and dead
    // defensive code is the same thing as a guard nobody has watched fail.
    function OnlyHidden () {
      const [open, setOpen] = useState(false)
      const [gone, setGone] = useState(false)
      return (
        <ClaraProvider>
          {!gone && <button data-testid="opener" onClick={() => { setOpen(true); setGone(true) }}>Open</button>}
          <div aria-hidden="true"><button data-testid="only-candidate">Behind</button></div>
          {open && <Modal open onClose={() => setOpen(false)} title="t"><button data-testid="in">x</button></Modal>}
        </ClaraProvider>
      )
    }
    render(<OnlyHidden />)
    await userEvent.click(screen.getByTestId('opener'))
    await screen.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(screen.getByTestId('only-candidate')).toHaveFocus())
  })

  it('finds a candidate even while the background is still aria-hidden', async () => {
    // On the UNMOUNT route React runs Modal's cleanup BEFORE Radix's, so every background subtree
    // is still marked aria-hidden. A fallback that skips aria-hidden skips ALL of them and lands on
    // document.body - the exact strand this component exists to prevent.
    function Vanishing () {
      const [open, setOpen] = useState(false)
      const [gone, setGone] = useState(false)
      return (
        <ClaraProvider>
          {!gone && <button data-testid="opener" onClick={() => { setOpen(true); setGone(true) }}>Open</button>}
          <button data-testid="elsewhere">Elsewhere</button>
          {open && <Modal open onClose={() => setOpen(false)} title="t"><button data-testid="in">x</button></Modal>}
        </ClaraProvider>
      )
    }
    render(<Vanishing />)
    await userEvent.click(screen.getByTestId('opener'))
    await screen.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.activeElement).not.toBe(document.body)
    expect(screen.getByTestId('elsewhere')).toHaveFocus()
  })
})

describe('Modal focus restoration when the target is gone', () => {
  // Both of these stranded focus on `document.body` and neither was tested. They are not edge
  // cases: a menu item that opens a dialog is unmounted with the menu, and a Modal rendered `open`
  // on mount never had an opener at all.
  it('does not strand focus when the opener is removed while the dialog is open', async () => {
    function Vanishing () {
      const [open, setOpen] = useState(false)
      const [openerGone, setOpenerGone] = useState(false)
      return (
        <ClaraProvider>
          {!openerGone && <button data-testid="opener" onClick={() => { setOpen(true); setOpenerGone(true) }}>Open</button>}
          <button data-testid="elsewhere">Elsewhere</button>
          <Modal open={open} onClose={() => setOpen(false)} title="t"><button data-testid="in">x</button></Modal>
        </ClaraProvider>
      )
    }
    render(<Vanishing />)
    await userEvent.click(screen.getByTestId('opener'))
    await screen.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.getByTestId('elsewhere')).toHaveFocus()
  })

  it('a CLOSED Modal takes no focus on mount', async () => {
    // The ordinary state of every dialog on a page is closed. The restore effect ran on the first
    // commit with both targets null, fell into the fallback loop, and stole focus from whatever the
    // user was on - measured in Chromium jumping to the skip link and scrolling the page to the
    // top. Restoration now runs only on the open -> closed transition.
    render(
      <ClaraProvider>
        <a href="#main" data-testid="skip">Skip to content</a>
        <button data-testid="opener">Open</button>
        <Modal open={false} onClose={() => {}} title="t"><span>x</span></Modal>
      </ClaraProvider>,
    )
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull())
    expect(document.activeElement).toBe(document.body)
  })

  it('a Modal that never opened takes no focus when it re-renders', async () => {
    function Rerender () {
      const [n, setN] = useState(0)
      return (
        <ClaraProvider>
          {/* A focusable element BEFORE the clicked one. Without it the test asserts focus on the
              button it just clicked, which is also where the broken fallback loop puts focus - so
              it passed against the worst form of the bug. Round 2's finding, re-introduced here. */}
          <a href="#main" data-testid="first-focusable">Skip</a>
          <button data-testid="skip" onClick={() => setN(n + 1)}>Bump {n}</button>
          <Modal open={false} onClose={() => {}} title="t"><span>x</span></Modal>
        </ClaraProvider>
      )
    }
    render(<Rerender />)
    const skip = screen.getByTestId('skip')
    await userEvent.click(skip)
    expect(skip).toHaveFocus()
  })

  it('skips hidden candidates rather than focusing one and landing on the body', async () => {
    // `.focus()` on a hidden element is a silent no-op, so "the first match of the selector" is not
    // the first FOCUSABLE element. Asserted by identity: focus must land on the visible button, not
    // merely be "not body" - which is what the earlier version of these two tests checked.
    function HiddenFirst () {
      const [open, setOpen] = useState(true)
      return (
        <ClaraProvider>
          <button data-testid="hidden-btn" hidden>Hidden</button>
          <div aria-hidden="true"><button data-testid="aria-hidden-btn">Also hidden</button></div>
          <button data-testid="visible-btn">Visible</button>
          <Modal open={open} onClose={() => setOpen(false)} title="t"><button data-testid="in">x</button></Modal>
        </ClaraProvider>
      )
    }
    render(<HiddenFirst />)
    await screen.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.getByTestId('visible-btn')).toHaveFocus()
  })

  it('does not strand focus when the dialog was open on mount', async () => {
    function BornOpen () {
      const [open, setOpen] = useState(true)
      return (
        <ClaraProvider>
          <button data-testid="elsewhere">Elsewhere</button>
          <Modal open={open} onClose={() => setOpen(false)} title="t"><button data-testid="in">x</button></Modal>
        </ClaraProvider>
      )
    }
    render(<BornOpen />)
    await screen.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.getByTestId('elsewhere')).toHaveFocus()
  })

  it('honours returnFocus over the opener', async () => {
    // The documented remedy for the case above, and it was asserted by nothing.
    function WithReturn () {
      const [open, setOpen] = useState(false)
      const returnTo = useRef<HTMLButtonElement>(null)
      return (
        <ClaraProvider>
          <button data-testid="opener" onClick={() => setOpen(true)}>Open</button>
          <button ref={returnTo} data-testid="return-here">Return here</button>
          <Modal open={open} onClose={() => setOpen(false)} title="t" returnFocus={returnTo}>
            <button data-testid="in">x</button>
          </Modal>
        </ClaraProvider>
      )
    }
    render(<WithReturn />)
    await userEvent.click(screen.getByTestId('opener'))
    await screen.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.getByTestId('return-here')).toHaveFocus())
  })
})

describe('Modal size and close affordance', () => {
  it.each(['sm', 'md', 'lg'] as const)('carries the %s size onto the panel', async (size) => {
    // `size` was hardcodeable to 'md' with the whole suite green.
    render(
      <ClaraProvider>
        <Modal open onClose={() => {}} title="t" size={size}><span data-testid="in">x</span></Modal>
      </ClaraProvider>,
    )
    expect(await screen.findByRole('dialog')).toHaveClass(`clara-modal--${size}`)
  })

  it('keeps the close button even when dismissible is false', async () => {
    // Removing it left every test green. A dialog with no way out is a trap, not a safeguard - the
    // point of `dismissible={false}` is to stop ACCIDENTAL dismissal, not to remove the exit.
    render(
      <ClaraProvider>
        <Modal open onClose={() => {}} title="t" dismissible={false}><span data-testid="in">x</span></Modal>
      </ClaraProvider>,
    )
    await screen.findByRole('dialog')
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  it('calls onClose exactly ONCE on the close-button route', async () => {
    // It fired twice: `Dialog.Close` already routes through `onOpenChange`, and a second
    // `onClick={onClose}` was wired beside it. A consumer sees that as a double-submitted form.
    const spy = vi.fn()
    render(
      <ClaraProvider>
        <Modal open onClose={spy} title="t"><span data-testid="in">x</span></Modal>
      </ClaraProvider>,
    )
    await screen.findByRole('dialog')
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('calls onClose exactly once on Escape', async () => {
    const spy = vi.fn()
    render(
      <ClaraProvider>
        <Modal open onClose={spy} title="t"><span data-testid="in">x</span></Modal>
      </ClaraProvider>,
    )
    await screen.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('calls onClose exactly once on the SCRIM route', async () => {
    // Previously folded into the Escape test, which named the scrim and never touched it - so a
    // scrim click firing onClose twice passed. Every route counts its own calls.
    const spy = vi.fn()
    render(
      <ClaraProvider>
        <Modal open onClose={spy} title="t"><span data-testid="in">x</span></Modal>
      </ClaraProvider>,
    )
    await screen.findByRole('dialog')
    const scrim = document.querySelector('.clara-modal__scrim')!
    fireEvent.pointerDown(scrim)
    fireEvent.pointerUp(scrim)
    fireEvent.click(scrim)
    expect(spy).toHaveBeenCalledTimes(1)
  })
})

describe('Modal makes the background unreachable', () => {
  it('makes background content unreachable, not merely Tab-trapped', async () => {
    // The mutant this must fail on is dropping the hiding while keeping Radix's Tab trap.
    // Pressing Tab would still cycle inside the panel, so a Tab-only test stays green. Asserting
    // the background is not REACHABLE is what sees it.
    render(<Harness />)
    await open()
    // Two separate properties. Hidden from assistive technology (so a screen reader cannot browse
    // past the dialog), AND unreachable by programmatic focus (so a stray .focus() call cannot land
    // behind the scrim). Radix uses `aria-hidden` plus a focus scope rather than the `inert`
    // attribute; the record and the docs used to say "inert", which named a mechanism not in use.
    const background = screen.getByTestId('background-button')
    expect(background.closest('[aria-hidden="true"], [inert]')).not.toBeNull()
    background.focus()
    expect(background).not.toHaveFocus()
    expect(document.activeElement).not.toBe(background)
  })

  it('wraps from the last focusable back to the first, so focus never leaves', async () => {
    // Containment alone is NOT the assertion. An implementation that pins focus to one element and
    // never advances satisfies "still inside the dialog" on every press, so the wrap has to be
    // asserted by IDENTITY: focus must actually move, and must come back round to where it began.
    render(<Harness withInitialFocus />)
    const dialog = await open()
    await waitFor(() => expect(screen.getByTestId('reason')).toHaveFocus())
    const first = document.activeElement
    const seen = new Set<Element>()
    for (let i = 0; i < 12; i++) {
      await userEvent.tab()
      expect(dialog.contains(document.activeElement)).toBe(true)
      seen.add(document.activeElement!)
      if (document.activeElement === first && seen.size > 1) break
    }
    expect(seen.size).toBeGreaterThan(1)
    expect(document.activeElement).toBe(first)
  })

  it('wraps backwards too', async () => {
    render(<Harness withInitialFocus />)
    const dialog = await open()
    await waitFor(() => expect(screen.getByTestId('reason')).toHaveFocus())
    const first = document.activeElement
    const seen = new Set<Element>()
    for (let i = 0; i < 12; i++) {
      await userEvent.tab({ shift: true })
      expect(dialog.contains(document.activeElement)).toBe(true)
      seen.add(document.activeElement!)
      if (document.activeElement === first && seen.size > 1) break
    }
    expect(seen.size).toBeGreaterThan(1)
    expect(document.activeElement).toBe(first)
  })
})

describe('Modal keeps the scrim empty', () => {
  /**
   * D0092: nothing is drawn ON the scrim, and it is a decision rather than an omission - Clara's
   * light focus ring measures 1.86:1 against the light scrim composite, so a control there fails
   * WCAG today and would need the scrim, the ring, or both to move.
   *
   * Asserted over the whole PORTAL HOST, not over the scrim element's subtree. Scoping to
   * `scrim.querySelectorAll(...)` pinned "nothing inside the overlay element", which is not the
   * decision: a floating dismiss affordance drawn over the backdrop is rendered as a SIBLING of the
   * overlay, and that is exactly where a designer would put one. The subtree form let it through.
   */
  const hostOf = (el: Element) => {
    let node: Element | null = el
    while (node?.parentElement && node.parentElement !== document.body) node = node.parentElement
    return node!
  }

  it('has nothing focusable painted over the scrim', async () => {
    render(<Harness />)
    const dialog = await open()
    const scrim = document.querySelector('.clara-modal__scrim')!
    const focusable = [...hostOf(scrim).querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )].filter((el) => !dialog.contains(el))
    expect(focusable.map((el) => el.getAttribute('data-testid') ?? el.tagName)).toEqual([])
  })

  it('carries no text over the scrim either, so nothing needs a contrast pairing there', async () => {
    render(<Harness />)
    const dialog = await open()
    const scrim = document.querySelector('.clara-modal__scrim')!
    // The same DEEP walk the focusable row uses. Filtering `host.children` walked to ClaraPortal's
    // outer host, whose single child is the theme scope, which always contains the dialog - so the
    // filter emptied the list every time and the assertion could not fail in any direction. The
    // focusable row became a full guard and this one became no guard, in the same commit.
    // D0092 is about what is DRAWN. A visually-hidden live region paints nothing, so it is not a
    // violation - the first version flagged one, which would have taught the next author to weaken
    // this assertion rather than refine it. Graphics are: an <svg> on the scrim is neither
    // focusable nor text and slipped through both rows entirely.
    const painted = [...hostOf(scrim).querySelectorAll('*')]
      .filter((el) => !dialog.contains(el) && el !== dialog)
      // NOT `[aria-hidden]`. Radix marks the overlay itself aria-hidden, so excluding it hid
      // everything drawn ON the scrim - which is the entire subject. `aria-hidden` means hidden
      // from assistive technology; the pixels are still there, and D0092 is about what is DRAWN.
      .filter((el) => !el.closest('[hidden], .clara-visually-hidden'))
    const text = painted
      .flatMap((el) => [...el.childNodes])
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent?.trim() ?? '')
      .filter(Boolean)
    const graphics = painted.filter((el) => /^(svg|img|canvas|video|picture)$/i.test(el.tagName))
    expect({ text, graphics: graphics.map((el) => el.tagName.toLowerCase()) })
      .toEqual({ text: [], graphics: [] })
  })
})

describe('Modal scroll lock causes no shift', () => {
  it('locks the page and compensates for exactly the scrollbar width it removes', async () => {
    // jsdom computes NO layout, so no test here can observe a shift. What it CAN observe is the
    // mechanism, precisely: the page is locked, and the width the scrollbar occupied is handed
    // back as padding. The expected value is DERIVED from the stub rather than hardcoded, so the
    // assertion is "it compensates by the right amount", not "it compensates by 15px".
    //
    // Read from the injected stylesheet rather than from getComputedStyle: jsdom does not apply
    // injected rules to computed style, so reading the element reports nothing and the test would
    // pass on an implementation that compensates by zero. Same class as SHAPE_CONTRACT.
    const gap = 15
    stubViewport(1000, 1000 - gap)
    render(<Harness />)
    await open()
    await waitFor(() => expect(document.body).toHaveStyle({ overflow: 'hidden' }))
    const injected = [...document.querySelectorAll('style')].map((s) => s.textContent ?? '').join('\n')
    expect(injected).toMatch(/overflow:\s*hidden/)
    expect(injected).toMatch(new RegExp(`padding-right:\\s*${gap}px`))
  })

  it('releases the lock when it closes', async () => {
    // Asserting only the release passes on a Modal that never locked - `modal={false}` on Radix's
    // root satisfied it. The lock has to be observed BEFORE the release is worth anything.
    render(<Harness />)
    await open()
    await waitFor(() => expect(document.body).toHaveStyle({ overflow: 'hidden' }))
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(document.body).not.toHaveStyle({ overflow: 'hidden' }))
  })
})

describe('Modal body scrolls internally', () => {
  it('gives the body its own scroll container, leaving header and footer put', async () => {
    render(<Harness />)
    const dialog = await open()
    const body = dialog.querySelector('.clara-modal__body')!
    expect(body).not.toBeNull()
    // The mutant is letting the whole panel scroll, which scrolls the header and footer away.
    expect(dialog.querySelector('.clara-modal__header')).not.toBeNull()
    expect(dialog.querySelector('.clara-modal__footer')).not.toBeNull()
    expect(body.contains(screen.getByTestId('reason'))).toBe(true)
    expect(body.contains(screen.getByTestId('commit'))).toBe(false)
  })
})

describe('Modal stacks by open order', () => {
  it('puts the scrim and the panel in ONE host, panel after scrim', async () => {
    // D0088: every portalled surface shares --clara-layer-overlay and tree order separates them.
    // Two hosts, or a z-index between them, re-introduces the per-role constant.
    render(<Harness />)
    const dialog = await open()
    const scrim = document.querySelector('.clara-modal__scrim')!
    expect(scrim.parentElement).toBe(dialog.parentElement)
    const following = Node.DOCUMENT_POSITION_FOLLOWING
    // eslint-disable-next-line no-bitwise -- compareDocumentPosition returns a bitmask
    expect(scrim.compareDocumentPosition(dialog) & following).toBeTruthy()
  })

  it('creates no host at all while it is closed', async () => {
    const before = document.body.childElementCount
    render(<Harness />)
    await waitFor(() => expect(document.body.childElementCount).toBe(before + 1))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('Modal keyboard table', () => {
  it('closes on Escape from inside a text input', async () => {
    render(<Harness withInitialFocus />)
    await open()
    await waitFor(() => expect(screen.getByTestId('reason')).toHaveFocus())
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('commits on Enter in the footer action, and restores focus like every other route', async () => {
    // A row of the keyboard table with no test. The commit route was only ever exercised by click.
    render(<Harness />)
    await open()
    screen.getByTestId('commit').focus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(screen.getByTestId('opener')).toHaveFocus())
  })

  it('does NOT close on a click inside the panel', async () => {
    render(<Harness />)
    const dialog = await open()
    await userEvent.click(screen.getByTestId('second'))
    expect(dialog).toBeInTheDocument()
  })

  it('does NOT close when a drag starts inside the panel and ends on the scrim', async () => {
    // Selecting text in a modal and releasing outside it is the ordinary way this misfires, and it
    // is the row most often missing from a dialog's tests.
    render(<Harness />)
    const dialog = await open()
    const scrim = document.querySelector('.clara-modal__scrim')!
    fireEvent.pointerDown(screen.getByTestId('second'))
    fireEvent.pointerUp(scrim)
    fireEvent.click(scrim)
    expect(dialog).toBeInTheDocument()
  })

  it('does not close on Escape or the scrim when dismissible is false', async () => {
    const spy = vi.fn()
    render(<Harness dismissible={false} onClose={spy} />)
    const dialog = await open()
    await userEvent.keyboard('{Escape}')
    expect(dialog).toBeInTheDocument()
    // The gesture asserted here must be one that DOES dismiss when `dismissible` is true - a bare
    // `click` on the scrim does not close a dismissible modal either, so asserting it is a
    // tautology that passes on any implementation.
    const scrim = document.querySelector('.clara-modal__scrim')!
    fireEvent.pointerDown(scrim)
    fireEvent.pointerUp(scrim)
    fireEvent.click(scrim)
    expect(dialog).toBeInTheDocument()
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('Modal theme and density matrix', () => {
  it.each([
    ['light', 'comfortable'], ['light', 'compact'],
    ['dark', 'comfortable'], ['dark', 'compact'],
  ] as const)('carries %s / %s into the portal', async (theme, density) => {
    render(
      <ClaraProvider theme={theme} density={density}>
        <Modal open onClose={() => {}} title="t"><span data-testid="in">x</span></Modal>
      </ClaraProvider>,
    )
    const scope = (await screen.findByTestId('in')).closest('[data-clara-theme]')!
    expect(scope).toHaveAttribute('data-clara-theme', theme)
    expect(scope).toHaveAttribute('data-clara-density', density)
  })
})

describe('Modal focus never scrolls the page', () => {
  /**
   * Scoped by CALLER, not by time.
   *
   * The first version spied for the duration of the close, which covered ONE of Modal's three focus
   * calls - and not the one round 3 measured in Chromium scrolling the page from y=4000 to 0.
   * Removing `preventScroll` from the fallback loop left the whole file green under a test named
   * "every focus call it makes". Time-scoping was honestly explained and still under-claimed.
   *
   * jsdom ignores the option, so this asserts the ARGUMENT. The outcome is gate 7's, and the
   * verification record says so.
   */
  const recordFocusCalls = async (run: () => Promise<void>) => {
    const calls: Array<FocusOptions | undefined> = []
    const real = HTMLElement.prototype.focus
    HTMLElement.prototype.focus = function focus (options?: FocusOptions) {
      calls.push(options)
      return real.call(this, options)
    }
    try { await run() } finally { HTMLElement.prototype.focus = real }
    return calls
  }

  it('passes preventScroll when restoring to the opener', async () => {
    render(<Harness withInitialFocus />)
    await open()
    await waitFor(() => expect(screen.getByTestId('reason')).toHaveFocus())
    const calls = await recordFocusCalls(async () => {
      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(screen.getByTestId('opener')).toHaveFocus())
    })
    expect(calls.length).toBeGreaterThan(0)
    expect(calls.filter((o) => o?.preventScroll !== true)).toEqual([])
  })

  it('passes preventScroll in the FALLBACK loop, which is where the scroll jump was measured', async () => {
    function Vanishes () {
      const [open, setOpen] = useState(false)
      const [gone, setGone] = useState(false)
      return (
        <ClaraProvider>
          {!gone && <button data-testid="opener" onClick={() => { setOpen(true); setGone(true) }}>Open</button>}
          <button data-testid="elsewhere">Elsewhere</button>
          <Modal open={open} onClose={() => setOpen(false)} title="t"><button data-testid="in">x</button></Modal>
        </ClaraProvider>
      )
    }
    render(<Vanishes />)
    await userEvent.click(screen.getByTestId('opener'))
    await screen.findByRole('dialog')
    const calls = await recordFocusCalls(async () => {
      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(screen.getByTestId('elsewhere')).toHaveFocus())
    })
    expect(calls.length).toBeGreaterThan(0)
    expect(calls.filter((o) => o?.preventScroll !== true)).toEqual([])
  })

  it('passes preventScroll when moving focus to the named initial target', async () => {
    const calls = await recordFocusCalls(async () => {
      render(<Harness withInitialFocus />)
      await open()
      await waitFor(() => expect(screen.getByTestId('reason')).toHaveFocus())
    })
    // Radix and testing-library also focus during setup, so only Clara's own call is asserted:
    // the one that landed on the named initial target.
    expect(calls.some((o) => o?.preventScroll === true)).toBe(true)
  })
})

describe('Modal public surface', () => {
  it('forwards ref to the panel', async () => {
    // The API report publishes `RefAttributes<HTMLDivElement>`, and the forward was deletable with
    // every test green - a published promise that nothing checked.
    const ref = { current: null as HTMLDivElement | null }
    render(
      <ClaraProvider>
        <Modal ref={ref} open onClose={() => {}} title="t"><span data-testid="in">x</span></Modal>
      </ClaraProvider>,
    )
    const dialog = await screen.findByRole('dialog')
    expect(ref.current).toBe(dialog)
  })

  it('merges className rather than replacing the component class', async () => {
    render(
      <ClaraProvider>
        <Modal open onClose={() => {}} title="t" className="tenant-modal"><span data-testid="in">x</span></Modal>
      </ClaraProvider>,
    )
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveClass('clara-modal')
    expect(dialog).toHaveClass('tenant-modal')
  })
})

describe('Modal accessible structure and axe', () => {
  it('is a dialog named by its title and described by its description', async () => {
    render(<Harness />)
    const dialog = await open()
    expect(dialog).toHaveAccessibleName('Reverse this posting')
    expect(dialog).toHaveAccessibleDescription('The reversal is dated today.')
  })

  it('has no serious or critical axe violations when open', async () => {
    // The matcher is the assertion. `await runAxe(...)` on its own RESOLVES with the violations and
    // asserts nothing - this call site shipped without it, and an injected critical `image-alt`
    // passed. It is the one thing a reviewer checks first about an axe test, and rightly.
    render(<Harness />)
    await open()
    await expect(runAxe(document.body)).resolves.toHaveNoBlockingViolations()
  })

  it('has no serious or critical axe violations in its ERROR state', async () => {
    // AC8 says "default AND error states". A dialog carrying a failed field is a different tree:
    // the error text, the aria-describedby chain and the invalid control all only exist here.
    render(
      <ClaraProvider>
        <Modal open onClose={() => {}} title="Reverse this posting" description="Cannot be undone.">
          <Field label="Reason" error="A reason is required"><Input /></Field>
        </Modal>
      </ClaraProvider>,
    )
    await screen.findByRole('dialog')
    await expect(runAxe(document.body)).resolves.toHaveNoBlockingViolations()
  })
})

describe('Modal test hygiene', () => {
  it('restores the viewport exactly, whatever order the tests run in', () => {
    // Asserting jsdom's constants alone is a POSITIONAL canary: move this describe above the
    // scroll-lock one and it passes whether or not `stubViewport` ever restores anything. So the
    // stub is exercised HERE, in this test, and the restore is asserted directly - which holds in
    // any order and under `--sequence.shuffle`.
    const before = { inner: window.innerWidth, client: document.documentElement.clientWidth }
    stubViewport(1000, 985)
    expect(window.innerWidth).toBe(1000)
    expect(document.documentElement.clientWidth).toBe(985)
    while (savedViewport.length) savedViewport.pop()!()
    expect({ inner: window.innerWidth, client: document.documentElement.clientWidth }).toEqual(before)
    // And jsdom's real defaults, so a leak from an earlier test in the file is still visible.
    expect(before).toEqual({ inner: 1024, client: 0 })
  })
})
