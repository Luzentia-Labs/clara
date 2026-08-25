import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { runAxe } from '../../../../../../test/axe'
import { ClaraProvider } from '../../../theme/ClaraProvider'
import { ProgressBar } from '../ProgressBar'

describe('ProgressBar aria values', () => {
  it('reports now, min and max', () => {
    render(<ProgressBar label="Posting invoices" value={62} />)
    const bar = screen.getByRole('progressbar', { name: 'Posting invoices' })
    expect(bar).toHaveAttribute('aria-valuenow', '62')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('updates when the value does', () => {
    const { rerender } = render(<ProgressBar label="Posting invoices" value={10} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '10')
    rerender(<ProgressBar label="Posting invoices" value={90} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '90')
  })

  it('honours a max other than 100', () => {
    render(<ProgressBar label="Posting invoices" value={3} max={12} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '3')
    expect(bar).toHaveAttribute('aria-valuemax', '12')
  })

  it('clamps rather than overflowing its own track', () => {
    // A caller computing 105 of 100 should see a full bar, not one that runs past its container.
    const { container } = render(<ProgressBar label="Posting" value={105} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
    expect((container.querySelector('.clara-progress__fill') as HTMLElement).style.inlineSize).toBe('100%')
  })

  it('sets the fill width from the datum, which is the one thing a class cannot express', () => {
    const { container } = render(<ProgressBar label="Posting" value={25} />)
    expect((container.querySelector('.clara-progress__fill') as HTMLElement).style.inlineSize).toBe('25%')
  })

  it('renders on the server', () => {
    const html = renderToStaticMarkup(<ProgressBar label="Posting invoices" value={62} />)
    expect(html).toContain('aria-valuenow="62"')
  })
})

describe('ProgressBar indeterminate mode', () => {
  it('announces as a progressbar without claiming a percentage', () => {
    render(<ProgressBar label="Posting invoices" indeterminate />)
    const bar = screen.getByRole('progressbar', { name: 'Posting invoices' })
    // Omitting aria-valuenow IS what indeterminate means in ARIA. Reporting 0 would be a confident
    // claim that nothing has happened yet, which is a different and false statement.
    expect(bar).not.toHaveAttribute('aria-valuenow')
    expect(bar).not.toHaveAttribute('aria-valuemin')
    expect(bar).not.toHaveAttribute('aria-valuemax')
  })

  it('sets no inline width, so nothing reads as a parked percentage', () => {
    const { container } = render(<ProgressBar label="Posting" indeterminate />)
    const fill = container.querySelector('.clara-progress__fill') as HTMLElement
    expect(fill.getAttribute('style')).toBeNull()
  })

  it('carries a class the stylesheet can drive the traverse from', () => {
    const { container } = render(<ProgressBar label="Posting" indeterminate />)
    expect(container.firstElementChild?.className).toContain('clara-progress--indeterminate')
  })

  it('passes axe determinate and indeterminate', async () => {
    const { container } = render(
      <>
        <ProgressBar label="Posting invoices" value={62} />
        <ProgressBar label="Checking supplier" indeterminate />
      </>,
    )
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
  })
})

/** Declared under its own literal name - see the note in Badge's suite for why not `describe.each`. */
describe('ProgressBar theme and density matrix', () => {
  it.each([
    ['light', 'comfortable'], ['light', 'compact'],
    ['dark', 'comfortable'], ['dark', 'compact'],
  ] as const)('renders and passes axe in %s / %s', async (theme, density) => {
    const { container } = render(
      <ClaraProvider theme={theme} density={density}>
        <ProgressBar label="Posting invoices" value={62} />
      </ClaraProvider>,
    )
    const scope = container.querySelector('[data-clara-theme]')
    expect(scope).toHaveAttribute('data-clara-theme', theme)
    expect(scope).toHaveAttribute('data-clara-density', density)
    expect(scope?.querySelector('.clara-progress')).toBeTruthy()
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
  })
})
