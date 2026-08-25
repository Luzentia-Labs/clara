import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { runAxe } from '../../../../../../test/axe'
import { ClaraProvider } from '../../../theme/ClaraProvider'
import { Badge } from '../Badge'

describe('Badge intent is not colour alone', () => {
  // WCAG 1.4.1. The component's guarantee is that the intent reaches the ACCESSIBLE NAME; it
  // cannot guarantee the visible text distinguishes two badges, and the docs say so.
  it.each([
    ['info', 'Information'],
    ['success', 'Success'],
    ['warning', 'Warning'],
    ['danger', 'Error'],
  ] as const)('%s announces its intent as a word', (intent, word) => {
    render(<Badge intent={intent}>Open</Badge>)
    expect(screen.getByText('Open').closest('.clara-badge')).toHaveTextContent(`${word}: Open`)
  })

  it('says nothing extra for the neutral default', () => {
    render(<Badge>Draft</Badge>)
    const badge = screen.getByText('Draft').closest('.clara-badge')
    // "Neutral: Draft" would add a word to every badge in the system that carries no information.
    expect(badge).toHaveTextContent('Draft')
    expect(badge?.textContent?.trim()).toBe('Draft')
  })

  it('carries the intent in a class as well, so the colour is driven by a token not a style', () => {
    const { container } = render(<Badge intent="danger">Overdue</Badge>)
    const badge = container.firstElementChild as HTMLElement
    expect(badge.className).toContain('clara-badge--danger')
    expect(badge.getAttribute('style')).toBeNull()
  })
})

describe('Badge count is announced with meaning', () => {
  it('announces what is being counted, not just the number', () => {
    const { container } = render(<Badge intent="danger" count={3} countLabel="overdue invoices" />)
    const badge = container.firstElementChild as HTMLElement
    // A sighted user sees "3"; a screen reader hears the intent and what the 3 counts.
    expect(badge).toHaveTextContent('Error: 3 overdue invoices')
    expect(screen.getByText('3')).toHaveClass('clara-badge__count')
  })

  it('renders zero rather than treating it as absent', () => {
    // `count={0}` is a real state - "0 errors" - and a falsy check would drop it.
    const { container } = render(<Badge count={0} countLabel="errors" />)
    expect(container.firstElementChild).toHaveTextContent('0 errors')
  })

  it('keeps digits on a tabular figure so a column of counts lines up', () => {
    render(<Badge count={11} countLabel="items" />)
    expect(screen.getByText('11')).toHaveClass('clara-badge__count')
  })

  it('passes axe with a count and with a label', async () => {
    const { container } = render(
      <>
        <Badge intent="warning">Pending review</Badge>
        <Badge intent="danger" count={3} countLabel="overdue invoices" />
      </>,
    )
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
  })
})

describe('Badge renders on the server', () => {
  it('produces markup with no directive and no browser API', () => {
    // Classified server-capable in client-boundary.json: no function props, no state, no refs.
    const html = renderToStaticMarkup(<Badge intent="success">Paid</Badge>)
    expect(html).toContain('clara-badge--success')
    expect(html).toContain('Success: ')
  })
})

/**
 * Declared under its own literal name, not through `describe.each('%s ...')`.
 *
 * The shared sweep in `../../__tests__/matrix.test.tsx` builds its title from a template, so the
 * only name that exists statically there is the template itself - and `vitest -t` exits 0 when it
 * selects nothing, so a criterion pointed at "Badge theme and density matrix" would have passed
 * having run no test at all. `check-story-verifiers.mjs` caught exactly that. Badge stays in the
 * shared sweep as well; that one is the cross-component check, this one is what AC4 names.
 *
 * What this proves is bounded and the criterion now says so: the component renders inside the
 * right scope and axe finds nothing, in all four combinations. It is jsdom, so it sees no layout
 * and resolves no custom property. The appearance is gate 7's (US-01M0WSME).
 */
describe('Badge theme and density matrix', () => {
  it.each([
    ['light', 'comfortable'], ['light', 'compact'],
    ['dark', 'comfortable'], ['dark', 'compact'],
  ] as const)('renders and passes axe in %s / %s', async (theme, density) => {
    const { container } = render(
      <ClaraProvider theme={theme} density={density}>
        <Badge intent="danger" count={3} countLabel="overdue invoices" />
      </ClaraProvider>,
    )
    const scope = container.querySelector('[data-clara-theme]')
    expect(scope).toHaveAttribute('data-clara-theme', theme)
    expect(scope).toHaveAttribute('data-clara-density', density)
    expect(scope?.querySelector('.clara-badge')).toBeTruthy()
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
  })
})
