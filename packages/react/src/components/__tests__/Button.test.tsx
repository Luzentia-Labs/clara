import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../Button/Button'
import { Box } from '../Box/Box'

/**
 * Behaviour, not markup shape. The first pass at these fixtures asserted class names and stable
 * output, which left 7 of 9 mutants alive - a suite that cannot tell a working component from a
 * broken one.
 */
describe('Button', () => {
  it('calls onClick when activated', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>go</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'go' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is operable without a handler', async () => {
    render(<Button>go</Button>)
    await expect(userEvent.click(screen.getByRole('button'))).resolves.not.toThrow()
  })

  it('marks itself pressed between pointer down and up, and not before', () => {
    render(<Button>go</Button>)
    const button = screen.getByRole('button')
    // fireEvent rather than userEvent: this asserts on state BETWEEN the two halves of a pointer
    // interaction, and userEvent's separate down/up calls do not reliably deliver the release to
    // the same element in jsdom. The events being dispatched are exactly the ones React binds.
    expect(button).not.toHaveAttribute('data-pressed')
    fireEvent.pointerDown(button)
    expect(button).toHaveAttribute('data-pressed', 'true')
    fireEvent.pointerUp(button)
    expect(button).not.toHaveAttribute('data-pressed')
  })

  // `exactOptionalPropertyTypes` forbids passing an explicit `undefined`, so the default case is
  // its own test rather than a row that fakes omission.
  it('defaults to the primary variant when none is given', () => {
    render(<Button>go</Button>)
    expect(screen.getByRole('button').className).toContain('clara-button--primary')
  })

  it.each(['primary', 'secondary'] as const)('renders the %s variant class', (variant) => {
    render(<Button variant={variant}>go</Button>)
    expect(screen.getByRole('button').className).toContain(`clara-button--${variant}`)
  })

  it('renders as a real button element, so keyboard activation is free', () => {
    render(<Button>go</Button>)
    expect(screen.getByRole('button').tagName).toBe('BUTTON')
  })
})

describe('Box', () => {
  it('defaults to no padding when none is given', () => {
    const { container } = render(<Box>x</Box>)
    expect(container.firstElementChild?.className).toBe('clara-box clara-box--none')
  })

  it.each(['none', 'sm', 'md', 'lg'] as const)('applies the %s padding class', (padding) => {
    const { container } = render(<Box padding={padding}>x</Box>)
    expect(container.firstElementChild?.className).toBe(`clara-box clara-box--${padding}`)
  })

  it('renders its children', () => {
    render(<Box>hello</Box>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })
})
