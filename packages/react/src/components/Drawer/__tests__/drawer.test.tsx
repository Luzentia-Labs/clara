import { useRef, useState, type ReactNode } from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { runAxe } from '../../../../../../test/axe'
import { ClaraProvider } from '../../../theme/ClaraProvider'
import { Button } from '../../Button/Button'
import { Modal } from '../../Modal/Modal'
import { Drawer } from '../Drawer'
import type { DrawerPlacement } from '../Drawer'

const PLACEMENTS: DrawerPlacement[] = ['left', 'right', 'bottom']

/** Open by clicking a real opener, so the captured opener is a real element and not a stub. */
function Harness ({ overlay }: { overlay: 'modal' | 'drawer' }) {
  const [open, setOpen] = useState(false)
  const Overlay = overlay === 'modal' ? Modal : Drawer
  return (
    <>
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
      const { container, unmount } = render(
        <Drawer open onClose={() => {}} title="Filters" placement={placement}><p>Body</p></Drawer>,
      )
      await screen.findByRole('dialog')
      await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
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
    const { container } = render(
      <ClaraProvider theme={theme} density={density}>
        <Drawer open onClose={() => {}} title="Filters"><p>Body</p></Drawer>
      </ClaraProvider>,
    )
    await screen.findByRole('dialog')
    const scope = container.querySelector('[data-clara-theme]')
    expect(scope).toHaveAttribute('data-clara-theme', theme)
    expect(scope).toHaveAttribute('data-clara-density', density)
    await expect(runAxe(document.body as unknown as ReactNode extends never ? never : HTMLElement))
      .resolves.toHaveNoBlockingViolations()
  })
})
