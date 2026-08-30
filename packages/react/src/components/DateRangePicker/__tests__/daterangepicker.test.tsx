import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { runAxe } from '../../../../../../test/axe'
import { ClaraProvider } from '../../../theme/ClaraProvider'
import { Field } from '../../Field/Field'
import { DateRangePicker, type DateRange } from '../DateRangePicker'

const inField = (node: React.ReactNode) => render(<Field label="Period">{node}</Field>)
/**
 * The trigger's accessible NAME is the Field's label - `aria-labelledby` outranks contents (D0064),
 * so a screen reader says "Period", not the date range. The range is the trigger's visible TEXT,
 * which is a different fact and asserted separately below.
 */
const openPanel = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Period' }))
  await screen.findByRole('dialog')
}

describe('DateRangePicker range selection', () => {
  it('captures BOTH endpoints and keeps the panel open between them', async () => {
    const onValueChange = vi.fn()
    inField(<DateRangePicker defaultValue={{ start: '2026-03-10', end: '' }} onValueChange={onValueChange} />)
    await openPanel()
    await userEvent.click(screen.getByRole('gridcell', { name: '12 March 2026' }))
    expect(onValueChange, 'the first choice is a start, not a range').not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog'), 'and the panel stays open').not.toBeNull()
    await userEvent.click(screen.getByRole('gridcell', { name: '18 March 2026' }))
    expect(onValueChange).toHaveBeenCalledWith({ start: '2026-03-12', end: '2026-03-18' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('announces the range, and the start while it is still pending', async () => {
    // Seeded into March: with no value the grid opens on TODAY, which is the right behaviour and
    // the reason this fixture names a month rather than relying on one.
    inField(<DateRangePicker defaultValue={{ start: '2026-03-10', end: '' }} />)
    await openPanel()
    await userEvent.click(screen.getByRole('gridcell', { name: '12 March 2026' }))
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Start 12 March 2026'))
    await userEvent.click(screen.getByRole('gridcell', { name: '18 March 2026' }))
    await waitFor(() => {
      const said = screen.getByRole('status').textContent ?? ''
      expect(said).toContain('12 March 2026')
      expect(said).toContain('18 March 2026')
    })
  })

  it('orders the endpoints when they are chosen backwards', async () => {
    // Clicking the later date first means a range, not an error.
    const onValueChange = vi.fn()
    inField(<DateRangePicker defaultValue={{ start: '2026-03-10', end: '' }} onValueChange={onValueChange} />)
    await openPanel()
    await userEvent.click(screen.getByRole('gridcell', { name: '18 March 2026' }))
    await userEvent.click(screen.getByRole('gridcell', { name: '12 March 2026' }))
    expect(onValueChange).toHaveBeenCalledWith({ start: '2026-03-12', end: '2026-03-18' })
  })

  it('marks the days BETWEEN the endpoints as in-range, and the endpoints as endpoints', async () => {
    inField(<DateRangePicker defaultValue={{ start: '2026-03-12', end: '2026-03-18' }} />)
    await openPanel()
    const between = screen.getByRole('gridcell', { name: '15 March 2026' })
    const endpoint = screen.getByRole('gridcell', { name: '12 March 2026' })
    expect(between.className).toContain('clara-date-range-picker__day--in-range')
    expect(between.className, 'context, not choice').not.toContain('__day--endpoint')
    expect(endpoint.className).toContain('clara-date-range-picker__day--endpoint')
    // And NOT in-range: a cell carrying both puts two backgrounds on one day, and which one paints
    // then depends on stylesheet order rather than on intent. A mutant widening the range to `>=`
    // survived until this line existed.
    expect(endpoint.className, 'an endpoint is not also context')
      .not.toContain('clara-date-range-picker__day--in-range')
    expect(endpoint).toHaveAttribute('aria-selected', 'true')
    expect(between).toHaveAttribute('aria-selected', 'false')
  })
})

describe('DateRangePicker presets are keyboard reachable', () => {
  it('offers this month, last quarter and year to date as real buttons', async () => {
    inField(<DateRangePicker />)
    await openPanel()
    for (const label of ['This month', 'Last quarter', 'Year to date']) {
      expect(screen.getByRole('button', { name: label }), label).toBeTruthy()
    }
  })

  it.each(['This month', 'Last quarter', 'Year to date'])(
    'applies %s from the keyboard, with the dates that label actually means', async (label) => {
      // Asserting only that a range came back let a mutant turn "Last quarter" into THIS quarter
      // and survive. The label is a claim about which dates, so the dates are what is checked.
      const onValueChange = vi.fn()
      inField(<DateRangePicker onValueChange={onValueChange} />)
      await openPanel()
      screen.getByRole('button', { name: label }).focus()
      await userEvent.keyboard('{Enter}')
      expect(onValueChange).toHaveBeenCalledTimes(1)
      const range = onValueChange.mock.calls[0]![0] as DateRange
      expect(range.end > range.start, 'a range, not a point').toBe(true)

      const now = new Date()
      const y = now.getFullYear()
      const q = Math.floor(now.getMonth() / 3)
      if (label === 'This month') {
        expect(range.start).toBe(`${y}-${String(now.getMonth() + 1).padStart(2, '0')}-01`)
      } else if (label === 'Year to date') {
        expect(range.start).toBe(`${y}-01-01`)
      } else {
        // The quarter BEFORE the current one, and ending the day before this quarter starts.
        const thisQ = new Date(Date.UTC(y, q * 3, 1))
        const lastQ = new Date(Date.UTC(y, q * 3 - 3, 1))
        const dayBefore = new Date(thisQ.getTime() - 86400000)
        expect(range.start).toBe(lastQ.toISOString().slice(0, 10))
        expect(range.end, 'ends the day this quarter begins, minus one')
          .toBe(dayBefore.toISOString().slice(0, 10))
      }
    })
})

describe('DateRangePicker drives a filter bar', () => {
  it('runs controlled from an ISO pair and clears back to empty through the same callback', async () => {
    // The composition a filter bar needs: one controlled value, one callback, and a way to REMOVE
    // the filter without reaching past the public API.
    const Bar = () => {
      const [range, setRange] = useState<DateRange>({ start: '2026-03-12', end: '2026-03-18' })
      return (
        <>
          <Field label="Period"><DateRangePicker value={range} onValueChange={setRange} /></Field>
          <output>{range.start && range.end ? `${range.start}..${range.end}` : 'no filter'}</output>
        </>
      )
    }
    render(<Bar />)
    expect(document.querySelector('output')?.textContent).toBe('2026-03-12..2026-03-18')
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(document.querySelector('output')?.textContent, 'cleared through the public API')
      .toBe('no filter')
  })

  it('shows the chosen range as the triggerTEXT, while its NAME stays the field label', () => {
    inField(<DateRangePicker defaultValue={{ start: '2026-03-12', end: '2026-03-18' }} />)
    const trigger = screen.getByRole('button', { name: 'Period' })
    expect(trigger.textContent, 'a filter bar reads the range without opening the panel')
      .toContain('12 March 2026 to 18 March 2026')
  })
})

describe('DateRangePicker theme and density matrix', () => {
  it.each([
    ['light', 'comfortable'], ['light', 'compact'],
    ['dark', 'comfortable'], ['dark', 'compact'],
  ] as const)('renders inside the %s / %s scope and passes axe', async (theme, density) => {
    const { container } = render(
      <ClaraProvider theme={theme} density={density}>
        <Field label="Period">
          <DateRangePicker defaultValue={{ start: '2026-03-12', end: '2026-03-18' }} />
        </Field>
      </ClaraProvider>,
    )
    await openPanel()
    const scope = screen.getByRole('dialog').closest('[data-clara-theme]')
    expect(scope?.getAttribute('data-clara-theme')).toBe(theme)
    expect(scope?.getAttribute('data-clara-density')).toBe(density)
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
    await expect(runAxe(document.body)).resolves.toHaveNoBlockingViolations()
  })
})

describe('DateRangePicker stylesheets select on the three day states', () => {
  const css = readFileSync(resolve(__dirname, '../../../styles.css'), 'utf8')
  const block = (selector: string) => {
    const at = css.indexOf(selector + ' {')
    expect(at, `${selector} has no rule`).toBeGreaterThan(-1)
    return css.slice(at, css.indexOf('}', at))
  }

  it('gives the endpoints and the in-range days DIFFERENT surfaces, each with its own text', () => {
    for (const sel of ['.clara-date-range-picker__day--endpoint',
                       '.clara-date-range-picker__day--in-range']) {
      const rule = block(sel)
      expect(rule, `${sel} needs a surface`).toContain('background:')
      expect(rule, `${sel} is a reading pair, so it declares its own text`).toContain('color:')
    }
  })

  it('puts the roving cursor on the SHADOW channel, so it composes with either', () => {
    // A day can be the cursor AND an endpoint. If the cursor took the background it would fight the
    // endpoint's fill and one of the two facts would be lost.
    const rule = block('.clara-date-range-picker__day--focused')
    expect(rule).toContain('box-shadow: inset')
    expect(rule, 'and it does NOT claim the background').not.toContain('background:')
  })
})
