import { useState } from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { runAxe } from '../../../../../../test/axe'
import { ClaraProvider } from '../../../theme/ClaraProvider'
import { Button } from '../../Button/Button'
import { Popover } from '../Popover'

function Harness () {
  const [open, setOpen] = useState(false)
  return (
    <>
      <a id="before" href="/a">Before</a>
      <Popover
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        label="Column options"
        trigger={<Button>Options</Button>}
      >
        <button>Inside</button>
      </Popover>
      <a id="after" href="/b">After</a>
    </>
  )
}

describe('Popover returns focus without trapping', () => {
  it('returns focus to the trigger on Escape', async () => {
    render(<Harness />)
    const trigger = screen.getByRole('button', { name: 'Options' })
    await userEvent.click(trigger)
    await screen.findByRole('button', { name: 'Inside' })
    await userEvent.keyboard('{Escape}')
    // By identity: "a button is focused" would pass on the wrong button.
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })

  it('leaves the background reachable, which is what non-modal MEANS', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Options' }))
    await screen.findByRole('button', { name: 'Inside' })
    // A modal marks the background aria-hidden and inert. A popover must not: the defect this
    // guards is a popover that is a dialog wearing a smaller box.
    expect(screen.getByRole('link', { name: 'After' })).toBeInTheDocument()
    expect(document.getElementById('after')?.closest('[aria-hidden="true"]')).toBeNull()
    expect(document.body).not.toHaveStyle({ overflow: 'hidden' })
  })

  it('lets focus rest outside the panel while it is open', async () => {
    // The trapping property, asserted the way a trap actually manifests: a focus scope yanks focus
    // BACK when it lands outside. So move focus out and check it stays.
    //
    // Not asserted with `userEvent.tab()`: the panel is portalled to the end of `document.body`, so
    // tabbing from inside it has no following tabbable and jsdom's tab model does not wrap the way
    // a browser does - the first version of this test read that as a trap when nothing was trapped.
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Options' }))
    await screen.findByRole('button', { name: 'Inside' })

    const outside = screen.getByRole('link', { name: 'After' })
    outside.focus()
    await new Promise((resolve) => setTimeout(resolve, 0))

    // Focus STAYED where the user put it. That is the whole assertion: a focus scope manifests by
    // yanking focus back INTO the panel, and nothing did.
    expect(document.activeElement).toBe(outside)

    // The panel dismisses as a consequence, and that is designed rather than incidental - moving
    // focus out of a non-modal popover is a dismissal route, the same as clicking outside it. An
    // earlier version of this test asserted the panel was still open and failed for that reason,
    // which read as a trap when the opposite had happened.
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Inside' })).toBeNull())
    // ...and it did not steal focus back to the trigger on the way out, which a restore would.
    expect(document.activeElement).toBe(outside)
  })

  it('closes on an outside click and LEAVES focus where the click landed', async () => {
    // The title used to say "returns focus to the trigger", and the body asserted no focus at all.
    // It was false in both directions a review measured: clicking a focusable element leaves focus
    // THERE, and clicking a non-focusable one leaves it on `document.body` - never on the trigger.
    //
    // Radix is explicit about it: `if (!hasInteractedOutsideRef.current) triggerRef.current?.focus()`,
    // so an outside interaction deliberately suppresses the restore. That is correct for a non-modal
    // surface - yanking focus back to a trigger the user just clicked away from is the trap this
    // component exists not to be - and the sibling test above already says so. Only the title
    // disagreed, and it sat inside AC1's own verifier, so it printed as evidence.
    render(<Harness />)
    const trigger = screen.getByRole('button', { name: 'Options' })
    await userEvent.click(trigger)
    await screen.findByRole('button', { name: 'Inside' })
    const before = screen.getByRole('link', { name: 'Before' })
    await userEvent.click(before)
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Inside' })).toBeNull())
    // Asserted, not merely titled: focus is where the user put it.
    expect(document.activeElement, 'focus was yanked back to the trigger, which is the trap')
      .toBe(before)
    expect(document.activeElement).not.toBe(trigger)
  })

  it('keeps the consumer className alongside its own', async () => {
    // Unpinned until now, against an in-repo precedent: Modal already asserts its equivalent.
    // `cx('clara-popover', className)` collapsing to `cx('clara-popover')` survived all 818 tests.
    render(
      <Popover open onOpen={() => {}} onClose={() => {}} label="Options" className="tenant-popover"
        trigger={<Button>Options</Button>}>
        <button>Inside</button>
      </Popover>,
    )
    await screen.findByRole('button', { name: 'Inside' })
    const panel = document.querySelector('.clara-popover')
    expect(panel, 'the panel lost its own class').not.toBeNull()
    expect(panel!.classList.contains('tenant-popover'), 'the consumer className was dropped').toBe(true)
  })

  it('hides the accessible name visually, rather than printing it in the panel', async () => {
    // Deleting just the CLASS (keeping the span) survived 818 tests, and would render the label as
    // visible text at the top of every panel. jsdom cannot see the styling; what it CAN see is that
    // the element carries the class the stylesheet acts on, which is the mechanism.
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Options' }))
    await screen.findByRole('button', { name: 'Inside' })
    const label = document.querySelector('.clara-popover .clara-visually-hidden')
    expect(label, 'the label is no longer visually hidden - it prints inside the panel').not.toBeNull()
    expect(label!.textContent).toBe('Column options')
  })

  it('names the panel, so it is not announced as an unnamed group', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Options' }))
    expect(await screen.findByRole('group', { name: 'Column options' })).toBeInTheDocument()
  })

  it('passes axe while open', async () => {
    const { container } = render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Options' }))
    await screen.findByRole('button', { name: 'Inside' })
    // `document.body`, not `container`: the panel is portalled out of the React root, so a
    // container-scoped run inspects the trigger and nothing else. Measured - an
    // `aria-allowed-attr` violation injected into the panel left this green (review B1).
    await expect(runAxe(document.body)).resolves.toHaveNoBlockingViolations()
  })
})

/** Declared under its own literal name - see the note in Badge's suite for why not `describe.each`. */
describe('Popover theme and density matrix', () => {
  it.each([
    ['light', 'comfortable'], ['light', 'compact'],
    ['dark', 'comfortable'], ['dark', 'compact'],
  ] as const)('renders and passes axe in %s / %s', async (theme, density) => {
    const { container } = render(
      <ClaraProvider theme={theme} density={density}><Harness /></ClaraProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Options' }))
    await screen.findByRole('button', { name: 'Inside' })
    // Walked UP from an element INSIDE the panel, not `container.querySelector`.
    //
    // The panel is portalled to `document.body`, so `container` holds only the trigger and the
    // provider's own wrapper - and that wrapper carries the theme attributes too. Querying it found
    // a correct-looking answer that was never the portal's scope: stripping the attributes from
    // ClaraPortal entirely left this assertion green (BG review B3, D0065 - observe the property,
    // not a proxy for it).
    const scope = (await screen.findByRole('button', { name: 'Inside' })).closest('[data-clara-theme]')
    expect(scope).toHaveAttribute('data-clara-theme', theme)
    expect(scope).toHaveAttribute('data-clara-density', density)
    // `document.body`, not `container` - and this line is the reason a second review round
    // rejected this story. Round 1 caught the container-scoped axe, and the repair fixed the
    // call above AND Drawer's identical copy while missing THIS one, which is AC4's own
    // verifier: the criterion says "passes axe in all four combinations", and all four were
    // inspecting a subtree the panel is not in. Measured: an `aria-allowed-attr` violation
    // injected into the panel left this matrix 4/4 green.
    await expect(runAxe(document.body)).resolves.toHaveNoBlockingViolations()
  })
})

/**
 * AC2, narrowed to what this runner can actually prove.
 *
 * The criterion's rendered half - flips, shifts, stays anchored on scroll - is layout, and jsdom
 * computes none. What is observable here is that the collision behaviour is CONFIGURED and that the
 * requested placement reaches the panel, which is a much weaker claim and is named as one. The
 * rendered behaviour is BG-01M0XVXS's: gate 9's fixture is a server render and no portalled surface
 * appears in it at all.
 */
describe('Popover collision handling is configured', () => {
  it.each(['top', 'right', 'bottom', 'left'] as const)('passes %s through to the panel', async (placement) => {
    function Placed () {
      const [open, setOpen] = useState(false)
      return (
        <Popover
          open={open} onOpen={() => setOpen(true)} onClose={() => setOpen(false)}
          label="Options" placement={placement} trigger={<Button>Options</Button>}
        >
          <button>Inside</button>
        </Popover>
      )
    }
    render(<Placed />)
    await userEvent.click(screen.getByRole('button', { name: 'Options' }))
    const panel = await screen.findByRole('group', { name: 'Options' })
    // Radix reflects the RESOLVED side, which is the requested one until a collision moves it -
    // and in jsdom nothing has a size, so nothing ever collides. That is exactly why this test
    // cannot be the criterion's whole answer.
    expect(panel.getAttribute('data-side')).toBe(placement)
  })
})
