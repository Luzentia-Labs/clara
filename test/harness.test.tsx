import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { runAxe } from './axe.js'

/**
 * Proves the harness itself: jsdom renders, RTL queries, and the axe matcher can BOTH pass and
 * fail. An accessibility assertion that cannot fail is worse than none, because it is credited as
 * coverage - so the negative case is asserted here rather than assumed.
 */
describe('test harness', () => {
  it('renders a React element under jsdom and queries it through RTL', () => {
    render(<button type="button">Save</button>)
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('passes axe on accessible markup', async () => {
    const { container } = render(
      <label>
        Account
        <input type="text" />
      </label>,
    )
    expect(await runAxe(container)).toHaveNoBlockingViolations()
  })

  it('FAILS axe on markup with a known serious violation', async () => {
    // An input with no accessible name: axe reports this as `serious`.
    const { container } = render(<input type="text" />)
    const result = await runAxe(container)
    expect(result.violations.length).toBeGreaterThan(0)
    expect(() => expect(result).toHaveNoBlockingViolations()).toThrow(
      /blocking accessibility violation/,
    )
  })
})
