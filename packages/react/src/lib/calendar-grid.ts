import { useCallback, useEffect, useRef, useState } from 'react'
import { fromIso, monthGrid, todayIso, toIso, type IsoDate } from './calendar'

/**
 * The calendar grid's keyboard model and roving focus, shared by DatePicker and DateRangePicker.
 *
 * Same shape as `useListbox` and for the same reason (D0131): the hook owns the model, each
 * component owns its markup. A range picker needs cell states a single picker does not - in-range
 * days that are neither endpoint - so fixing the markup in a shared component would buy less than
 * it costs. Copying the model instead is the drift `lib/overlay-focus.ts` exists to prevent, and a
 * calendar's model is more intricate than a listbox's, not less.
 */

/** Arrow keys move a day, up and down move a WEEK, page keys move a MONTH. */
const STEP: Record<string, { days?: number, months?: number }> = {
  ArrowLeft: { days: -1 }, ArrowRight: { days: 1 },
  ArrowUp: { days: -7 }, ArrowDown: { days: 7 },
  PageUp: { months: -1 }, PageDown: { months: 1 },
}

export interface UseCalendarGridInput {
  open: boolean
  /** Where the roving focus starts when the grid opens - the current value, or today. */
  seed: IsoDate
  /** Chosen by Enter, Space or a click. The component decides what choosing MEANS. */
  onChoose: (iso: IsoDate) => void
  /** Escape. Closes and restores focus to whatever opened the grid. */
  onDismiss: () => void
  isUnavailable: (iso: IsoDate) => boolean
}

/**
 * Where the roving focus starts. The seed is a RAW text-input value on DatePicker, so it is routinely
 * half-typed (`2026-0`) or outright invalid - a truthy string that `fromIso` cannot parse. Guarding
 * on truthiness alone let such a seed through to `monthGrid`, which produced a calendar of zero day
 * cells: no roving tab stop, arrow keys inert, and no way out except fixing the text.
 */
function seatFrom (seed: IsoDate): IsoDate {
  return seed && fromIso(seed) ? seed : todayIso()
}

export function useCalendarGrid ({ open, seed, onChoose, onDismiss, isUnavailable }: UseCalendarGridInput) {
  const [focused, setFocused] = useState<IsoDate>(seatFrom(seed))
  const gridRef = useRef<HTMLTableSectionElement | null>(null)

  // Opening seats the roving focus. Closing does not reset it, so reopening returns the user where
  // they were rather than to a month they already left.
  useEffect(() => { if (open) setFocused(seatFrom(seed)) }, [open, seed])

  /**
   * A CALLBACK ref, not a plain one, because the grid lives behind a portal: when `open` flips, an
   * effect runs before the portal content is in the DOM, so the ref is still null and focus never
   * lands. Measured on DatePicker - focus stayed on the toggle button while all 42 cells rendered
   * and the roving cell existed. Attach time is the only moment the node is guaranteed to be there.
   */
  const attachGrid = useCallback((node: HTMLTableSectionElement | null) => {
    gridRef.current = node
    node?.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
  }, [])

  // Focus follows the roving cell on every subsequent move - that is what roving tabindex means,
  // and without it the arrow keys move a marker no screen reader follows.
  useEffect(() => {
    if (!open) return
    gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
  }, [open, focused])

  const onKeyDown = (event: React.KeyboardEvent) => {
    const { key } = event
    if (key === 'Escape') {
      // Escape closes and RESTORES focus. A dialog that closes and drops focus to the body strands
      // a keyboard user at the top of the page.
      event.preventDefault(); onDismiss(); return
    }
    if (key === 'Enter' || key === ' ') {
      event.preventDefault()
      if (!isUnavailable(focused)) onChoose(focused)
      return
    }
    const anchor = fromIso(focused)
    if (!anchor) return
    if (key === 'Home' || key === 'End') {
      // Week bounds, not month bounds: the row the user is on is the unit they are navigating.
      event.preventDefault()
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

  const rows = fromIso(focused) ? monthGrid(fromIso(focused)!) : []
  return { focused, setFocused, attachGrid, onKeyDown, rows }
}
