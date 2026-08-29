'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import * as RadixPopover from '@radix-ui/react-popover'
import { CalendarIcon } from '@luzentialabs/clara-icons'
import { cx } from '../../lib/cx'
import { ClaraPortal } from '../../theme/ClaraPortal'
import { fieldAriaProps, fieldChangeGuard, fieldDisabled, useFieldWiring } from '../../lib/field-context'
import {
  announceDate, announceMonth, fromIso, isUnavailable, monthGrid, todayIso, toIso,
  weekdayLabels, type Availability, type IsoDate,
} from '../../lib/calendar'

export interface DatePickerProps extends Availability {
  /** ISO `YYYY-MM-DD`. No `@internationalized/date` type reaches this surface (ADR-008, AC5). */
  value?: IsoDate
  defaultValue?: IsoDate
  onValueChange?: (value: IsoDate) => void
  /** Shown in the input AND stated in the accessible description, never only as a placeholder. */
  format?: string
  disabled?: boolean
  className?: string
}

const STEP: Record<string, { days?: number, months?: number }> = {
  ArrowLeft: { days: -1 }, ArrowRight: { days: 1 },
  ArrowUp: { days: -7 }, ArrowDown: { days: 7 },
  PageUp: { months: -1 }, PageDown: { months: 1 },
}

/**
 * A date field with a calendar, following the APG's date-picker dialog.
 *
 * ## Typing is never taken away
 *
 * The text input is the primary control and is never disabled in favour of the calendar (AC1).
 * Typing a date is faster than nine arrow presses for anyone who knows the date they want, and it
 * is the only route for a user who cannot operate a grid. The calendar is an ALTERNATIVE, opened
 * from a button beside it.
 *
 * ## The grid is a different keyboard model from the listbox
 *
 * Select, Combobox and MultiSelect keep focus on the trigger and move an `aria-activedescendant`
 * highlight. A calendar does not: it is a two-dimensional `role="grid"` with ROVING TABINDEX, so
 * focus really moves to the focused day and arrow keys move in two axes. That is why this component
 * shares no engine with the other three - the shared listbox engine models one axis and one focus
 * owner, and forcing a grid through it would be a worse fit than writing the twelve lines here.
 *
 * ## What the format hint is for
 *
 * The expected format is stated in the accessible description, not only in the placeholder (AC2).
 * A placeholder disappears the moment the user types, which is exactly when they need to know what
 * shape the value takes - and a placeholder is not reliably announced at all.
 */
export function DatePicker ({
  value, defaultValue, onValueChange, format = 'YYYY-MM-DD',
  min, max, isDateUnavailable, disabled, className,
}: DatePickerProps) {
  const wiring = useFieldWiring()
  const isDisabled = fieldDisabled(wiring, disabled)
  const base = useId()
  const formatId = `${base}-format`
  const statusId = `${base}-status`

  const [open, setOpen] = useState(false)
  const [uncontrolled, setUncontrolled] = useState<IsoDate>(defaultValue ?? '')
  const current = value !== undefined ? value : uncontrolled
  /** The grid's roving focus. Not the value: a user can browse without choosing. */
  const [focused, setFocused] = useState<IsoDate>(current || todayIso())
  const [announcement, setAnnouncement] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLTableSectionElement | null>(null)

  /**
   * A CALLBACK ref, not a plain one, because the grid lives behind a portal: when `open` flips, the
   * effect below runs before the portal content is in the DOM, so `gridRef.current` is still null
   * and the focus never lands. Measured - focus stayed on the toggle button while all 42 cells
   * rendered and the roving cell existed. Focusing at ATTACH time is the only moment the node is
   * guaranteed to be there.
   */
  const attachGrid = useCallback((node: HTMLTableSectionElement | null) => {
    gridRef.current = node
    node?.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
  }, [])

  const commit = (next: IsoDate) => {
    if (value === undefined) setUncontrolled(next)
    onValueChange?.(next)
  }

  // Opening seats the roving focus on the current value, or today. Closing does not reset it, so
  // reopening returns the user where they were rather than to a month they already left.
  useEffect(() => {
    if (open) setFocused(current || todayIso())
  }, [open, current])

  // Move DOM focus to the focused cell whenever it changes while open - that is what roving
  // tabindex means, and without it the arrow keys move a highlight the screen reader never follows.
  useEffect(() => {
    if (!open) return
    const cell = gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')
    cell?.focus()
  }, [open, focused])

  const availability = { min, max, isDateUnavailable }
  const closeAndRestore = () => { setOpen(false); inputRef.current?.focus() }

  const onGridKeyDown = (event: React.KeyboardEvent) => {
    const { key } = event
    if (key === 'Escape') {
      event.preventDefault()
      // Escape CLOSES and RESTORES focus to the input (AC3). A dialog that closes and drops focus
      // to the body strands a keyboard user at the top of the page.
      closeAndRestore()
      return
    }
    if (key === 'Enter' || key === ' ') {
      event.preventDefault()
      if (!isUnavailable(focused, availability)) { commit(focused); closeAndRestore() }
      return
    }
    const anchor = fromIso(focused)
    if (!anchor) return
    if (key === 'Home' || key === 'End') {
      event.preventDefault()
      // Week bounds, not month bounds: the row the user is on is the unit they are navigating.
      const row = monthGrid(anchor).find((week) => week.includes(focused))
      const edge = key === 'Home' ? row?.[0] : row?.[row.length - 1]
      if (edge) setFocused(edge)
      return
    }
    const step = STEP[key]
    if (!step) return
    event.preventDefault()
    setFocused(toIso(anchor.add(step)))
  }

  // The focused date AND its month, every time focus moves (AC4). The month is not decoration:
  // arrowing off the end of a month changes it, and a bare "14" tells the user nothing about which.
  useEffect(() => {
    if (!open || !focused) return
    const unavailable = isUnavailable(focused, availability)
    // The DAY string already carries its month ("1 April 2026"), so repeating it here says nothing
    // - a mutant deleting the repetition survived, which is how that redundancy was found. The
    // month CONTEXT that actually changes is the grid's own accessible name, asserted separately.
    setAnnouncement(`${announceDate(focused)}${unavailable ? ', unavailable' : ''}`)
    // `availability` is rebuilt every render, so it is deliberately not a dependency - this must
    // announce when FOCUS moves, not on every parent render while the calendar is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, focused])

  const aria = fieldAriaProps(wiring, 'text', isDisabled) as Record<string, unknown>
  const describedBy = [aria['aria-describedby'] as string | undefined, formatId]
    .filter(Boolean).join(' ')
  const grid = fromIso(focused) ? monthGrid(fromIso(focused)!) : []
  const weekdays = weekdayLabels()

  return (
    <RadixPopover.Root open={open} onOpenChange={(next) => { if (!isDisabled) setOpen(next) }} modal={false}>
      <div className={cx('clara-date-picker', isDisabled && 'clara-date-picker--disabled', className)}>
        <input
          ref={inputRef}
          type="text"
          className="clara-date-picker__input"
          inputMode="numeric"
          placeholder={format}
          value={current}
          {...aria}
          aria-describedby={describedBy || undefined}
          // Text entry is never disabled in favour of the calendar (AC1). The suppression uses the
          // shared `fieldChangeGuard` rather than a hand-rolled `if (!isDisabled)` - that is the
          // mechanism D0068 exists to keep in ONE place, and a local copy is how the two paths
          // drift apart. It also preventDefaults, which a bare early return does not.
          onChange={fieldChangeGuard<React.ChangeEvent<HTMLInputElement>>(
            wiring, (event) => commit(event.target.value), disabled)}
        />
        <RadixPopover.Anchor asChild>
          <button
            type="button"
            className="clara-date-picker__toggle"
            aria-label="Choose date"
            aria-expanded={open}
            aria-haspopup="dialog"
            onClick={() => { if (!isDisabled) setOpen((o) => !o) }}
          >
            <CalendarIcon aria-hidden="true" />
          </button>
        </RadixPopover.Anchor>
        {/* The format, in the accessible DESCRIPTION rather than only the placeholder (AC2). */}
        <span id={formatId} className="clara-visually-hidden">{`Date format ${format}`}</span>
        <div id={statusId} role="status" aria-live="polite" className="clara-visually-hidden">
          {announcement}
        </div>
      </div>
      <ClaraPortal open={open}>
        <RadixPopover.Content
          className="clara-date-picker__panel"
          side="bottom"
          align="start"
          sideOffset={4}
          avoidCollisions
          collisionPadding={8}
          role="dialog"
          aria-label={announceMonth(focused)}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <table className="clara-date-picker__grid" role="grid" aria-label={announceMonth(focused)}>
            <thead>
              <tr>
                {weekdays.map((day) => (
                  <th key={day.long} scope="col" abbr={day.long}
                    className="clara-date-picker__weekday">{day.short}</th>
                ))}
              </tr>
            </thead>
            <tbody ref={attachGrid} onKeyDown={onGridKeyDown}>
              {grid.map((week) => (
                <tr key={week[0]} role="row">
                  {week.map((iso) => {
                    const unavailable = isUnavailable(iso, availability)
                    const isFocused = iso === focused
                    return (
                      <td key={iso} role="gridcell"
                        aria-selected={iso === current}
                        // Unavailable dates stay IN the grid and SAY they are unavailable (AC6).
                        // A hole where the 14th should be is harder to understand than a 14th that
                        // says it cannot be picked.
                        aria-disabled={unavailable || undefined}
                        // Roving tabindex: exactly one cell is in the tab order at a time.
                        tabIndex={isFocused ? 0 : -1}
                        aria-label={announceDate(iso)}
                        className={cx(
                          'clara-date-picker__day',
                          iso === current && 'clara-date-picker__day--selected',
                          isFocused && 'clara-date-picker__day--focused',
                          unavailable && 'clara-date-picker__day--unavailable',
                        )}
                        onClick={() => {
                          if (unavailable) return
                          setFocused(iso); commit(iso); closeAndRestore()
                        }}
                      >
                        {fromIso(iso)?.day}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </RadixPopover.Content>
      </ClaraPortal>
    </RadixPopover.Root>
  )
}
