import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'

/**
 * The listbox engine - ONE implementation, shared by Select, Combobox and MultiSelect (D0105).
 *
 * It owns exactly what is genuinely this pattern's: option registration, the `aria-activedescendant`
 * highlight, typeahead, and the keyboard model. Positioning, dismissal and the portal are NOT here;
 * they come from `ClaraPortal` and Clara's Popover surface, which six components already use.
 *
 * **Why one engine rather than `@radix-ui/react-select`.** Radix Select implements the listbox
 * pattern with ROVING TABINDEX: focus moves onto the option itself, so there is no
 * `aria-activedescendant` to track. Combobox AC1 requires activedescendant, Combobox needs text
 * filtering, and MultiSelect needs multiple selection - none of which Radix Select offers. Adopting
 * it would have meant two mechanisms implementing one pattern, which is the drift
 * `lib/overlay-focus.ts` exists to prevent.
 *
 * **Focus stays on the trigger, always.** That is what activedescendant means, and it is why a
 * Combobox can keep a text caret in the input while the highlight moves through the list. Every
 * `focus()` call in this file would be a bug.
 */

/** One option. `label` is what typeahead matches and what a screen reader announces. */
export interface ListboxOption<T> {
  value: T
  label: string
  disabled?: boolean
}

export interface UseListboxInput<T> {
  options: ReadonlyArray<ListboxOption<T>>
  open: boolean
  onOpen: () => void
  onClose: () => void
  onSelect: (option: ListboxOption<T>) => void
  isSelected: (option: ListboxOption<T>) => boolean
  /**
   * Typeahead is a LISTBOX affordance and is wrong for a combobox, where the same keystrokes are
   * the filter query. Select turns it on; Combobox leaves it off.
   */
  typeahead?: boolean
}

/** How long a typeahead buffer survives without another keystroke. */
const TYPEAHEAD_WINDOW_MS = 500

/** The first enabled index at or after `from`, walking `step`, or -1 when there is none. */
function seek<T> (options: ReadonlyArray<ListboxOption<T>>, from: number, step: 1 | -1): number {
  for (let i = from; i >= 0 && i < options.length; i += step) {
    if (!options[i]?.disabled) return i
  }
  return -1
}

export function useListbox<T> (input: UseListboxInput<T>) {
  const { options, open, onOpen, onClose, onSelect, isSelected, typeahead = false } = input
  const baseId = useId()
  const listboxId = `${baseId}-listbox`
  const optionId = useCallback((index: number) => `${baseId}-option-${index}`, [baseId])

  const [activeIndex, setActiveIndex] = useState(-1)
  const buffer = useRef('')
  const bufferAt = useRef(0)

  const first = useMemo(() => seek(options, 0, 1), [options])
  const last = useMemo(() => seek(options, options.length - 1, -1), [options])

  // Opening puts the highlight on the SELECTED option, or on the first enabled one. Closing clears
  // it, so a reopened list never announces a stale position.
  useEffect(() => {
    if (!open) { setActiveIndex(-1); return }
    const selected = options.findIndex((o) => !o.disabled && isSelected(o))
    setActiveIndex(selected === -1 ? first : selected)
    // `isSelected` is a fresh closure every render, so it is deliberately not a dependency: this
    // effect must run when the list OPENS, not on every parent render while it is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, options, first])

  // NOTE: there is no second effect clamping the highlight when `options` changes. There was, and a
  // mutation proved it dead: the effect above already lists `options` as a dependency, so any change
  // to the list re-runs it and re-seats the highlight. Deleting the clamp changed nothing any test
  // could see, which is the definition of code that is not doing work. Resetting to the selected
  // option or the first enabled one is also the RIGHT behaviour when a combobox filters - the list
  // the user was pointing into no longer exists.

  const commit = useCallback((index: number) => {
    const option = options[index]
    if (!option || option.disabled) return false
    onSelect(option)
    return true
  }, [options, onSelect])

  const move = useCallback((step: 1 | -1) => {
    setActiveIndex((current) => {
      const from = current === -1 ? (step === 1 ? 0 : options.length - 1) : current + step
      const next = seek(options, from, step)
      // No wrapping. The APG's listbox does not wrap, and wrapping in a long list moves the
      // highlight somewhere the user did not expect and cannot see.
      return next === -1 ? current : next
    })
  }, [options])

  const runTypeahead = useCallback((char: string) => {
    const now = Date.now()
    buffer.current = now - bufferAt.current > TYPEAHEAD_WINDOW_MS ? char : buffer.current + char
    bufferAt.current = now
    const query = buffer.current.toLowerCase()
    // Repeating one character cycles through the options starting with it, which is what a user
    // pressing "s" three times means. A growing buffer would search for "sss" instead.
    const cycling = query.length > 1 && [...query].every((c) => c === query[0])
    const needle = cycling ? query[0]! : query
    const startAt = cycling || query.length === 1 ? activeIndex + 1 : 0
    const order = options.map((_, i) => (startAt + i) % options.length)
    const hit = order.find((i) => {
      const option = options[i]
      return option && !option.disabled && option.label.toLowerCase().startsWith(needle)
    })
    if (hit !== undefined) setActiveIndex(hit)
  }, [options, activeIndex])

  const onKeyDown = useCallback((event: KeyboardEvent) => {
    const { key } = event

    if (!open) {
      // Closed: the keys that OPEN. Space is included for the button trigger and is harmless for an
      // input, where it is a printable character the input handles before this ever sees it.
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ') {
        event.preventDefault()
        onOpen()
      }
      return
    }

    switch (key) {
      case 'ArrowDown': event.preventDefault(); move(1); return
      case 'ArrowUp': event.preventDefault(); move(-1); return
      case 'Home': event.preventDefault(); setActiveIndex(first); return
      case 'End': event.preventDefault(); setActiveIndex(last); return
      case 'Enter':
        event.preventDefault()
        if (commit(activeIndex)) onClose()
        return
      case 'Escape':
        event.preventDefault()
        // Escape CLOSES without selecting. A highlight is not a choice, and treating it as one
        // makes Escape destructive on the one key users press to back out.
        onClose()
        return
      case 'Tab':
        // Tab COMMITS and lets focus move on - deliberately NOT prevented, because swallowing Tab
        // strands a keyboard user inside a control they are trying to leave.
        commit(activeIndex)
        onClose()
        return
      default:
        if (typeahead && key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
          event.preventDefault()
          runTypeahead(key)
        }
    }
  }, [open, onOpen, onClose, move, first, last, commit, activeIndex, typeahead, runTypeahead])

  return {
    activeIndex,
    setActiveIndex,
    listboxId,
    optionId,
    onKeyDown,
    /** Spread onto the trigger - the button for Select, the input for Combobox. */
    triggerProps: {
      'aria-expanded': open,
      'aria-controls': open ? listboxId : undefined,
      'aria-activedescendant': open && activeIndex >= 0 ? optionId(activeIndex) : undefined,
      onKeyDown,
    },
    listboxProps: { id: listboxId, role: 'listbox' as const },
    optionProps: (index: number) => {
      const option = options[index]
      return {
        id: optionId(index),
        role: 'option' as const,
        // `aria-selected` is the CHOICE; the activedescendant highlight is the cursor. They are
        // different facts and a screen reader announces both, so neither may stand in for the other.
        'aria-selected': option ? isSelected(option) : false,
        'aria-disabled': option?.disabled ? (true as const) : undefined,
        // Pointer highlight follows the mouse, so the visible highlight and the announced
        // activedescendant never disagree about where the user is.
        onPointerMove: () => { if (!option?.disabled) setActiveIndex(index) },
        onClick: () => { if (commit(index)) onClose() },
      }
    },
  }
}
