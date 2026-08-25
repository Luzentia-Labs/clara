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
import { Alert } from '../Alert'

const INTENTS = ['info', 'success', 'warning', 'danger'] as const

describe('Alert intent is not colour alone', () => {
  it.each(INTENTS)('%s renders an icon, so the intent is visible without reading the hue', (intent) => {
    const { container } = render(<Alert intent={intent}>Three invoices could not be posted.</Alert>)
    // The icon is what carries the intent ON SCREEN. A visually-hidden word paints nothing, so it
    // cannot satisfy this criterion on its own.
    expect(container.querySelector('.clara-alert__icon')).toBeTruthy()
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
