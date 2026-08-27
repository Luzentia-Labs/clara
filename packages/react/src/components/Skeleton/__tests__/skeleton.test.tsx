import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { runAxe } from '../../../../../../test/axe'
import { ClaraProvider } from '../../../theme/ClaraProvider'
import { Skeleton, SkeletonGroup } from '../Skeleton'

describe('Skeleton container announces once', () => {
  it('announces the loading state once, however many placeholders there are', () => {
    render(
      <SkeletonGroup label="Loading invoices">
        {Array.from({ length: 40 }, (_, i) => <Skeleton key={i} />)}
      </SkeletonGroup>,
    )
    // The user story verbatim: "a loading list announces once rather than forty times."
    const statuses = screen.getAllByRole('status')
    expect(statuses).toHaveLength(1)
    expect(statuses[0]).toHaveTextContent('Loading invoices')
    // The region must actually ANNOUNCE, not merely carry the role.
    //
    // `role="status"` implies `aria-live="polite"`, and an explicit `aria-live="off"` beside it
    // overrides that and makes the group permanently silent in every screen reader. A review added
    // exactly that and measured 1200 unit tests, check:axe at 212 passed and check:verification all
    // green: the criterion says "announces once" and could not fail on a component that announces
    // zero times. Presence of the role was standing in for the announcement (D0065).
    //
    // ZERO is a failure here, not just forty. This is the assertion for the zero direction.
    expect(statuses[0]).not.toHaveAttribute('aria-live', 'off')
    expect(statuses[0]).not.toHaveAttribute('aria-hidden', 'true')
  })

  it('hides every placeholder from the accessibility tree', () => {
    const { container } = render(
      <SkeletonGroup label="Loading invoices">
        <Skeleton /><Skeleton width="half" /><Skeleton width="quarter" />
      </SkeletonGroup>,
    )
    const blocks = [...container.querySelectorAll('.clara-skeleton')]
    expect(blocks).toHaveLength(3)
    for (const block of blocks) expect(block).toHaveAttribute('aria-hidden', 'true')
  })

  it('gives a placeholder no way to become announceable', () => {
    // There is no `label` on Skeleton and no aria override: forty announcements is the defect this
    // component exists to prevent, so the API does not offer the shape that would cause it.
    const { container } = render(<Skeleton />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('[role]')).toBeNull()
  })

  it('maps width to a token class rather than an inline style', () => {
    const { container } = render(<Skeleton width="three-quarters" />)
    const block = container.firstElementChild as HTMLElement
    expect(block.className).toContain('clara-skeleton--three-quarters')
    expect(block.getAttribute('style')).toBeNull()
  })

  it('renders on the server', () => {
    const html = renderToStaticMarkup(
      <SkeletonGroup label="Loading invoices"><Skeleton /></SkeletonGroup>,
    )
    expect(html).toContain('Loading invoices')
    expect(html).toContain('clara-skeleton')
  })

  it('passes axe with forty placeholders', async () => {
    const { container } = render(
      <SkeletonGroup label="Loading invoices">
        {Array.from({ length: 40 }, (_, i) => <Skeleton key={i} />)}
      </SkeletonGroup>,
    )
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
  })
})

/** Declared under its own literal name - see the note in Badge's suite for why not `describe.each`. */
describe('Skeleton theme and density matrix', () => {
  it.each([
    ['light', 'comfortable'], ['light', 'compact'],
    ['dark', 'comfortable'], ['dark', 'compact'],
  ] as const)('renders and passes axe in %s / %s', async (theme, density) => {
    const { container } = render(
      <ClaraProvider theme={theme} density={density}>
        <SkeletonGroup label="Loading invoices"><Skeleton /><Skeleton width="half" /></SkeletonGroup>
      </ClaraProvider>,
    )
    const scope = container.querySelector('[data-clara-theme]')
    expect(scope).toHaveAttribute('data-clara-theme', theme)
    expect(scope).toHaveAttribute('data-clara-density', density)
    expect(scope?.querySelector('.clara-skeleton')).toBeTruthy()
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
  })
})
