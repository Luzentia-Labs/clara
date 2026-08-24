import { useRef, useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { runAxe } from '../../../../../../test/axe'
import { ClaraProvider } from '../../../theme/ClaraProvider'
import { Modal } from '../Modal'
import { Button } from '../../Button/Button'
import { Input } from '../../Input/Input'

/**
 * Modal's tests are written from the keyboard interaction table in US-01M0GM48 (D0024: the table is
 * the specification). Every row there has an assertion here, and the four dismissal routes are
 * asserted SEPARATELY - a single "it restores focus" test passes on an implementation that handles
 * one route and drops the other three, which is the strand this component exists to prevent.
 */

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

  it('falls back to a named element inside the panel when the author names none', async () => {
    render(<Harness />)
    const dialog = await open()
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
    expect(document.activeElement).not.toBe(document.body)
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
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.getByTestId('opener')).toHaveFocus())
  })

  it('restores focus to the opener after a scrim click', async () => {
    const { container } = render(<Harness />)
    await open()
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

describe('Modal marks background inert', () => {
  it('makes background content unreachable, not merely Tab-trapped', async () => {
    // The mutant this must fail on is dropping the inert marking while keeping Radix's Tab trap.
    // Pressing Tab would still cycle inside the panel, so a Tab-only test stays green. Asserting
    // the background is not REACHABLE is what sees it.
    render(<Harness />)
    await open()
    const background = screen.getByTestId('background-button')
    expect(background.closest('[aria-hidden="true"], [inert]')).not.toBeNull()
    background.focus()
    expect(background).not.toHaveFocus()
  })

  it('wraps from the last focusable back to the first, so focus never leaves', async () => {
    render(<Harness withInitialFocus />)
    const dialog = await open()
    await waitFor(() => expect(screen.getByTestId('reason')).toHaveFocus())
    for (let i = 0; i < 8; i++) {
      await userEvent.tab()
      expect(dialog.contains(document.activeElement)).toBe(true)
    }
  })

  it('wraps backwards too', async () => {
    render(<Harness withInitialFocus />)
    const dialog = await open()
    await waitFor(() => expect(screen.getByTestId('reason')).toHaveFocus())
    for (let i = 0; i < 8; i++) {
      await userEvent.tab({ shift: true })
      expect(dialog.contains(document.activeElement)).toBe(true)
    }
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
    Object.defineProperty(document.documentElement, 'clientWidth', { value: 1000 - gap, configurable: true })
    Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true })
    render(<Harness />)
    await open()
    await waitFor(() => expect(document.body).toHaveStyle({ overflow: 'hidden' }))
    const injected = [...document.querySelectorAll('style')].map((s) => s.textContent ?? '').join('\n')
    expect(injected).toMatch(/overflow:\s*hidden/)
    expect(injected).toMatch(new RegExp(`padding-right:\\s*${gap}px`))
  })

  it('releases the lock when it closes', async () => {
    render(<Harness />)
    await open()
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
    const scrim = document.querySelector('.clara-modal__scrim')!
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

describe('Modal accessible structure and axe', () => {
  it('is a dialog named by its title and described by its description', async () => {
    render(<Harness />)
    const dialog = await open()
    expect(dialog).toHaveAccessibleName('Reverse this posting')
    expect(dialog).toHaveAccessibleDescription('The reversal is dated today.')
  })

  it('has no serious or critical axe violations when open', async () => {
    render(<Harness />)
    await open()
    await runAxe(document.body)
  })
})
