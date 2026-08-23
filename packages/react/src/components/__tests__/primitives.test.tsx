import { describe, it, expect, vi } from 'vitest'
import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { runAxe } from '../../../../../test/axe'
import { Box } from '../Box/Box'
import { Stack } from '../Stack/Stack'
import { Inline } from '../Inline/Inline'
import { Grid } from '../Grid/Grid'
import { Divider } from '../Divider/Divider'
import { Button } from '../Button/Button'
import { IconButton } from '../IconButton/IconButton'
import { ButtonGroup } from '../ButtonGroup/ButtonGroup'
import { Link } from '../Link/Link'

describe('as prop infers target element props', () => {
  // The type-level half is asserted at COMPILE time in lib/polymorphic.type-test.tsx, where an
  // invalid combination must be rejected. This is the runtime half: `as` really changes the tag.
  it.each([
    ['Box', Box, 'section'],
    ['Stack', Stack, 'ul'],
    ['Inline', Inline, 'nav'],
    ['Grid', Grid, 'main'],
  ] as const)('%s renders the element `as` names', (_n, C, tag) => {
    const { container } = render(<C as={tag}>x</C>)
    expect(container.firstElementChild?.tagName.toLowerCase()).toBe(tag)
  })

  it('passes the target element its own attributes', () => {
    render(<Box as="a" href="/somewhere">link</Box>)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/somewhere')
  })

  it('defaults to its natural element when `as` is omitted', () => {
    const { container } = render(<Box>x</Box>)
    expect(container.firstElementChild?.tagName.toLowerCase()).toBe('div')
  })

  it('keeps the consumer className alongside its own', () => {
    const { container } = render(<Box className="mine" padding="md">x</Box>)
    expect(container.firstElementChild?.className).toContain('mine')
    expect(container.firstElementChild?.className).toContain('clara-box--md')
  })
})

describe('polymorphic ref forwarding', () => {
  it.each([
    ['Box', Box], ['Stack', Stack], ['Inline', Inline], ['Grid', Grid],
  ] as const)('%s forwards a ref to the rendered element', (_n, C) => {
    const ref = createRef<HTMLDivElement>()
    render(<C ref={ref}>x</C>)
    expect(ref.current).toBeInstanceOf(HTMLElement)
  })

  it('forwards a ref to the element `as` names, not a wrapper', () => {
    const ref = createRef<HTMLAnchorElement>()
    render(<Box as="a" href="/x" ref={ref}>x</Box>)
    expect(ref.current?.tagName.toLowerCase()).toBe('a')
  })

  it.each([['Divider', Divider], ['Link', Link]] as const)('%s forwards a ref too', (name, C) => {
    const ref = createRef<HTMLElement>()
    render(name === 'Link' ? <Link href="/x" ref={ref as never}>x</Link> : <Divider ref={ref as never} />)
    expect(ref.current).toBeInstanceOf(HTMLElement)
  })
})

describe('Button', () => {
  it('activates by click, Enter and Space', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>go</Button>)
    const button = screen.getByRole('button')
    await userEvent.click(button)
    button.focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(3)
  })

  // D0028: a disabled control keeps its place in the tab order, so the explanation attached to it
  // stays reachable. The native `disabled` attribute would remove it entirely.
  it('stays focusable when disabled, and says it is disabled', async () => {
    render(<Button disabled>go</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).not.toHaveAttribute('disabled')
    await userEvent.tab()
    expect(button).toHaveFocus()
  })

  it('does not activate while disabled', async () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>go</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('renders a real button by default, so keyboard activation is free', () => {
    render(<Button>go</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('drops the button type when rendered as something else', () => {
    render(<Button as="a" href="/x">go</Button>)
    expect(screen.getByRole('link')).not.toHaveAttribute('type')
  })
})

describe('IconButton', () => {
  // An icon-only button with no accessible name is invisible to a screen reader, and `label` is a
  // required prop so the omission is a compile error rather than an audit finding.
  it('takes its accessible name from label', () => {
    render(<IconButton label="Delete row" icon={<svg />} />)
    expect(screen.getByRole('button', { name: 'Delete row' })).toBeInTheDocument()
  })

  it('hides the icon from assistive technology, so the control is not announced twice', () => {
    const { container } = render(<IconButton label="Delete row" icon={<svg data-testid="i" />} />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })
})

describe('ButtonGroup', () => {
  it('is a labelled group, so its buttons read as one decision', () => {
    render(<ButtonGroup label="Record actions"><Button>Save</Button><Button>Cancel</Button></ButtonGroup>)
    const group = screen.getByRole('group', { name: 'Record actions' })
    expect(group).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  // Deliberately not role="toolbar": that implies arrow-key navigation and removes the buttons
  // from the tab order, which is right for an icon bar and wrong for a form footer.
  it('keeps every button in the tab order', async () => {
    render(<ButtonGroup label="Actions"><Button>A</Button><Button>B</Button></ButtonGroup>)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'A' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'B' })).toHaveFocus()
  })
})

describe('Link', () => {
  it('renders an anchor with its href', () => {
    render(<Link href="/records">Records</Link>)
    expect(screen.getByRole('link', { name: /Records/ })).toHaveAttribute('href', '/records')
  })

  // WCAG 3.2.5: a link that opens a new tab without saying so takes control from the user.
  it('announces that an external link opens a new tab', () => {
    render(<Link href="https://x.test" external>Docs</Link>)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(link.textContent).toContain('opens in a new tab')
  })
})

describe('Divider', () => {
  it('is a separator by default', () => {
    render(<Divider />)
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'horizontal')
  })

  it('is hidden when decorative, rather than announcing a meaningless separator', () => {
    const { container } = render(<Divider decorative />)
    expect(screen.queryByRole('separator')).toBeNull()
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })
})

describe('accessibility: axe on every primitive', () => {
  it.each([
    ['Box', <Box padding="md">content</Box>],
    ['Stack', <Stack><span>a</span><span>b</span></Stack>],
    ['Inline', <Inline><span>a</span></Inline>],
    ['Grid', <Grid columns={2}><span>a</span></Grid>],
    ['Divider', <Divider />],
    ['Button', <Button>Save</Button>],
    ['Button disabled', <Button disabled>Save</Button>],
    ['IconButton', <IconButton label="Delete" icon={<svg />} />],
    ['ButtonGroup', <ButtonGroup label="Actions"><Button>A</Button></ButtonGroup>],
    ['Link', <Link href="/x">Records</Link>],
    ['Link external', <Link href="https://x.test" external>Docs</Link>],
  ])('%s has no blocking violations', async (_name, element) => {
    const { container } = render(element)
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
  })
})
