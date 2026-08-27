import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { runAxe } from '../../../../../../test/axe'
// @ts-expect-error - a plain .mjs helper with no declarations. Imported rather than
// reimplemented on purpose: this is the SAME function `check:contrast` measures with, so a
// local copy could agree with itself while disagreeing with the gate.
import { contrastRatio } from '../../../../../../scripts/lib/wcag.mjs'
import { ClaraProvider } from '../../../theme/ClaraProvider'
import { DangerIcon, InfoIcon, SuccessIcon, WarningIcon } from '@luzentialabs/clara-icons'
import { Alert } from '../Alert'

const INTENTS = ['info', 'success', 'warning', 'danger'] as const

describe('Alert intent is not colour alone', () => {
  it.each(INTENTS)('%s renders an icon, so the intent is visible without reading the hue', (intent) => {
    const { container } = render(<Alert intent={intent}>Three invoices could not be posted.</Alert>)
    // The icon is what carries the intent ON SCREEN. A visually-hidden word paints nothing, so it
    // cannot satisfy this criterion on its own.
    expect(container.querySelector('.clara-alert__icon')).toBeTruthy()
  })

  /*
   * WHICH icon, not merely that there is one.
   *
   * The assertion above reads presence, and presence is a proxy for identity (D0065). A review
   * swapped `danger`'s entry from `DangerIcon` to `InfoIcon` and measured 1200 unit tests,
   * `pnpm test:e2e` at 34 passed and every guard green - so a danger alert displayed an "i" while
   * the criterion that exists to make the intent VISIBLE reported success.
   *
   * The glyphs are genuinely different: DangerIcon draws `M9 9l6 6M15 9l-6 6`, an "x"; InfoIcon
   * draws `M12 11v5M12 8h.01`, an "i". Comparing the rendered path data against the icon component
   * rendered on its own is the identity check - it needs no fixture and cannot drift from the icon
   * set, because it reads the icon set.
   */
  const glyphOf = (root: Element | null) =>
    [...(root?.querySelectorAll('path') ?? [])].map((n) => n.getAttribute('d')).join('|')

  it.each([
    ['info', InfoIcon],
    ['success', SuccessIcon],
    ['warning', WarningIcon],
    ['danger', DangerIcon],
  ] as const)('%s renders ITS OWN glyph, not merely some glyph', (intent, Expected) => {
    const alert = render(<Alert intent={intent}>Body</Alert>)
    const standalone = render(<Expected />)
    const seen = glyphOf(alert.container.querySelector('.clara-alert__icon'))
    expect(seen, `the ${intent} alert renders no path data to compare`).not.toBe('')
    expect(seen).toBe(glyphOf(standalone.container.firstElementChild))
  })

  it('gives the four intents four DISTINCT glyphs', () => {
    // Without this, an icon set whose four entries collapsed to one glyph would satisfy every
    // per-intent comparison above and still leave the intent invisible.
    const seen = INTENTS.map((intent) => {
      const { container } = render(<Alert intent={intent}>Body</Alert>)
      return glyphOf(container.querySelector('.clara-alert__icon'))
    })
    expect(new Set(seen).size, `the intents share glyphs: ${seen.join(' / ')}`).toBe(INTENTS.length)
  })

  it.each([
    ['info', 'Information'],
    ['success', 'Success'],
    ['warning', 'Warning'],
    ['danger', 'Error'],
  ] as const)('%s carries its intent into the accessible name as a word', (intent, word) => {
    const { container } = render(<Alert intent={intent}>Could not post.</Alert>)
    // And the word is what carries it in the ACCESSIBILITY TREE, where the icon is aria-hidden.
    expect(container.firstElementChild).toHaveTextContent(`${word}: Could not post.`)
  })

  it('marks the icon aria-hidden, so the intent is announced once and not twice', () => {
    const { container } = render(<Alert intent="danger">Could not post.</Alert>)
    expect(container.querySelector('.clara-alert__icon')).toHaveAttribute('aria-hidden', 'true')
  })

  it.each([
    ['danger', 'alert'],
    ['warning', 'alert'],
    ['info', 'status'],
    ['success', 'status'],
  ] as const)('%s announces as role=%s', (intent, role) => {
    // `alert` is assertive and interrupts; `status` waits its turn. An error the user must act on
    // interrupts, a confirmation does not.
    render(<Alert intent={intent}>Message.</Alert>)
    expect(screen.getByRole(role)).toBeInTheDocument()
  })

  /*
   * The PROP reaching its own CLASS - the link AC6 does not cover, and cannot.
   *
   * AC6 proves a class resolves to its intent's tokens, in a browser. It composes its markup BY HAND
   * (`e2e/stacking.spec.ts`), so it never renders this component and never sees the prop. Hardcoding
   * the modifier makes every danger, warning and success alert render INFO colours, and a review
   * measured that surviving 1200 unit tests, `pnpm typecheck`, `pnpm test:e2e` at 34 passed, and all
   * 30 guards including 147 prover mutations.
   *
   * Badge carried this assertion from the start and the other two did not, which is exactly how the
   * gap survived: the test already existed in this repository and was not copied across.
   *
   * EVERY intent, including the default where there is one - `neutral` takes its colour from the
   * base rule rather than a modifier, so a loop over the non-neutral intents leaves the most-used
   * path unbound.
   */
  it.each(INTENTS)('%s reaches its own class, so the colour is a token and not a style', (intent) => {
    const { container } = render(<Alert intent={intent}>Body</Alert>)
    const el = container.firstElementChild as HTMLElement
    expect(el.className).toContain(`clara-alert--${intent}`)
    // Every OTHER intent's modifier must be absent, or a component emitting all of them would pass.
    for (const other of INTENTS.filter((i) => i !== intent)) {
      expect(el.className).not.toContain(`clara-alert--${other}`)
    }
    // A token, not an inline style: an inline colour cannot be re-resolved per theme.
    expect(el.getAttribute('style')).toBeNull()
  })
})

describe('Alert intent contrast both themes', () => {
  /** The measured pairings the token build emits, per theme. */
  const pairings = (file: string) => {
    const raw = JSON.parse(readFileSync(join(__dirname, '../../../../../tokens/build', file), 'utf8'))
    return Array.isArray(raw) ? raw : Object.values(raw)[0] as unknown[]
  }

  it.each([
    ['light', 'tokens.pairings.json'],
    ['dark', 'tokens.pairings.dark.json'],
  ] as const)('every Alert intent pair meets AA in the %s theme', (_theme, file) => {
    const rows = pairings(file) as Array<{
      foreground: { token: string, value: string }
      background: { token: string, value: string }
      minRatio: number
    }>

    const checked: string[] = []
    for (const intent of INTENTS) {
      const row = rows.find((r) => r.foreground.token === `color-fg-${intent}`
        && r.background.token === `color-bg-${intent}-subtle`)
      // A missing pairing must fail rather than skip: this loop reporting success over four
      // `undefined`s is the vacuous pass the row-count assertion in check:contrast exists for.
      expect(row, `no pairing for fg-${intent} on bg-${intent}-subtle`).toBeTruthy()
      const ratio = contrastRatio(row!.foreground.value, row!.background.value)
      expect(ratio, `${intent}: ${row!.foreground.value} on ${row!.background.value}`)
        .toBeGreaterThanOrEqual(row!.minRatio)
      checked.push(intent)
    }
    expect(checked).toHaveLength(INTENTS.length)
  })
})

describe('Alert dismiss', () => {
  it('is reachable and operable from the keyboard', async () => {
    const onDismiss = vi.fn()
    const user = userEvent.setup()
    render(<Alert intent="info" onDismiss={onDismiss}>Saved.</Alert>)

    await user.tab()
    expect(screen.getByRole('button', { name: 'Dismiss' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('renders no control when it is not dismissible', () => {
    render(<Alert intent="danger">Could not post.</Alert>)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('passes axe dismissible and static, with and without a title', async () => {
    const { container } = render(
      <>
        <Alert intent="danger" title="Posting failed">Three invoices could not be posted.</Alert>
        <Alert intent="success" onDismiss={() => {}}>Saved.</Alert>
      </>,
    )
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
  })
})

/** Declared under its own literal name - see the note in Badge's suite for why not `describe.each`. */
describe('Alert theme and density matrix', () => {
  it.each([
    ['light', 'comfortable'], ['light', 'compact'],
    ['dark', 'comfortable'], ['dark', 'compact'],
  ] as const)('renders and passes axe in %s / %s', async (theme, density) => {
    const { container } = render(
      <ClaraProvider theme={theme} density={density}>
        <Alert intent="warning" title="Check the dates">Two lines fall outside the period.</Alert>
      </ClaraProvider>,
    )
    const scope = container.querySelector('[data-clara-theme]')
    expect(scope).toHaveAttribute('data-clara-theme', theme)
    expect(scope).toHaveAttribute('data-clara-density', density)
    expect(scope?.querySelector('.clara-alert')).toBeTruthy()
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
  })
})
