'use client'

import { useId, useRef, useState } from 'react'
import * as RadixPopover from '@radix-ui/react-popover'
import { CalendarIcon } from '@luzentialabs/clara-icons'
import { cx } from '../../lib/cx'
import { ClaraPortal } from '../../theme/ClaraPortal'
import { fieldAriaProps, fieldDisabled, useFieldWiring } from '../../lib/field-context'
import {
  announceDate, announceMonth, fromIso, isUnavailable, presetRanges, todayIso,
  weekdayLabels, type Availability, type DateRange, type IsoDate,
} from '../../lib/calendar'
import { useCalendarGrid } from '../../lib/calendar-grid'

export type { DateRange }

export interface DateRangePickerProps extends Availability {
  /** A controlled ISO-string PAIR. Both endpoints, one prop (AC3). */
  value?: DateRange
  defaultValue?: DateRange
  /** Both endpoints through ONE callback, including the empty range on clear. */
  onValueChange?: (value: DateRange) => void
  disabled?: boolean
  className?: string
}

const EMPTY: DateRange = { start: '', end: '' }

/**
 * A range field with a calendar and presets.
 *
 * ## One keyboard model, not two
 *
 * The grid is `useCalendarGrid`, the same hook DatePicker drives (D0131). What differs is what
 * CHOOSING means: the first choice sets the start and leaves the panel open, the second sets the
 * end and closes. The hook owns the roving focus and the arrow model; this component owns what a
 * chosen day does and how an in-range day is drawn.
 *
 * ## Why presets are buttons in the panel
 *
 * "Last quarter" is the request a finance user actually has, and expressing it through a grid is
 * twelve arrow presses and an off-by-one. They are real buttons in the dialog's tab order, before
 * the grid, so a keyboard user meets them first (AC2).
 *
 * ## Clearing is part of the API
 *
 * A filter bar has to be able to remove a filter. `onValueChange` reports the empty range like any
 * other value, so a caller never reaches past the public API to reset it (AC3).
 */
export function DateRangePicker ({
  value, defaultValue, onValueChange, min, max, isDateUnavailable, disabled, className,
}: DateRangePickerProps) {
  const wiring = useFieldWiring()
  const isDisabled = fieldDisabled(wiring, disabled)
  const base = useId()
  const statusId = `${base}-status`

  const [open, setOpen] = useState(false)
  const [uncontrolled, setUncontrolled] = useState<DateRange>(defaultValue ?? EMPTY)
  const current = value !== undefined ? value : uncontrolled
  /** Which endpoint the next choice sets. Reset whenever a range completes or clears. */
  const [pending, setPending] = useState<IsoDate>('')
  const [announcement, setAnnouncement] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)

  const apply = (next: DateRange) => {
    if (value === undefined) setUncontrolled(next)
    onValueChange?.(next)
  }
  /**
   * Closing DISCARDS a pending start. Every route out of the panel goes through here: Escape, a
   * completed range, an outside click, a second click on the trigger, and Radix's own dismiss. It
   * used to be cleared on Escape alone, so a user who picked a start and then clicked away had that
   * abandoned date silently waiting - their next single pick completed a range against it.
   */
  const closePanel = () => { setPending(''); setOpen(false) }
  const closeAndRestore = () => { closePanel(); triggerRef.current?.focus() }

  const availability = { min, max, isDateUnavailable }

  const choose = (iso: IsoDate) => {
    if (!pending) {
      // First choice: the start. The panel STAYS OPEN - a range needs two dates, and closing here
      // would make the user reopen it every time, which is the same reasoning as D0128.
      setPending(iso)
      setAnnouncement(`Start ${announceDate(iso)}. Choose an end date.`)
      return
    }
    // Second choice completes it. Chosen out of order, the earlier date is the start - a user who
    // clicks the end first meant a range, not an error.
    const [start, end] = [pending, iso].sort()
    apply({ start: start!, end: end! })
    setPending('')
    setAnnouncement(`${announceDate(start!)} to ${announceDate(end!)}`)
    closeAndRestore()
  }

  const grid = useCalendarGrid({
    open,
    seed: current.start || todayIso(),
    onChoose: choose,
    onDismiss: closeAndRestore,
    isUnavailable: (iso) => isUnavailable(iso, availability),
  })

  const inRange = (iso: IsoDate) =>
    Boolean(current.start && current.end && iso > current.start && iso < current.end)

  const label = current.start && current.end
    ? `${announceDate(current.start)} to ${announceDate(current.end)}`
    : 'Select date range'

  const aria = fieldAriaProps(wiring, 'toggle', isDisabled) as Record<string, unknown>
  const describedBy = [aria['aria-describedby'] as string | undefined, statusId]
    .filter(Boolean).join(' ')
  const weekdays = weekdayLabels()

  return (
    <RadixPopover.Root
      open={open}
      onOpenChange={(next) => { if (!isDisabled) { if (next) setOpen(true); else closePanel() } }}
      modal={false}
    >
      <div className={cx('clara-date-range-picker', isDisabled && 'clara-date-range-picker--disabled', className)}>
        <RadixPopover.Anchor asChild>
          <button
            ref={triggerRef}
            type="button"
            className="clara-date-range-picker__trigger"
            {...aria}
            aria-describedby={describedBy || undefined}
            aria-expanded={open}
            aria-haspopup="dialog"
            // `aria-disabled` plus a suppressed handler, never the native attribute (D0058, D0064).
            onClick={() => { if (!isDisabled) { if (open) closePanel(); else setOpen(true) } }}
          >
            <span className={cx('clara-date-range-picker__value',
              !current.start && 'clara-date-range-picker__value--placeholder')}>{label}</span>
            <CalendarIcon className="clara-date-range-picker__icon" aria-hidden="true" />
          </button>
        </RadixPopover.Anchor>
        {current.start && current.end && (
          <button
            type="button"
            className="clara-date-range-picker__clear"
            aria-disabled={isDisabled || undefined}
            onClick={() => { if (!isDisabled) { apply(EMPTY); setPending(''); setAnnouncement('Range cleared') } }}
          >
            Clear
          </button>
        )}
        <div id={statusId} role="status" aria-live="polite" className="clara-visually-hidden">
          {announcement}
        </div>
      </div>
      <ClaraPortal open={open}>
        <RadixPopover.Content
          className="clara-date-range-picker__panel"
          side="bottom" align="start" sideOffset={4} avoidCollisions collisionPadding={8}
          role="dialog"
          aria-label={announceMonth(grid.focused)}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          {/* Presets come BEFORE the grid in the tab order, because they are the shorter route to
              the answer a filter bar usually wants (AC2). */}
          <div className="clara-date-range-picker__presets">
            {presetRanges().map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="clara-date-range-picker__preset"
                onClick={() => {
                  apply(preset.range); setPending('')
                  setAnnouncement(`${preset.label}: ${announceDate(preset.range.start)} to ${announceDate(preset.range.end)}`)
                  closeAndRestore()
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <table className="clara-date-range-picker__grid" role="grid"
            aria-label={announceMonth(grid.focused)}>
            <thead>
              <tr>
                {weekdays.map((day) => (
                  <th key={day.long} scope="col" abbr={day.long}
                    className="clara-date-range-picker__weekday">{day.short}</th>
                ))}
              </tr>
            </thead>
            <tbody ref={grid.attachGrid} onKeyDown={grid.onKeyDown}>
              {grid.rows.map((week) => (
                <tr key={week[0]} role="row">
                  {week.map((iso) => {
                    const unavailable = isUnavailable(iso, availability)
                    const isEnd = iso === current.start || iso === current.end || iso === pending
                    return (
                      <td key={iso} role="gridcell"
                        aria-selected={isEnd}
                        aria-disabled={unavailable || undefined}
                        tabIndex={iso === grid.focused ? 0 : -1}
                        aria-label={announceDate(iso)}
                        className={cx(
                          'clara-date-range-picker__day',
                          isEnd && 'clara-date-range-picker__day--endpoint',
                          inRange(iso) && 'clara-date-range-picker__day--in-range',
                          iso === grid.focused && 'clara-date-range-picker__day--focused',
                          unavailable && 'clara-date-range-picker__day--unavailable',
                        )}
                        onClick={() => { if (!unavailable) { grid.setFocused(iso); choose(iso) } }}
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
