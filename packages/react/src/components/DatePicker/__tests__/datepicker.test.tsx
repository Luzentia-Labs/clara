import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { runAxe } from '../../../../../../test/axe'
import { ClaraProvider } from '../../../theme/ClaraProvider'
import { Field } from '../../Field/Field'
import { DatePicker } from '../DatePicker'

const inField = (node: React.ReactNode) => render(<Field label="Invoice date">{node}</Field>)

/** Open the calendar and return the cell that owns the roving tab stop. */
const openCalendar = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Choose date' }))
  await screen.findByRole('dialog')
  return document.querySelector('[role="gridcell"][tabindex="0"]') as HTMLElement
}

describe('DatePicker accepts direct text entry', () => {
  it('types a date without the calendar, and is never disabled in favour of it', async () => {
    const onValueChange = vi.fn()
    inField(<DatePicker onValueChange={onValueChange} />)
    const input = screen.getByRole('textbox')
    expect(input).not.toBeDisabled()
    await userEvent.type(input, '2026-03-14')
    expect(onValueChange).toHaveBeenLastCalledWith('2026-03-14')
  })

  it('stays reachable when disabled, and never emits the native attribute', async () => {
    // D0058, D0064, D0068: disabled is `aria-disabled` plus a suppressed handler, never the native
    // attribute - so the control keeps its tab stop and a keyboard user can reach it and learn it
    // is unavailable. A native `disabled` would remove it from the tab order entirely.
    const onValueChange = vi.fn()
    inField(<DatePicker disabled onValueChange={onValueChange} />)
    const input = screen.getByRole('textbox')
    expect(input).not.toHaveAttribute('disabled')
    expect(input).toHaveAttribute('aria-disabled', 'true')
    expect(input).toHaveAttribute('readonly')
    await userEvent.type(input, '2026-03-14')
    expect(onValueChange, 'and the handler is suppressed too').not.toHaveBeenCalled()
  })

  it('tolerates a half-typed date rather than throwing, AND still opens a usable calendar', async () => {
    // `parseDate` throws on a malformed string, and half-typed is the normal state of an input
    // someone is still filling in. Treating that as an error makes the control unusable.
    //
    // Round 1 review, F7 and F2. This used to assert only that the input echoed `2026-0` back,
    // which is a controlled input doing its job - it never opened the calendar, so `fromIso` was
    // never handed the malformed string and the try/catch this comment cites could be deleted with
    // the test still green. Opening it exposed the real defect: a truthy-but-unparseable seed
    // passed the `||` guard and failed the `fromIso` guard, so the grid rendered ZERO day cells,
    // with no roving tab stop and inert arrow keys.
    inField(<DatePicker />)
    await userEvent.type(screen.getByRole('textbox'), '2026-0')
    expect(screen.getByRole('textbox')).toHaveValue('2026-0')

    const roving = await openCalendar()
    expect(document.querySelectorAll('[role="gridcell"]').length,
      'a half-typed date falls back to today, it does not empty the grid').toBe(42)
    expect(roving, 'and the roving tab stop exists, so the arrow keys have an anchor').not.toBeNull()
  })

  it('falls back to today when the VALUE prop itself is unparseable (F2)', async () => {
    inField(<DatePicker value="2026-13-45" />)
    await openCalendar()
    expect(document.querySelectorAll('[role="gridcell"]').length).toBe(42)
  })
})

describe('DatePicker format is in the description', () => {
  it('states the format in the accessible description, not only the placeholder', () => {
    // A placeholder disappears exactly when the user needs it, and is not reliably announced.
    inField(<DatePicker format="DD/MM/YYYY" />)
    const input = screen.getByRole('textbox')
    const ids = (input.getAttribute('aria-describedby') ?? '').split(' ')
    const described = ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ')
    expect(described).toContain('DD/MM/YYYY')
    expect(input).toHaveAttribute('placeholder', 'DD/MM/YYYY')
  })
})

describe('DatePicker calendar keyboard navigation', () => {
  it('moves by day, by week, by month, and to week bounds', async () => {
    inField(<DatePicker defaultValue="2026-03-14" />)
    const start = await openCalendar()
    expect(start).toHaveAttribute('aria-label', '14 March 2026')

    const focusedLabel = () =>
      document.querySelector('[role="gridcell"][tabindex="0"]')?.getAttribute('aria-label')

    await userEvent.keyboard('{ArrowRight}')
    expect(focusedLabel()).toBe('15 March 2026')
    await userEvent.keyboard('{ArrowDown}')
    expect(focusedLabel(), 'a week, not a day').toBe('22 March 2026')
    await userEvent.keyboard('{ArrowUp}{ArrowLeft}')
    expect(focusedLabel()).toBe('14 March 2026')
    await userEvent.keyboard('{PageDown}')
    expect(focusedLabel(), 'a month').toBe('14 April 2026')
    await userEvent.keyboard('{PageUp}')
    expect(focusedLabel()).toBe('14 March 2026')
    await userEvent.keyboard('{Home}')
    expect(focusedLabel(), 'the start of the WEEK, not the month').toBe('9 March 2026')
    await userEvent.keyboard('{End}')
    expect(focusedLabel()).toBe('15 March 2026')
  })

  it('closes on Escape and RESTORES focus to the input', async () => {
    // A dialog that closes and drops focus to the body strands a keyboard user at the top of the
    // page - which is why the restore is asserted rather than only the close.
    inField(<DatePicker defaultValue="2026-03-14" />)
    await openCalendar()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.activeElement).toBe(screen.getByRole('textbox'))
  })

  it('selects the focused day on Enter and closes', async () => {
    const onValueChange = vi.fn()
    inField(<DatePicker defaultValue="2026-03-14" onValueChange={onValueChange} />)
    await openCalendar()
    await userEvent.keyboard('{ArrowRight}{Enter}')
    expect(onValueChange).toHaveBeenCalledWith('2026-03-15')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('keeps exactly one cell in the tab order', async () => {
    // That is what roving tabindex MEANS. Without it a user tabs through 42 cells.
    inField(<DatePicker defaultValue="2026-03-14" />)
    await openCalendar()
    expect(document.querySelectorAll('[role="gridcell"][tabindex="0"]')).toHaveLength(1)
    expect(document.querySelectorAll('[role="gridcell"][tabindex="-1"]').length).toBeGreaterThan(40)
  })
})

describe('DatePicker announces focused date and month', () => {
  it('states the day AND the month every time focus moves', async () => {
    // The month is not decoration: arrowing off the end of a month changes it, and a bare "14"
    // tells the user nothing about which month they landed in.
    inField(<DatePicker defaultValue="2026-03-31" />)
    await openCalendar()
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('31 March 2026'))
    // The grid's accessible name is the month CONTEXT, and it is what actually changes when you
    // arrow off the end of a month. Asserting the month inside the day string was a tautology -
    // "1 April 2026" contains "April 2026" - and a mutant deleting the repetition survived it.
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', 'March 2026')
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('1 April 2026'))
    expect(screen.getByRole('grid'), 'the month context moved with it')
      .toHaveAttribute('aria-label', 'April 2026')
  })
})

describe('DatePicker announces unavailable dates', () => {
  it('keeps an unavailable day in the grid, marked and announced rather than removed', async () => {
    // A hole where the 14th should be is harder to understand than a 14th that says it cannot be
    // picked - so it stays, carries aria-disabled, and says so when focused.
    inField(<DatePicker defaultValue="2026-03-14" min="2026-03-10" max="2026-03-20" />)
    await openCalendar()
    const outside = screen.getByRole('gridcell', { name: '5 March 2026' })
    expect(outside, 'still in the grid').toBeTruthy()
    expect(outside).toHaveAttribute('aria-disabled', 'true')
    await userEvent.keyboard('{ArrowUp}{ArrowUp}')
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('unavailable'))
  })

  it('refuses to commit an unavailable day', async () => {
    const onValueChange = vi.fn()
    inField(<DatePicker defaultValue="2026-03-14" max="2026-03-14" onValueChange={onValueChange} />)
    await openCalendar()
    await userEvent.keyboard('{ArrowRight}{Enter}')
    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog'), 'and stays open').not.toBeNull()
  })
})

describe('DatePicker theme and density matrix', () => {
  it.each([
    ['light', 'comfortable'], ['light', 'compact'],
    ['dark', 'comfortable'], ['dark', 'compact'],
  ] as const)('renders inside the %s / %s scope and passes axe', async (theme, density) => {
    const { container } = render(
      <ClaraProvider theme={theme} density={density}>
        <Field label="Invoice date"><DatePicker defaultValue="2026-03-14" /></Field>
      </ClaraProvider>,
    )
    await openCalendar()
    const scope = screen.getByRole('dialog').closest('[data-clara-theme]')
    expect(scope?.getAttribute('data-clara-theme')).toBe(theme)
    expect(scope?.getAttribute('data-clara-density')).toBe(density)
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
    await expect(runAxe(document.body)).resolves.toHaveNoBlockingViolations()
  })
})

describe('DatePicker stylesheets select on the day state model', () => {
  const css = readFileSync(resolve(__dirname, '../../../styles.css'), 'utf8')
  const block = (selector: string) => {
    const at = css.indexOf(selector + ' {')
    expect(at, `${selector} has no rule`).toBeGreaterThan(-1)
    return css.slice(at, css.indexOf('}', at))
  }

  it('gives the roving CURSOR a non-colour carrier beside its tint', () => {
    const rule = block('.clara-date-picker__day--focused')
    expect(rule).toContain('background:')
    expect(rule).toContain('box-shadow: inset')
  })

  it('gives the SELECTED day its own fill AND its own foreground', () => {
    const rule = block('.clara-date-picker__day--selected')
    expect(rule).toContain('background:')
    expect(rule, 'a fill with inherited text is a contrast pair nobody declared').toContain('color:')
  })

  it('keeps an UNAVAILABLE day readable rather than hiding it', () => {
    expect(block('.clara-date-picker__day--unavailable')).toContain('color:')
  })
})

/**
 * Round 1 review, F5 and F8. The suite asserted that `.clara-date-picker__day--selected` HAS a
 * background and a colour in `styles.css`, but nothing asserted the class is ever emitted - so
 * `aria-selected={false}` and a deleted class modifier both shipped green. That is the "class
 * asserted but styling nothing" defect this sprint caught four times, run in reverse: a rule proven
 * to exist for a state proven nowhere to be applied.
 */
describe('DatePicker marks the day already chosen', () => {
  it('marks it in the accessibility tree AND in the class list', async () => {
    inField(<DatePicker value="2026-03-14" />)
    await openCalendar()
    const chosen = screen.getByRole('gridcell', { name: '14 March 2026' })
    expect(chosen.getAttribute('aria-selected'),
      'a screen reader is told which cell is the current value').toBe('true')
    expect(chosen.className,
      'and the rule proven to exist in styles.css is actually applied').toContain('clara-date-picker__day--selected')

    const others = Array.from(document.querySelectorAll('[role="gridcell"]'))
      .filter((cell) => cell !== chosen)
    expect(others.some((cell) => cell.getAttribute('aria-selected') === 'true'),
      'and it is the ONLY selected cell').toBe(false)
  })

  it('marks the toggle unavailable rather than leaving it silently inert (F8)', () => {
    inField(<DatePicker disabled />)
    const toggle = screen.getByRole('button', { name: 'Choose date' })
    expect(toggle.getAttribute('aria-disabled'),
      'D0058: reachable, and TOLD it is unavailable').toBe('true')
    expect(toggle.hasAttribute('disabled'), 'never the native attribute (D0064)').toBe(false)
  })
})
