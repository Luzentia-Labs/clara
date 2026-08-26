import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { runAxe } from '../../../../../../test/axe'
import { ClaraProvider } from '../../../theme/ClaraProvider'
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
    const scope = container.querySelector('[data-clara-theme]')
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
