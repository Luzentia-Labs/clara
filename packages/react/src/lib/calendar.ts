import {
  CalendarDate, parseDate, today, getLocalTimeZone,
  startOfMonth, startOfWeek, endOfMonth, getWeeksInMonth,
  isSameDay, isSameMonth,
} from '@internationalized/date'

/**
 * Calendar-date math for the pickers, and the ONLY place `@internationalized/date` is touched.
 *
 * ADR-008 chose that library because it models a calendar date as distinct from an instant, which
 * `Date` conflates - and required that Clara's public props accept and return ISO date strings, not
 * library types. This module is where that boundary is enforced: everything in and out is a
 * `YYYY-MM-DD` string, and no `CalendarDate` reaches a component's props. `check:api` asserts the
 * surface stays clean (DatePicker AC5).
 */

/** The locale used for week layout. Not a prop: see `weekStartsOn` below. */
const LOCALE = 'en-GB'

export type IsoDate = string

/** `null` for anything that is not a real `YYYY-MM-DD` - a bad string is not an exception here. */
export function fromIso (iso: string | undefined | null): CalendarDate | null {
  if (!iso) return null
  // parseDate THROWS on a malformed string, and a half-typed date is the normal state of a text
  // input the user is still filling in (AC1). Treating that as an error would make the control
  // unusable while being typed, so it is a miss rather than a throw.
  try { return parseDate(iso) } catch { return null }
}

export function toIso (date: CalendarDate): IsoDate {
  return date.toString()
}

export function todayIso (): IsoDate {
  return toIso(today(getLocalTimeZone()))
}

/**
 * The 6x7 grid for a month, as ISO strings, including the leading and trailing days that belong to
 * the neighbouring months.
 *
 * Always six rows. A month can span five or six depending on where it starts, and a grid that
 * changes height as you page through it moves everything below it on the screen - so the row count
 * is fixed and the extra week is filled from the next month.
 */
export function monthGrid (anchor: CalendarDate): IsoDate[][] {
  const first = startOfMonth(anchor)
  const gridStart = startOfWeek(first, LOCALE)
  const rows: IsoDate[][] = []
  for (let week = 0; week < 6; week++) {
    const row: IsoDate[] = []
    for (let day = 0; day < 7; day++) {
      row.push(toIso(gridStart.add({ days: week * 7 + day })))
    }
    rows.push(row)
  }
  return rows
}

/** Weekday headers in the same order `monthGrid` lays its columns out. */
export function weekdayLabels (): Array<{ short: string, long: string }> {
  const start = startOfWeek(today(getLocalTimeZone()), LOCALE)
  return Array.from({ length: 7 }, (_, i) => {
    const d = start.add({ days: i }).toDate(getLocalTimeZone())
    return {
      short: new Intl.DateTimeFormat(LOCALE, { weekday: 'narrow' }).format(d),
      long: new Intl.DateTimeFormat(LOCALE, { weekday: 'long' }).format(d),
    }
  })
}

/** "3 March 2026" - what the live region announces, and the cell's accessible name. */
export function announceDate (iso: IsoDate): string {
  const d = fromIso(iso)
  if (!d) return ''
  return new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' })
    .format(d.toDate(getLocalTimeZone()))
}

/** "March 2026" - the grid's own accessible name, so the month is announced with the day. */
export function announceMonth (iso: IsoDate): string {
  const d = fromIso(iso)
  if (!d) return ''
  return new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' })
    .format(d.toDate(getLocalTimeZone()))
}

export interface Availability {
  /** `| undefined` explicitly: `exactOptionalPropertyTypes` is on, so absent and undefined differ. */
  min?: IsoDate | undefined
  max?: IsoDate | undefined
  isDateUnavailable?: ((iso: IsoDate) => boolean) | undefined
}

/**
 * Whether a date can be chosen. An unavailable date stays IN the grid and is announced as
 * unavailable rather than removed (AC6): a hole where the 14th should be is harder to understand
 * than a 14th that says it cannot be picked.
 */
export function isUnavailable (iso: IsoDate, { min, max, isDateUnavailable }: Availability): boolean {
  const d = fromIso(iso)
  if (!d) return true
  const lo = fromIso(min)
  const hi = fromIso(max)
  // `CalendarDate.compare` rather than a `compareDate` helper: the latter is in the library's
  // internal query module and is NOT part of its public index.
  if (lo && d.compare(lo) < 0) return true
  if (hi && d.compare(hi) > 0) return true
  return isDateUnavailable?.(iso) ?? false
}

export interface DateRange {
  start: IsoDate
  end: IsoDate
}

/**
 * The presets a filter bar actually asks for (DateRangePicker AC2).
 *
 * These are the three the story names. They are computed rather than listed because "last quarter"
 * is a moving target and a hardcoded pair would be wrong the day after it was written - which is
 * also why the labels are fixed and the DATES are derived from today.
 */
export function presetRanges (): Array<{ label: string, range: DateRange }> {
  const now = today(getLocalTimeZone())
  const quarterStartMonth = Math.floor((now.month - 1) / 3) * 3 + 1
  // The quarter BEFORE the current one, which is what "last quarter" means to someone reporting on
  // a closed period - the current quarter is not finished, so its numbers are not comparable.
  const thisQuarterStart = new CalendarDate(now.year, quarterStartMonth, 1)
  const lastQuarterStart = thisQuarterStart.subtract({ months: 3 })
  return [
    { label: 'This month',
      range: { start: toIso(startOfMonth(now)), end: toIso(endOfMonth(now)) } },
    { label: 'Last quarter',
      range: { start: toIso(lastQuarterStart), end: toIso(thisQuarterStart.subtract({ days: 1 })) } },
    { label: 'Year to date',
      range: { start: toIso(new CalendarDate(now.year, 1, 1)), end: toIso(now) } },
  ]
}

export { isSameDay, isSameMonth, startOfMonth, endOfMonth, getWeeksInMonth }
