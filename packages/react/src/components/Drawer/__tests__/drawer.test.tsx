import { useRef, useState, type ReactNode } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { runAxe } from '../../../../../../test/axe'
import { ClaraProvider } from '../../../theme/ClaraProvider'
import { Button } from '../../Button/Button'
import { Modal } from '../../Modal/Modal'
import { Drawer } from '../Drawer'
import type { DrawerPlacement } from '../Drawer'

const PLACEMENTS: DrawerPlacement[] = ['left', 'right', 'bottom']

/**
 * Open by clicking a real opener, so the captured opener is a real element and not a stub.
 *
 * **The decoy is load-bearing and must stay FIRST in document order.** Without it this harness
 * cannot tell the named restore from the anonymous fallback: `restoreFallback` walks
 * `document.querySelectorAll` in document order, so when the opener is the first focusable element
 * on the page BOTH paths land on it and `expect(activeElement).toBe(opener)` is satisfied by
 * either. A review measured exactly that - disabling `restoreNamed` outright left every test in
 * this file green and moved the failure into Modal's own suite, which is the D0065 proxy wearing
 * an identity assertion.
 *
 * With a focusable decoy ahead of it, the fallback lands on the DECOY and only the named restore
 * lands on the opener, so the assertion means what the criterion says it means.
 */
function Harness ({ overlay }: { overlay: 'modal' | 'drawer' }) {
  const [open, setOpen] = useState(false)
  const Overlay = overlay === 'modal' ? Modal : Drawer
  return (
    <>
      <a id="decoy" href="/decoy">Decoy</a>
      <button id="opener" onClick={() => setOpen(true)}>Open</button>
      <a id="elsewhere" href="/x">Elsewhere</a>
      <Overlay open={open} onClose={() => setOpen(false)} title="Panel">
        <p>Body</p>
      </Overlay>
    </>
  )
}

const openIt = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Open' }))
  return screen.findByRole('dialog')
}

describe('Drawer placements', () => {
  it.each(PLACEMENTS)('%s renders with its own placement class', async (placement) => {
    render(
      <Drawer open onClose={() => {}} title="Filters" placement={placement}>
        <p>Body</p>
      </Drawer>,
    )
    const dialog = await screen.findByRole('dialog')
    expect(dialog.className).toContain(`clara-drawer--${placement}`)
  })

  it('defaults to right, so a consumer who does not choose gets the common case', async () => {
    render(<Drawer open onClose={() => {}} title="Filters"><p>Body</p></Drawer>)
    expect((await screen.findByRole('dialog')).className).toContain('clara-drawer--right')
  })

  it('names itself, in every placement', async () => {
    // An unnamed dialog announces as "dialog" and nothing more, whichever edge it is on.
    for (const placement of PLACEMENTS) {
      const { unmount } = render(
        <Drawer open onClose={() => {}} title={`Filters ${placement}`} placement={placement}>
          <p>Body</p>
        </Drawer>,
      )
      expect(await screen.findByRole('dialog', { name: `Filters ${placement}` })).toBeInTheDocument()
      unmount()
    }
  })

  it('passes axe in every placement', async () => {
    for (const placement of PLACEMENTS) {
      const { unmount } = render(
        <Drawer open onClose={() => {}} title="Filters" placement={placement}><p>Body</p></Drawer>,
      )
      await screen.findByRole('dialog')
      // `document.body`, not `container`: the panel is portalled out of the React root, so a
      // container-scoped run inspects the opener and nothing else. Measured on Popover - an
      // `aria-allowed-attr` violation injected into the panel left the container-scoped run green
      // while the body-scoped matrix caught it (review B1/M4).
      await expect(runAxe(document.body)).resolves.toHaveNoBlockingViolations()
      unmount()
    }
  })
})

/**
 * AC2. Parity is asserted by running the SAME scenarios against both components and requiring the
 * same outcome, rather than by asserting Drawer imports something.
 *
 * The implementation is already shared - both call `useOverlayFocusRestore` - so these would be
 * hard to fail today. That is the point: they fail the moment somebody gives Drawer its own copy,
 * which is the drift the criterion exists to prevent, and no structural assertion catches that as
 * directly as running the behaviour twice.
 */
describe('Drawer focus parity with Modal', () => {
  it.each(['modal', 'drawer'] as const)('%s returns focus to the opener by identity', async (overlay) => {
    render(<Harness overlay={overlay} />)
    const opener = screen.getByRole('button', { name: 'Open' })
    await openIt()
    await userEvent.keyboard('{Escape}')
    // By identity, not by selector: "a button is focused" passes on the wrong button.
    await waitFor(() => expect(document.activeElement).toBe(opener))
  })

  it.each(['modal', 'drawer'] as const)('%s restores to the opener and NOT to the first focusable element', async (overlay) => {
    // The discriminating case, stated as its own test rather than left implicit in the harness.
    // If the named restore is ever disabled, the fallback lands on `#decoy` and this fails - which
    // is the whole reason the decoy exists. Asserting the NEGATIVE as well as the positive is what
    // makes the identity claim checkable: "focus is on the opener" is also true when the fallback
    // happened to pick the opener.
    render(<Harness overlay={overlay} />)
    const opener = screen.getByRole('button', { name: 'Open' })
    const decoy = screen.getByRole('link', { name: 'Decoy' })
    await openIt()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(document.activeElement).toBe(opener))
    expect(document.activeElement).not.toBe(decoy)
  })

  it.each(['modal', 'drawer'] as const)('%s honours returnFocus over the opener', async (overlay) => {
    // `returnFocus` is PUBLIC API on both components and had no Drawer assertion at all - Modal
    // tested it, Drawer did not, and AC2's parity claim is that the same scenarios run against
    // both. Named target beats captured opener; that is the contract, and a drawer opened from a
    // row action that then disappears is the case it exists for.
    function WithReturn () {
      const target = useRef<HTMLButtonElement>(null)
      const [open, setOpen] = useState(false)
      const Overlay = overlay === 'modal' ? Modal : Drawer
      return (
        <>
          <a id="decoy" href="/decoy">Decoy</a>
          <button onClick={() => setOpen(true)}>Open</button>
          <button ref={target}>Return here</button>
          <Overlay open={open} onClose={() => setOpen(false)} title="Panel" returnFocus={target}>
            <p>Body</p>
          </Overlay>
        </>
      )
    }
    render(<WithReturn />)
    const named = screen.getByRole('button', { name: 'Return here' })
    const opener = screen.getByRole('button', { name: 'Open' })
    await openIt()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(document.activeElement).toBe(named))
    // Both halves: landing on the named target is only meaningful if the opener was the other
    // candidate and lost.
    expect(document.activeElement).not.toBe(opener)
  })

  it.each(['modal', 'drawer'] as const)('%s honours an initialFocus target', async (overlay) => {
    function WithInitial () {
      const target = useRef<HTMLButtonElement>(null)
      const Overlay = overlay === 'modal' ? Modal : Drawer
      return (
        <Overlay open onClose={() => {}} title="Panel" initialFocus={target}>
          <button ref={target} id="named">Named</button>
        </Overlay>
      )
    }
    render(<WithInitial />)
    const named = await screen.findByRole('button', { name: 'Named' })
    await waitFor(() => expect(document.activeElement).toBe(named))
  })

  it.each(['modal', 'drawer'] as const)('%s does not steal focus while closed', async (overlay) => {
    // The defect this guards: an overlay rendered `open={false}` - the ordinary state of every
    // dialog on the page - running its restore on first commit and taking focus from the user.
    const Overlay = overlay === 'modal' ? Modal : Drawer
    render(
      <>
        <button id="outside">Outside</button>
        <Overlay open={false} onClose={() => {}} title="Panel"><p>Body</p></Overlay>
      </>,
    )
    const outside = screen.getByRole('button', { name: 'Outside' })
    outside.focus()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(document.activeElement).toBe(outside)
  })

  it.each(['modal', 'drawer'] as const)('%s restores focus when it UNMOUNTS rather than closes', async (overlay) => {
    // `{open && <Overlay open .../>}` is the first thing a React developer writes, and there is no
    // open -> closed transition on that route: the component simply goes away.
    function Unmounting () {
      const [mounted, setMounted] = useState(true)
      const Overlay = overlay === 'modal' ? Modal : Drawer
      return (
        <>
          <button id="opener">Opener</button>
          {mounted
            ? (
              <Overlay open onClose={() => {}} title="Panel">
                {/* The control is INSIDE the overlay, because the background is genuinely inert
                    while one is open - Radix sets `pointer-events: none` on it, and a first
                    attempt at this scenario clicked a background button no user could reach.
                    "Save and close", unmounting the overlay outright, is the real route. */}
                <button onClick={() => setMounted(false)}>Save and close</button>
              </Overlay>
              )
            : null}
        </>
      )
    }
    render(<Unmounting />)
    await screen.findByRole('dialog')
    await userEvent.click(screen.getByRole('button', { name: 'Save and close' }))
    // Not stranded on the body, which is what this whole path exists to prevent.
    await waitFor(() => expect(document.activeElement).not.toBe(document.body))
  })
})

/**
 * AC9. `dismissible` is PUBLIC API and had zero tests: replacing `blockIfNotDismissible` with an
 * empty function - so Escape and an outside pointer dismiss a drawer declared `dismissible={false}`
 * - left all 1191 tests and all 30 guards green. A published behaviour prop that nothing exercises
 * is a promise with no witness, and it is a one-way door.
 *
 * Both directions are asserted, and that is the point rather than thoroughness for its own sake.
 * Modal's suite records why: a bare `click` on the scrim does not dismiss a DISMISSIBLE overlay
 * either, so asserting "it did not close" on a gesture that never closes anything is a tautology
 * that passes on any implementation, including one where the prop does nothing at all.
 */
describe('Drawer dismissible', () => {
  function Harness2 ({ dismissible, onClose }: { dismissible?: boolean, onClose: () => void }) {
    return (
      <Drawer open onClose={onClose} title="Panel" {...(dismissible === undefined ? {} : { dismissible })}>
        <p>Body</p>
      </Drawer>
    )
  }
  const outsidePointer = () => {
    const scrim = document.querySelector('.clara-drawer__scrim')!
    fireEvent.pointerDown(scrim)
    fireEvent.pointerUp(scrim)
    fireEvent.click(scrim)
  }

  it('closes on Escape and on an outside pointer BY DEFAULT', async () => {
    // The control case. Without it the two assertions below prove nothing: they would also pass on
    // a Drawer that can never be dismissed by any route.
    const spy = vi.fn()
    render(<Harness2 onClose={spy} />)
    await screen.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    expect(spy).toHaveBeenCalled()

    const spy2 = vi.fn()
    render(<Harness2 onClose={spy2} />)
    await screen.findAllByRole('dialog')
    outsidePointer()
    await waitFor(() => expect(spy2).toHaveBeenCalled())
  })

  it('does not close on Escape or an outside pointer when dismissible is false', async () => {
    const spy = vi.fn()
    render(<Harness2 dismissible={false} onClose={spy} />)
    const dialog = await screen.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    outsidePointer()
    expect(dialog).toBeInTheDocument()
    expect(spy).not.toHaveBeenCalled()
  })

  it('keeps the close button when dismissible is false', async () => {
    // `dismissible={false}` blocks the two routes that happen by ACCIDENT. It deliberately does not
    // remove the exit: a panel with no way out is a trap, not a safeguard, and Drawer.tsx says so.
    const spy = vi.fn()
    render(<Harness2 dismissible={false} onClose={spy} />)
    await screen.findByRole('dialog')
    const close = screen.getByRole('button', { name: /close/i })
    expect(close).toBeInTheDocument()
    await userEvent.click(close)
    expect(spy).toHaveBeenCalledTimes(1)
  })
})

/**
 * AC10. A described drawer with a footer - the shape an ERP filter panel actually takes, and the
 * one nothing rendered. Deleting `aria-describedby` and the whole `Dialog.Description` branch left
 * every test green, because no test ever passed `description`; the `footer` branch was equally
 * unwitnessed, and so were the axe runs over a panel carrying either.
 */
describe('Drawer description and footer', () => {
  it('wires the description into the accessible description, and renders the footer', async () => {
    render(
      <Drawer
        open onClose={() => {}} title="Filters"
        description="Narrow the result set. Filters apply immediately."
        footer={<Button>Apply</Button>}
      >
        <p>Body</p>
      </Drawer>,
    )
    // By ACCESSIBLE DESCRIPTION, not by `textContent` and not by the presence of the attribute:
    // an `aria-describedby` pointing at a missing id is present and announces nothing, which is
    // the failure the id wiring exists to avoid.
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAccessibleDescription('Narrow the result set. Filters apply immediately.')
    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument()
    await expect(runAxe(document.body)).resolves.toHaveNoBlockingViolations()
  })

  it('carries no aria-describedby when there is no description', async () => {
    // The other half. A drawer that always emitted the attribute would pass the test above while
    // pointing every undescribed panel at an element that does not exist.
    render(<Drawer open onClose={() => {}} title="Filters"><p>Body</p></Drawer>)
    expect(await screen.findByRole('dialog')).not.toHaveAttribute('aria-describedby')
  })
})

describe('Drawer locks scroll', () => {
  it('locks the page and compensates for exactly the scrollbar width it removes', async () => {
    // jsdom computes NO layout, so no test here can observe a shift. What it CAN observe is the
    // mechanism: the page is locked, and the width the scrollbar occupied is handed back as
    // padding. The expected value is DERIVED from the stub rather than hardcoded.
    const gap = 15
    const width = Object.getOwnPropertyDescriptor(window, 'innerWidth')
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 })
    Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: 1000 - gap })

    render(<Harness overlay="drawer" />)
    await openIt()
    await waitFor(() => expect(document.body).toHaveStyle({ overflow: 'hidden' }))
    // Read from the injected stylesheet: jsdom does not apply injected rules to computed style, so
    // reading the element reports nothing and this would pass on a lock that compensates by zero.
    const injected = [...document.querySelectorAll('style')].map((s) => s.textContent ?? '').join('\n')
    expect(injected).toMatch(/overflow:\s*hidden/)
    expect(injected).toMatch(new RegExp(`padding-right:\\s*${gap}px`))

    if (width) Object.defineProperty(window, 'innerWidth', width)
  })

  it('releases the lock when it closes', async () => {
    // Asserting only the release passes on a Drawer that never locked.
    render(<Harness overlay="drawer" />)
    await openIt()
    await waitFor(() => expect(document.body).toHaveStyle({ overflow: 'hidden' }))
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(document.body).not.toHaveStyle({ overflow: 'hidden' }))
  })
})

/** Declared under its own literal name - see the note in Badge's suite for why not `describe.each`. */
describe('Drawer theme and density matrix', () => {
  it.each([
    ['light', 'comfortable'], ['light', 'compact'],
    ['dark', 'comfortable'], ['dark', 'compact'],
  ] as const)('renders and passes axe in %s / %s', async (theme, density) => {
    render(
      <ClaraProvider theme={theme} density={density}>
        <Drawer open onClose={() => {}} title="Filters"><p>Body</p></Drawer>
      </ClaraProvider>,
    )
    await screen.findByRole('dialog')
    // Walked UP from an element INSIDE the panel, not `container.querySelector`.
    //
    // The panel is portalled to `document.body`, so `container` holds only the trigger and the
    // provider's own wrapper - and that wrapper carries the theme attributes too. Querying it found
    // a correct-looking answer that was never the portal's scope: stripping the attributes from
    // ClaraPortal entirely left this assertion green (BG review B3, D0065 - observe the property,
    // not a proxy for it).
    const scope = (await screen.findByRole('dialog')).closest('[data-clara-theme]')
    expect(scope).toHaveAttribute('data-clara-theme', theme)
    expect(scope).toHaveAttribute('data-clara-density', density)
    await expect(runAxe(document.body as unknown as ReactNode extends never ? never : HTMLElement))
      .resolves.toHaveNoBlockingViolations()
  })
})
