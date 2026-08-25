import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { runAxe } from '../../../../../../test/axe'
import { ClaraProvider } from '../../../theme/ClaraProvider'
import { Spinner } from '../Spinner'

describe('Spinner has accessible label', () => {
  it('announces what is loading, not merely that something is', () => {
    // "Loading" is the word Clara could have defaulted, and it is exactly the word that carries no
    // information on a screen with four regions loading at once.
    render(<Spinner label="Loading invoices" />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading invoices')
  })

  it('hides the ring from the accessibility tree, so the label is announced once', () => {
    const { container } = render(<Spinner label="Loading invoices" />)
    expect(container.querySelector('.clara-spinner__ring')).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders the SAME ring class Button renders, so the two cannot drift', () => {
    // D0100 requires one implementation shared with Button rather than a second that drifts.
    // Asserted structurally: if either stops using this class, this test fails.
    expect(renderToStaticMarkup(<Spinner label="Loading" />)).toContain('clara-spinner__ring')
  })

  it('renders on the server', () => {
    const html = renderToStaticMarkup(<Spinner label="Loading invoices" />)
    expect(html).toContain('Loading invoices')
  })

  it('passes axe', async () => {
    const { container } = render(<Spinner label="Loading invoices" />)
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
  })
})

/** Declared under its own literal name - see the note in Badge's suite for why not `describe.each`. */
describe('Spinner theme and density matrix', () => {
  it.each([
    ['light', 'comfortable'], ['light', 'compact'],
    ['dark', 'comfortable'], ['dark', 'compact'],
  ] as const)('renders and passes axe in %s / %s', async (theme, density) => {
    const { container } = render(
      <ClaraProvider theme={theme} density={density}><Spinner label="Loading invoices" /></ClaraProvider>,
    )
    const scope = container.querySelector('[data-clara-theme]')
    expect(scope).toHaveAttribute('data-clara-theme', theme)
    expect(scope).toHaveAttribute('data-clara-density', density)
    expect(scope?.querySelector('.clara-spinner')).toBeTruthy()
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
  })
})
