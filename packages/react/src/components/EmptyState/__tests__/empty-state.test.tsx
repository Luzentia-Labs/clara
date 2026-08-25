import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { runAxe } from '../../../../../../test/axe'
import { ClaraProvider } from '../../../theme/ClaraProvider'
import { Button } from '../../Button/Button'
import { EmptyState } from '../EmptyState'

describe('EmptyState distinguishes empty from filtered', () => {
  it('marks which kind of nothing it is, in the DOM rather than only in the copy', () => {
    // An author can write "Nothing found" for both cases. The distinction has to survive that,
    // because a test - and a consumer's own styling - can only read the markup.
    const { container: empty } = render(<EmptyState reason="empty" title="No invoices yet" />)
    const { container: filtered } = render(
      <EmptyState reason="filtered" title="No invoices yet" action={<Button>Clear filters</Button>} />,
    )
    expect(empty.firstElementChild).toHaveAttribute('data-reason', 'empty')
    expect(filtered.firstElementChild).toHaveAttribute('data-reason', 'filtered')
    expect(empty.firstElementChild?.className).toContain('clara-empty-state--empty')
    expect(filtered.firstElementChild?.className).toContain('clara-empty-state--filtered')
  })

  it('gives each case different default guidance, pointing at a different way forward', () => {
    render(<EmptyState reason="empty" title="No invoices yet" />)
    render(<EmptyState reason="filtered" title="No matches" action={<Button>Clear filters</Button>} />)
    // "Add one" versus "change your filter" is the entire user story: Grace needs to know whether
    // to create a record or clear a filter, and these must not read the same.
    expect(screen.getByText('Nothing has been added here yet.')).toBeInTheDocument()
    expect(screen.getByText('No results match the current filters.')).toBeInTheDocument()
  })

  it('lets the author replace the guidance without losing the distinction', () => {
    const { container } = render(
      <EmptyState reason="filtered" title="No matches" action={<Button>Clear</Button>}>
        Try widening the date range.
      </EmptyState>,
    )
    expect(screen.getByText('Try widening the date range.')).toBeInTheDocument()
    expect(container.firstElementChild).toHaveAttribute('data-reason', 'filtered')
  })

  it('announces politely, because an empty list is already what the user is looking at', () => {
    render(<EmptyState reason="empty" title="No invoices yet" />)
    // `status`, not `alert`. Interrupting a screen reader to announce the obvious is shouting.
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders the action when one is given, and nothing when there is none', () => {
    const { container: withAction } = render(
      <EmptyState reason="filtered" title="No matches" action={<Button>Clear filters</Button>} />,
    )
    const { container: without } = render(<EmptyState reason="empty" title="No invoices yet" />)
    expect(withAction.querySelector('.clara-empty-state__action')).toBeTruthy()
    expect(without.querySelector('.clara-empty-state__action')).toBeNull()
  })

  it('renders on the server, so a list screen can be a Server Component', () => {
    const html = renderToStaticMarkup(<EmptyState reason="empty" title="No invoices yet" />)
    expect(html).toContain('data-reason="empty"')
    expect(html).toContain('No invoices yet')
  })

  it('passes axe in both cases', async () => {
    const { container } = render(
      <>
        <EmptyState reason="empty" title="No invoices yet" />
        <EmptyState reason="filtered" title="No matches" action={<Button>Clear filters</Button>} />
      </>,
    )
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
  })
})

/** Declared under its own literal name - see the note in Badge's suite for why not `describe.each`. */
describe('EmptyState theme and density matrix', () => {
  it.each([
    ['light', 'comfortable'], ['light', 'compact'],
    ['dark', 'comfortable'], ['dark', 'compact'],
  ] as const)('renders and passes axe in %s / %s', async (theme, density) => {
    const { container } = render(
      <ClaraProvider theme={theme} density={density}>
        <EmptyState reason="filtered" title="No matches" action={<Button>Clear filters</Button>} />
      </ClaraProvider>,
    )
    const scope = container.querySelector('[data-clara-theme]')
    expect(scope).toHaveAttribute('data-clara-theme', theme)
    expect(scope).toHaveAttribute('data-clara-density', density)
    expect(scope?.querySelector('.clara-empty-state')).toBeTruthy()
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
  })
})
