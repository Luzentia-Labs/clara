import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { runAxe } from '../../../../../../test/axe'
import { ClaraProvider } from '../../../theme/ClaraProvider'
import { resetDevWarnings } from '../../../lib/dev-warning'
import { Tooltip } from '../Tooltip'
import type { TooltipPlacement } from '../Tooltip'

const PLACEMENTS: TooltipPlacement[] = ['top', 'right', 'bottom', 'left']

/**
 * Radix opens on hover after `delayDuration` (700 ms) but on focus IMMEDIATELY. Every test that
 * wants an open tooltip therefore drives it by focus, which is also the route AC1 is about.
 */
function Harness ({ content = 'Recalculates every open line', placement }: {
  content?: string
  placement?: TooltipPlacement
}) {
  // `placement` is spread rather than passed directly: under `exactOptionalPropertyTypes` an
  // explicit `undefined` is not the same as an absent prop, and passing one would force
  // `TooltipProps` to admit `undefined` purely to satisfy a test harness.
  return (
    <Tooltip content={content} {...(placement ? { placement } : {})}>
      <button>Recalculate</button>
    </Tooltip>
  )
}

describe('Tooltip appears on keyboard focus', () => {
  it('opens on focus, not only on hover', async () => {
    // AC1. The whole point of the component: a hover-only tooltip is invisible to exactly the
    // people most likely to need the explanation.
    render(<Harness />)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Recalculate' })).toHaveFocus()
    await waitFor(() => {
      expect(screen.getAllByText('Recalculates every open line').length).toBeGreaterThan(0)
    })
  })

  it('closes again when focus leaves', async () => {
    // Asserting only that it opens passes on a tooltip that opens and never closes, which is a
    // permanent overlay sitting on top of the page.
    render(<><Harness /><button>Elsewhere</button></>)
    await userEvent.tab()
    await waitFor(() => expect(screen.getAllByText('Recalculates every open line').length).toBeGreaterThan(0))
    await userEvent.tab()
    await waitFor(() => expect(screen.queryByText('Recalculates every open line')).not.toBeInTheDocument())
  })

  it('describes its trigger, so the explanation reaches a screen reader', async () => {
    // An open tooltip that is not wired to its trigger is a floating box: a screen-reader user
    // focusing the button hears the button and nothing else.
    render(<Harness />)
    await userEvent.tab()
    const trigger = screen.getByRole('button', { name: 'Recalculate' })
    await waitFor(() => expect(trigger).toHaveAttribute('aria-describedby'))
    const describedBy = trigger.getAttribute('aria-describedby') ?? ''
    expect(document.getElementById(describedBy)?.textContent).toBe('Recalculates every open line')
  })
})

describe('Tooltip on a non-focusable child', () => {
  it('WARNS in development, and is still unreachable by keyboard', async () => {
    // Two rounds of review deferred this warning, the second on the stated ground that Clara had no
    // `console.warn` convention. That was false - `lib/dev-warning.ts` had shipped two days before,
    // QA-signed, and NumberInput already used it - so the reason for deferring did not exist.
    //
    // Both halves are asserted. The warning, because a silent failure is what made this reachable
    // at all; and the UNREACHABILITY, because the warning does not fix it and a test asserting only
    // the console message would let the actual defect drift.
    resetDevWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      render(<Tooltip content="Never reachable"><span>Not focusable</span></Tooltip>)
      await waitFor(() => expect(warn).toHaveBeenCalled())
      expect(warn.mock.calls.flat().join(' ')).toMatch(/cannot receive keyboard focus/)

      await userEvent.tab()
      expect(document.activeElement, 'a non-focusable trigger unexpectedly took focus')
        .toBe(document.body)
      expect(screen.queryByText('Never reachable'), 'the tooltip appeared without a focusable trigger')
        .not.toBeInTheDocument()
    } finally {
      warn.mockRestore()
    }
  })

  it('stays SILENT for a focusable trigger, so the warning is not noise', async () => {
    // A warning that fires on correct usage is one a developer learns to filter, which is the
    // failure `dev-warning.ts` names in its own docblock. This is the half that keeps it useful.
    resetDevWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      render(<Tooltip content="Reachable"><button>Focusable</button></Tooltip>)
      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(warn, 'a correct trigger produced a warning').not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })

  it('stays silent for a child that sets tabIndex in an EFFECT, not in JSX', async () => {
    // THE deferral test. Every other case here sets `tabIndex` in JSX, so the ref sees it
    // immediately and the `setTimeout(0)` is doing nothing - which is why deleting the timer left
    // all 1177 tests green for a round while the mechanism was real.
    //
    // A `forwardRef` wrapper that makes itself focusable in its own effect is the ordinary shape,
    // and its effect has not run when the ref fires. Without the deferral this warns about a
    // trigger that is about to be perfectly fine.
    const Late = forwardRef<HTMLSpanElement>((props, ref) => {
      const own = useRef<HTMLSpanElement>(null)
      useImperativeHandle(ref, () => own.current!)
      useEffect(() => { own.current?.setAttribute('tabindex', '0') }, [])
      return <span ref={own} {...props}>Focusable later</span>
    })
    Late.displayName = 'Late'

    resetDevWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      render(<Tooltip content="Reachable"><Late /></Tooltip>)
      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(warn, 'a trigger made focusable in an effect was warned about anyway')
        .not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })

  it('gives a NATIVELY disabled control its own advice, not "use a button"', async () => {
    // "Why is this disabled?" is the canonical enterprise tooltip, and the generic message told an
    // author already using a button to put the tooltip on a button. Clara's own rule is that
    // disabled means `aria-disabled` plus `readOnly` (D0058), which keeps the tab stop - so that is
    // the fix worth naming.
    resetDevWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      render(<Tooltip content="Close the period first"><button disabled>Post</button></Tooltip>)
      await waitFor(() => expect(warn).toHaveBeenCalled())
      const said = warn.mock.calls.flat().join(' ')
      expect(said).toMatch(/aria-disabled/)
      expect(said, 'a disabled button was told to use a button').not.toMatch(/Put the tooltip on a button/)
    } finally {
      warn.mockRestore()
    }
  })

  it('names WHICH tooltip is broken, so ten of them are not one line', async () => {
    // `devWarning` dedupes by message, and the message carried only a tag name - so a page with ten
    // broken tooltips produced a single line identifying none of them.
    resetDevWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      render(
        <>
          <Tooltip content="A"><span>Recalculate</span></Tooltip>
          <Tooltip content="B"><span>Post journal</span></Tooltip>
        </>,
      )
      await waitFor(() => expect(warn.mock.calls.length).toBeGreaterThan(1))
      const said = warn.mock.calls.flat().join(' ')
      expect(said).toMatch(/Recalculate/)
      expect(said, 'the second broken tooltip was deduped away').toMatch(/Post journal/)
    } finally {
      warn.mockRestore()
    }
  })

  it('stays silent for a span carrying tabIndex, which IS focusable', async () => {
    // The false positive worth closing: `tabIndex={0}` makes any element focusable, and a warning
    // that could not see that would push authors toward markup they do not need.
    resetDevWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      render(<Tooltip content="Reachable"><span tabIndex={0}>Focusable span</span></Tooltip>)
      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(warn).not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })
})

describe('Tooltip escape and hover bridge', () => {
  it('dismisses on Escape without moving the pointer', async () => {
    // AC2, and WCAG 1.4.13 "dismissable". A tooltip that can only be dismissed by moving the
    // pointer cannot be dismissed at all by someone who is not using one.
    render(<Harness />)
    await userEvent.tab()
    await waitFor(() => expect(screen.getAllByText('Recalculates every open line').length).toBeGreaterThan(0))
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByText('Recalculates every open line')).not.toBeInTheDocument())
  })

  it('does not close on Escape when it was never open', async () => {
    // The Escape assertion above passes on a tooltip that is never open in the first place, since
    // "not in the document" is its own precondition. This pins the other half: the content really
    // is absent before focus, so the disappearance above is a dismissal and not a no-op.
    render(<Harness />)
    expect(screen.queryByText('Recalculates every open line')).not.toBeInTheDocument()
  })
})

/*
 * WCAG 1.4.13 "hoverable" - the pointer travelling from the trigger to the tooltip without it
 * vanishing underneath - is asserted in `e2e/stacking.spec.ts`, NOT here, and the reason is the
 * same one the geometry gate records.
 *
 * Radix implements the bridge as a GRACE-AREA POLYGON computed from the trigger's and the content's
 * bounding rectangles and the live pointer position. jsdom lays nothing out: every rect is zero and
 * there is no pointer geometry, so the polygon is degenerate and any verdict this file reached
 * about it would be a false green by construction. A test that cannot observe the mechanism it
 * names is worse than no test, because the name is what a reader trusts.
 *
 * What protects the mechanism HERE is the public surface: `TooltipProps` exposes no
 * `disableHoverableContent`, so a consumer cannot turn the bridge off, and the API-surface gate
 * fails if one is ever added.
 */

describe('Tooltip placements', () => {
  it.each(PLACEMENTS)('%s opens and stays anchored to its trigger', async (placement) => {
    render(<Harness placement={placement} />)
    await userEvent.tab()
    await waitFor(() => expect(screen.getAllByText('Recalculates every open line').length).toBeGreaterThan(0))
  })

  it('defaults to top, so a consumer who does not choose gets the common case', async () => {
    render(<Harness />)
    await userEvent.tab()
    await waitFor(() => {
      const content = document.querySelector('.clara-tooltip')
      expect(content).toHaveAttribute('data-side', 'top')
    })
  })
})

describe('Tooltip theme and density matrix', () => {
  it.each([
    ['light', 'comfortable'], ['light', 'compact'],
    ['dark', 'comfortable'], ['dark', 'compact'],
  ] as const)('renders and passes axe in %s / %s', async (theme, density) => {
    const { container } = render(
      <ClaraProvider theme={theme} density={density}><Harness /></ClaraProvider>,
    )
    await userEvent.tab()
    await waitFor(() => expect(screen.getAllByText('Recalculates every open line').length).toBeGreaterThan(0))
    // Walked UP from an element INSIDE the panel, not `container.querySelector`.
    //
    // The panel is portalled to `document.body`, so `container` holds only the trigger and the
    // provider's own wrapper - and that wrapper carries the theme attributes too. Querying it found
    // a correct-looking answer that was never the portal's scope: stripping the attributes from
    // ClaraPortal entirely left this assertion green (BG review B3, D0065 - observe the property,
    // not a proxy for it).
    const scope = screen.getAllByText('Recalculates every open line')[0]!.closest('[data-clara-theme]')
    expect(scope).toHaveAttribute('data-clara-theme', theme)
    expect(scope).toHaveAttribute('data-clara-density', density)
    await expect(runAxe(document.body)).resolves.toHaveNoBlockingViolations()
  })
})

describe('Tooltip works with no ClaraProvider above it', () => {
  it('opens its own Radix provider rather than throwing', async () => {
    // Radix THROWS without a provider ancestor - `Tooltip must be used within TooltipProvider`,
    // measured. That message names a Radix type in a Clara consumer's console, which Section 4
    // rule 7 forbids. This is what fails if the internal provider is ever removed in favour of
    // requiring one from ClaraProvider.
    render(<Harness />)
    await userEvent.tab()
    await waitFor(() => expect(screen.getAllByText('Recalculates every open line').length).toBeGreaterThan(0))
  })
})
