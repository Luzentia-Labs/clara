import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Heading } from '../Heading/Heading'
import { Text } from '../Text/Text'

describe('heading level and size are independent', () => {
  // The point of the separation: a level 3 heading can look large without becoming an h1, so the
  // document outline survives a designer wanting emphasis.
  it.each([1, 2, 3, 4, 5, 6] as const)('renders level %i as its own element regardless of size', (level) => {
    render(<Heading level={level} size="sm">t</Heading>)
    expect(screen.getByRole('heading', { level })).toBeInTheDocument()
  })

  it('keeps the level when the size changes', () => {
    const { container, rerender } = render(<Heading level={3} size="sm">t</Heading>)
    expect(container.querySelector('h3')?.className).toContain('clara-heading--sm')
    rerender(<Heading level={3} size="lg">t</Heading>)
    expect(container.querySelector('h3')?.className).toContain('clara-heading--lg')
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
  })

  it('falls back to the size natural to the level when none is given', () => {
    const { container } = render(<Heading level={6}>t</Heading>)
    expect(container.querySelector('h6')?.className).toContain('clara-heading--sm')
  })

  // A document outline is a sequence, so this asserts the sequence rather than one element.
  it('preserves outline order across a realistic page', () => {
    render(<><Heading level={1}>a</Heading><Heading level={2} size="sm">b</Heading><Heading level={3} size="lg">c</Heading></>)
    const levels = screen.getAllByRole('heading').map((h) => Number(h.tagName[1]))
    expect(levels).toEqual([1, 2, 3])
  })
})

describe('numeric cells use tabular numerals', () => {
  it('marks numeric text so digits share an advance width', () => {
    render(<Text numeric>1,234.50</Text>)
    expect(screen.getByText('1,234.50').className).toContain('clara-text--numeric')
  })

  it('does not apply tabular numerals to ordinary prose', () => {
    render(<Text>ordinary</Text>)
    expect(screen.getByText('ordinary').className).not.toContain('clara-text--numeric')
  })
})

describe('truncated value recoverable by keyboard', () => {
  // `title` appears on hover only, and a non-focusable element cannot be reached without a pointer.
  // Truncating therefore makes the element focusable and names it with the full value.
  it('is reachable by Tab and carries the full value as its accessible name', async () => {
    render(<Text truncate fullValue="Acme Manufacturing International Holdings">Acme Manufa…</Text>)
    await userEvent.tab()
    const el = screen.getByLabelText('Acme Manufacturing International Holdings')
    expect(el).toHaveFocus()
  })

  it('does not make untruncated text focusable, which would add noise to the tab order', async () => {
    render(<Text>short</Text>)
    await userEvent.tab()
    expect(screen.getByText('short')).not.toHaveFocus()
  })

  it('exposes the full value, not the truncated rendering', () => {
    render(<Text truncate fullValue="the whole thing">the who…</Text>)
    const el = screen.getByLabelText('the whole thing')
    expect(el.textContent).toBe('the who…')
    expect(el).toHaveAttribute('title', 'the whole thing')
  })
})
