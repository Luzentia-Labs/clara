'use client'

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import * as RadixPopover from '@radix-ui/react-popover'
import { cx } from '../../lib/cx'
import { ClaraPortal } from '../../theme/ClaraPortal'
import { devWarning } from '../../lib/dev-warning'
import { fieldAriaProps, fieldDisabled, useFieldWiring } from '../../lib/field-context'
import { useListbox, type ListboxOption } from '../../lib/listbox'

/** An option, optionally belonging to a named group. */
export interface ComboboxOption<T extends string = string> extends ListboxOption<T> {
  /** Groups options under an accessible label. Ungrouped options render before every group. */
  group?: string
}

/**
 * What the list is doing right now.
 *
 * A closed set rather than three booleans: `loading` and `error` at once is not a state anything
 * can render, and a union makes it unrepresentable instead of merely discouraged.
 */
export type ComboboxStatus = 'idle' | 'loading' | 'error'

export interface ComboboxProps<T extends string = string> {
  options: ReadonlyArray<ComboboxOption<T>>
  value?: T
  defaultValue?: T
  onValueChange?: (value: T) => void
  /**
   * The query changed.
   *
   * Supplying it turns OFF local filtering: the caller owns the query and hands back the options it
   * wants shown. That is the async path, and it is the one large lists must take.
   */
  onQueryChange?: (query: string) => void
  status?: ComboboxStatus
  /** Shown when the list is empty and not loading. */
  emptyMessage?: string
  /** Shown when `status` is `error`. */
  errorMessage?: string
  placeholder?: string
  disabled?: boolean
  className?: string
}

/**
 * The client-side option ceiling.
 *
 * Not a hard limit: exceeding it renders and works. It is the point past which the caller should be
 * loading asynchronously, and it warns rather than truncating, because a list that silently drops
 * entries is worse than a slow one. Client-side virtualization is v1.1 (D0019).
 *
 * **Deliberately NOT exported from the package entry.** It is a number Clara may re-tune as the
 * render path changes, and a published constant is a one-way door: a consumer branching on it would
 * break when it moved. The warning message names the value, and so does the docs page, which is
 * where a developer needs it. Exported from this module only, so the test can assert the boundary
 * on both sides without hard-coding the number twice.
 */
export const COMBOBOX_LOCAL_OPTION_CEILING = 500

/**
 * A text input that filters a list of options.
 *
 * The WAI-ARIA **combobox** pattern: `role="combobox"` on the input with `aria-expanded`,
 * `aria-controls` and `aria-activedescendant`; `role="listbox"` on the popup. It shares the listbox
 * engine with Select and MultiSelect (D0105), so the keyboard model, the highlight and the
 * non-wrapping arrows are one implementation rather than three.
 *
 * **Typeahead is off here, and that is not an oversight.** In a Select the printable keys are a
 * jump-to-option affordance; in a Combobox they are the query. Turning both on would mean every
 * keystroke both filtered the list and moved the highlight somewhere else.
 */
export function Combobox<T extends string = string> ({
  options, value, defaultValue, onValueChange, onQueryChange, status = 'idle',
  emptyMessage = 'No matches', errorMessage = 'Could not load options',
  placeholder, disabled, className,
}: ComboboxProps<T>) {
  const wiring = useFieldWiring()
  const isDisabled = fieldDisabled(wiring, disabled)
  const statusId = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [uncontrolled, setUncontrolled] = useState<T | undefined>(defaultValue)
  const current = value !== undefined ? value : uncontrolled
  const async = onQueryChange !== undefined

  // Local filtering only when the caller has not taken the query. With `onQueryChange` the caller
  // owns what is shown, and filtering here as well would hide options it deliberately returned.
  const visible = useMemo(() => {
    if (async || query === '') return options
    const needle = query.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(needle))
  }, [options, query, async])

  const ceilingRef = useRef(false)
  useEffect(() => {
    // Guarded at the CALL SITE: `devWarning` returns early in production but its arguments are
    // still evaluated and the message literal is still reachable, so a minifier cannot drop it.
    // `check-dev-warnings.mjs` proves that by bundling this caller and requiring the message gone.
    if (process.env.NODE_ENV === 'production') return
    if (ceilingRef.current) return
    ceilingRef.current = true
    devWarning(
      !async && options.length > COMBOBOX_LOCAL_OPTION_CEILING,
      `A Combobox was given ${options.length} options with no \`onQueryChange\`, past the ` +
      `${COMBOBOX_LOCAL_OPTION_CEILING} the client-side path is documented for. Every keystroke ` +
      'filters the whole array and renders every match, and there is no virtualization - that is ' +
      'deferred to v1.1 (D0019). Take the async path: pass `onQueryChange`, query your source, and ' +
      'hand back the options to show. Nothing is truncated here, because a list that silently drops ' +
      'entries is worse than a slow one.',
    )
  }, [options.length, async])

  const select = (option: ComboboxOption<T>) => {
    if (value === undefined) setUncontrolled(option.value)
    onValueChange?.(option.value)
    setQuery('')
  }

  const listbox = useListbox<T>({
    options: visible,
    open,
    onOpen: () => { if (!isDisabled) setOpen(true) },
    onClose: () => setOpen(false),
    onSelect: select,
    isSelected: (option) => option.value === current,
    // OFF. Printable keys are the query here; see the docblock.
    typeahead: false,
  })

  // Grouped for RENDERING while the engine keeps one flat index. Two index spaces would be two
  // sources of truth about which option is highlighted, and `aria-activedescendant` can name only one.
  const groups = useMemo(() => {
    const order: string[] = []
    const byGroup = new Map<string, Array<{ option: ComboboxOption<T>, index: number }>>()
    visible.forEach((option, index) => {
      const key = option.group ?? ''
      if (!byGroup.has(key)) { byGroup.set(key, []); order.push(key) }
      byGroup.get(key)!.push({ option, index })
    })
    return order.map((key) => ({ label: key, entries: byGroup.get(key)! }))
  }, [visible])

  const selected = options.find((o) => o.value === current)
  const aria = fieldAriaProps(wiring, 'text', isDisabled) as Record<string, unknown>
  const describedBy = [aria['aria-describedby'] as string | undefined, statusId].filter(Boolean).join(' ')
  const showEmpty = status === 'idle' && visible.length === 0
  const showError = status === 'error'

  return (
    <RadixPopover.Root open={open} onOpenChange={(next) => { if (!isDisabled) setOpen(next) }} modal={false}>
      <RadixPopover.Anchor asChild>
        <div className={cx('clara-combobox', isDisabled && 'clara-combobox--disabled', className)}>
          <input
            type="text"
            role="combobox"
            className="clara-combobox__input"
            autoComplete="off"
            value={open ? query : selected?.label ?? query}
            {...(placeholder === undefined ? {} : { placeholder })}
            {...aria}
            {...listbox.triggerProps}
            aria-describedby={describedBy || undefined}
            aria-autocomplete="list"
            onChange={(event) => {
              if (isDisabled) { event.preventDefault(); return }
              setQuery(event.target.value)
              if (!open) setOpen(true)
              onQueryChange?.(event.target.value)
            }}
            onClick={() => { if (!isDisabled) setOpen(true) }}
          />
          {/*
            * The status region is ALWAYS present and empty until there is something to say.
            * A region that appears in the same commit as its text is commonly not announced at all,
            * which Input records at length - and here the announcement IS the feature (AC2).
            */}
          <span id={statusId} className="clara-visually-hidden" role="status">
            {status === 'loading' ? 'Loading options' : showError ? errorMessage : showEmpty ? emptyMessage : ''}
          </span>
        </div>
      </RadixPopover.Anchor>
      <ClaraPortal open={open}>
        <RadixPopover.Content
          className="clara-combobox__panel"
          side="bottom"
          align="start"
          sideOffset={4}
          avoidCollisions
          collisionPadding={8}
          // Focus stays in the INPUT - the caret has to keep working while the highlight moves.
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          role="presentation"
        >
          {status === 'loading' && <div className="clara-combobox__message">Loading options</div>}
          {showError && <div className="clara-combobox__message clara-combobox__message--error">{errorMessage}</div>}
          {showEmpty && <div className="clara-combobox__message">{emptyMessage}</div>}
          <ul {...listbox.listboxProps} className="clara-combobox__listbox">
            {groups.map((group) => {
              const body = group.entries.map(({ option, index }) => (
                <li
                  key={option.value}
                  {...listbox.optionProps(index)}
                  className={cx(
                    'clara-combobox__option',
                    index === listbox.activeIndex && 'clara-combobox__option--active',
                    option.disabled && 'clara-combobox__option--disabled',
                  )}
                >
                  {option.label}
                </li>
              ))
              if (group.label === '') return body
              return <GroupedOptions key={group.label} label={group.label}>{body}</GroupedOptions>
            })}
          </ul>
        </RadixPopover.Content>
      </ClaraPortal>
    </RadixPopover.Root>
  )
}

/**
 * A labelled group of options.
 *
 * `role="group"` with `aria-labelledby`, never `aria-label` alone: the label is VISIBLE here, and a
 * duplicated string is a string that can drift from the one on screen.
 */
function GroupedOptions ({ label, children }: { label: string, children: ReactNode }) {
  const labelId = useId()
  return (
    <li role="presentation">
      <ul role="group" aria-labelledby={labelId} className="clara-combobox__group">
        <li id={labelId} role="presentation" className="clara-combobox__group-label">{label}</li>
        {children}
      </ul>
    </li>
  )
}
