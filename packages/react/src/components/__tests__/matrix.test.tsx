import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { runAxe } from '../../../../../test/axe'
import { ClaraProvider } from '../../theme/ClaraProvider'
import { Box } from '../Box/Box'
import { Stack } from '../Stack/Stack'
import { Inline } from '../Inline/Inline'
import { Grid } from '../Grid/Grid'
import { Divider } from '../Divider/Divider'
import { Button } from '../Button/Button'
import { IconButton } from '../IconButton/IconButton'
import { ButtonGroup } from '../ButtonGroup/ButtonGroup'
import { Link } from '../Link/Link'

/**
 * Every primitive, in all four theme x density combinations.
 *
 * Theme and density are token overrides, so a component that hardcoded a value would look correct
 * in the combination it was built in and wrong in the other three. Rendering the matrix is what
 * turns "it uses tokens" from a claim into an observation.
 */
const CASES = [
  ['Box', <Box padding="md">content</Box>],
  ['Stack', <Stack gap="sm"><span>a</span><span>b</span></Stack>],
  ['Inline', <Inline gap="sm"><span>a</span></Inline>],
  ['Grid', <Grid columns={3}><span>a</span></Grid>],
  ['Divider', <Divider />],
  ['Button', <Button>Save</Button>],
  ['IconButton', <IconButton label="Delete" icon={<svg />} />],
  ['ButtonGroup', <ButtonGroup label="Actions"><Button>A</Button></ButtonGroup>],
  ['Link', <Link href="/x">Records</Link>],
] as const

const MATRIX = [
  ['light', 'comfortable'], ['light', 'compact'],
  ['dark', 'comfortable'], ['dark', 'compact'],
] as const

describe.each(CASES)('%s theme and density matrix', (name, element) => {
  it.each(MATRIX)(`renders and passes axe in %s / %s`, async (theme, density) => {
    const { container } = render(
      <ClaraProvider theme={theme} density={density}>{element}</ClaraProvider>,
    )
    const scope = container.querySelector('[data-clara-theme]')
    expect(scope).toHaveAttribute('data-clara-theme', theme)
    expect(scope).toHaveAttribute('data-clara-density', density)
    // The component rendered something inside the themed scope, rather than failing silently.
    expect(scope?.firstElementChild).toBeTruthy()
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
  })

  it('uses only token-driven classes, never an inline style', () => {
    const { container } = render(element)
    const el = container.firstElementChild as HTMLElement
    expect(el.getAttribute('style')).toBeNull()
    expect(el.className).toContain('clara-')
  })
})

describe('Box spacing props are token-constrained', () => {
  // A closed set rather than a number: a raw value looks identical and stops responding to density.
  it.each(['none', 'sm', 'md', 'lg'] as const)('padding=%s maps to a token class', (padding) => {
    const { container } = render(<Box padding={padding}>x</Box>)
    expect(container.firstElementChild?.className).toContain(`clara-box--${padding}`)
  })
})

describe('Stack gap is token-constrained', () => {
  it.each(['none', 'sm', 'md', 'lg'] as const)('gap=%s maps to a token class', (gap) => {
    const { container } = render(<Stack gap={gap}>x</Stack>)
    expect(container.firstElementChild?.className).toContain(`clara-vertical--gap-${gap}`)
  })
})

describe('Stack renders a single element', () => {
  it('does not add a wrapper around its children', () => {
    const { container } = render(<Stack><span>a</span><span>b</span></Stack>)
    expect(container.children).toHaveLength(1)
    expect(container.firstElementChild?.children).toHaveLength(2)
  })
})

describe('Inline wraps preserving gap', () => {
  it('wraps rather than overflowing, and keeps the gap on both axes', () => {
    const { container } = render(<Inline gap="md"><span>a</span></Inline>)
    expect(container.firstElementChild?.className).toContain('clara-horizontal')
    expect(container.firstElementChild?.className).toContain('clara-horizontal--gap-md')
  })
})

describe('Grid props are token-constrained', () => {
  it.each([1, 2, 3, 4, 6, 12] as const)('columns=%i maps to a token class', (columns) => {
    const { container } = render(<Grid columns={columns}>x</Grid>)
    expect(container.firstElementChild?.className).toContain(`clara-grid--cols-${columns}`)
  })
})

describe('Divider semantics', () => {
  it('is a separator with an orientation', () => {
    render(<Divider orientation="vertical" />)
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical')
  })
})

describe('Button variants and sizes', () => {
  it.each(['primary', 'secondary'] as const)('variant=%s', (variant) => {
    render(<Button variant={variant}>x</Button>)
    expect(screen.getByRole('button').className).toContain(`clara-button--${variant}`)
  })

  it.each(['sm', 'md'] as const)('size=%s', (size) => {
    render(<Button size={size}>x</Button>)
    expect(screen.getByRole('button').className).toContain(`clara-button--${size}`)
  })
})

describe('Button loading preserves width', () => {
  it('sets aria-busy and suppresses activation', async () => {
    const onClick = vi.fn()
    render(<Button loading onClick={onClick}>Save</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  // The label stays in the DOM, hidden, so the button keeps its width. Replacing it with a spinner
  // would collapse the button and move everything beside it mid-interaction.
  it('keeps the label in the DOM so the width does not change', () => {
    render(<Button loading>Save changes</Button>)
    const label = within(screen.getByRole('button')).getByText('Save changes')
    expect(label).toBeInTheDocument()
    expect(label.className).toContain('clara-button__label--hidden')
  })

  it('shows the label normally when not loading', () => {
    render(<Button>Save changes</Button>)
    expect(within(screen.getByRole('button')).getByText('Save changes').className)
      .not.toContain('--hidden')
  })
})

describe('disabled Button is focusable and announces', () => {
  it('keeps its tab stop so the reason attached to it stays reachable', async () => {
    render(<><Button disabled>Approve</Button><Button>After</Button></>)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Approve' })).toHaveFocus()
  })
})

describe('Button renders as anchor', () => {
  it('becomes a link when `as` says so, and keeps the href', () => {
    render(<Button as="a" href="/records">Go</Button>)
    expect(screen.getByRole('link', { name: 'Go' })).toHaveAttribute('href', '/records')
  })

  it('does not navigate when disabled', async () => {
    const onClick = vi.fn()
    render(<Button as="a" href="/records" disabled onClick={onClick}>Go</Button>)
    await userEvent.click(screen.getByRole('link'))
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('IconButton requires aria-label', () => {
  it('exposes the label as the accessible name', () => {
    render(<IconButton label="Delete row" icon={<svg />} />)
    expect(screen.getByRole('button', { name: 'Delete row' })).toBeInTheDocument()
  })
})

describe('IconButton target size in compact', () => {
  // PRD:164 - interactive targets stay at or above 24x24 REGARDLESS of density, and an icon-only
  // button is where that floor is under the most pressure.
  it('carries the minimum-target class at every density', () => {
    render(<ClaraProvider density="compact"><IconButton label="Delete" icon={<svg />} /></ClaraProvider>)
    expect(screen.getByRole('button').className).toContain('clara-button--icon-only')
  })
})

describe('ButtonGroup roving focus', () => {
  it('is a single tab stop, with arrow keys moving inside it', async () => {
    render(
      <><ButtonGroup label="Actions">
        <Button>A</Button><Button>B</Button><Button>C</Button>
      </ButtonGroup><Button>Outside</Button></>,
    )
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'A' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('button', { name: 'B' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('button', { name: 'C' })).toHaveFocus()
    // One tab stop: tabbing again leaves the group entirely.
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Outside' })).toHaveFocus()
  })

  it('wraps at the ends, so the last action is one key from the first', async () => {
    render(<ButtonGroup label="Actions"><Button>A</Button><Button>B</Button></ButtonGroup>)
    await userEvent.tab()
    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.getByRole('button', { name: 'B' })).toHaveFocus()
  })

  it('supports Home and End', async () => {
    render(<ButtonGroup label="Actions"><Button>A</Button><Button>B</Button><Button>C</Button></ButtonGroup>)
    await userEvent.tab()
    await userEvent.keyboard('{End}')
    expect(screen.getByRole('button', { name: 'C' })).toHaveFocus()
    await userEvent.keyboard('{Home}')
    expect(screen.getByRole('button', { name: 'A' })).toHaveFocus()
  })

  it('is announced as a labelled toolbar', () => {
    render(<ButtonGroup label="Record actions"><Button>A</Button></ButtonGroup>)
    expect(screen.getByRole('toolbar', { name: 'Record actions' })).toBeInTheDocument()
  })
})

describe('ButtonGroup merges adjacent borders', () => {
  it('lays the buttons out as one control rather than separate ones', () => {
    const { container } = render(<ButtonGroup label="A"><Button>A</Button><Button>B</Button></ButtonGroup>)
    expect(container.firstElementChild?.className).toContain('clara-button-group')
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })
})

describe('Link is distinguishable without colour', () => {
  // WCAG 1.4.1: colour alone cannot carry the distinction. Printed in black and white, or read by
  // someone with a colour vision deficiency, the underline is the only thing left.
  it('carries the link class that underlines it, not colour alone', () => {
    render(<Link href="/x">Records</Link>)
    expect(screen.getByRole('link').className).toContain('clara-link')
  })
})

describe('external Link is announced', () => {
  it('says it opens a new tab, rather than only behaving that way', () => {
    render(<Link href="https://x.test" external>Docs</Link>)
    expect(screen.getByRole('link').textContent).toContain('opens in a new tab')
  })
})
