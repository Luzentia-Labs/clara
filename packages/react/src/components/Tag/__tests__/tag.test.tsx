import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { runAxe } from '../../../../../../test/axe'
import { ClaraProvider } from '../../../theme/ClaraProvider'
import { Tag } from '../Tag'

describe('Tag intent is not colour alone', () => {
  it.each([
    ['info', 'Information'],
    ['success', 'Success'],
    ['warning', 'Warning'],
    ['danger', 'Error'],
  ] as const)('%s announces its intent as a word', (intent, word) => {
    const { container } = render(<Tag intent={intent}>Overdue</Tag>)
    expect(container.firstElementChild).toHaveTextContent(`${word}: Overdue`)
  })

  it('says nothing extra for the neutral default', () => {
    const { container } = render(<Tag>Draft</Tag>)
    expect(container.firstElementChild?.textContent?.trim()).toBe('Draft')
  })

  /*
   * The PROP reaching its own CLASS - the link AC6 does not cover, and cannot.
   *
   * AC6 proves a class resolves to its intent's tokens, in a browser. It composes its markup BY HAND
   * (`e2e/stacking.spec.ts`), so it never renders this component and never sees the prop. Hardcoding
   * the modifier makes every danger, warning and success tag render INFO colours, and a review
   * measured that surviving 1200 unit tests, `pnpm typecheck`, `pnpm test:e2e` at 34 passed, and all
   * 30 guards including 147 prover mutations.
   *
   * Badge carried a version of this assertion from the start and the other two did not, which is
   * exactly how the gap survived: the test already existed in this repository and was not copied.
   *
   * `neutral` is in the loop, and it is the case that was missed everywhere. It is the DEFAULT and
   * the most-used path, and its colour comes from the base rule rather than a modifier - so a loop
   * over the four non-neutral intents leaves it bound to nothing. Repointing the base rule at the
   * danger tokens makes every default tag render as an error, and that survived everything too.
   */
  const ALL_INTENTS = ['neutral', 'info', 'success', 'warning', 'danger'] as const

  it.each(ALL_INTENTS)('%s reaches its own class, so the colour is a token and not a style', (intent) => {
    const { container } = render(<Tag intent={intent}>Overdue</Tag>)
    const el = container.firstElementChild as HTMLElement
    expect(el.className).toContain(`clara-tag--${intent}`)
    // Every OTHER intent's modifier must be absent, or a component emitting all five would pass.
    for (const other of ALL_INTENTS.filter((i) => i !== intent)) {
      expect(el.className).not.toContain(`clara-tag--${other}`)
    }
    // A token, not an inline style: an inline colour cannot be re-resolved per theme.
    expect(el.getAttribute('style')).toBeNull()
  })
})

describe('Tag remove control names its value', () => {
  it('names the value it removes, not just "Remove"', () => {
    // Eight tags in a filter bar means eight buttons. "Remove" x8 forces a screen-reader user to
    // leave the control to find out which one they are on.
    render(
      <>
        <Tag onRemove={() => {}}>Overdue</Tag>
        <Tag onRemove={() => {}}>Unpaid</Tag>
      </>,
    )
    expect(screen.getByRole('button', { name: 'Remove Overdue' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove Unpaid' })).toBeInTheDocument()
  })

  it('is reachable and operable from the keyboard', async () => {
    const onRemove = vi.fn()
    const user = userEvent.setup()
    render(<Tag onRemove={onRemove}>Overdue</Tag>)

    await user.tab()
    expect(screen.getByRole('button', { name: 'Remove Overdue' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('lets removeLabel override the name, for another word or another language', () => {
    render(<Tag onRemove={() => {}} removeLabel="Filter entfernen: Überfällig">Overdue</Tag>)
    expect(screen.getByRole('button', { name: 'Filter entfernen: Überfällig' })).toBeInTheDocument()
  })

  it('renders no control at all when it is not removable', () => {
    // Not a disabled button, not a hidden one: a non-removable tag must not add a tab stop to
    // every row of a list screen.
    render(<Tag>Draft</Tag>)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('hides the glyph from the accessibility tree, since the button already has a name', () => {
    render(<Tag onRemove={() => {}}>Overdue</Tag>)
    const button = screen.getByRole('button', { name: 'Remove Overdue' })
    expect(button.querySelector('[aria-hidden="true"]')).toBeTruthy()
  })

  it('passes axe removable and static', async () => {
    const { container } = render(
      <>
        <Tag intent="danger" onRemove={() => {}}>Overdue</Tag>
        <Tag intent="success">Paid</Tag>
      </>,
    )
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
  })
})

/** Declared under its own literal name - see the note in Badge's suite for why not `describe.each`. */
describe('Tag theme and density matrix', () => {
  it.each([
    ['light', 'comfortable'], ['light', 'compact'],
    ['dark', 'comfortable'], ['dark', 'compact'],
  ] as const)('renders and passes axe in %s / %s', async (theme, density) => {
    const { container } = render(
      <ClaraProvider theme={theme} density={density}>
        <Tag intent="warning" onRemove={() => {}}>Pending</Tag>
      </ClaraProvider>,
    )
    const scope = container.querySelector('[data-clara-theme]')
    expect(scope).toHaveAttribute('data-clara-theme', theme)
    expect(scope).toHaveAttribute('data-clara-density', density)
    expect(scope?.querySelector('.clara-tag')).toBeTruthy()
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
  })
})
