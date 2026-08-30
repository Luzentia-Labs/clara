'use client'

import { useId, useState } from 'react'
import * as RadixPopover from '@radix-ui/react-popover'
import { CheckIcon, ChevronDownIcon } from '@luzentialabs/clara-icons'
import { cx } from '../../lib/cx'
import { ClaraPortal } from '../../theme/ClaraPortal'
import { fieldAriaProps, fieldDisabled, useFieldWiring } from '../../lib/field-context'
import { useListbox, type ListboxOption } from '../../lib/listbox'
import { Tag } from '../Tag/Tag'

export type MultiSelectOption<T extends string = string> = ListboxOption<T>

export interface MultiSelectProps<T extends string = string> {
  options: ReadonlyArray<MultiSelectOption<T>>
  /** Controlled values. Pair with `onValuesChange`. */
  values?: ReadonlyArray<T>
  /** Uncontrolled starting values. */
  defaultValues?: ReadonlyArray<T>
  /** Receives the VALUES, not an event - the same convention every composite control here uses. */
  onValuesChange?: (values: T[]) => void
  /** Shown when nothing is selected. Not a label: a Field owns the label. */
  placeholder?: string
  disabled?: boolean
  className?: string
}

/**
 * A multiple-choice control that opens a list and shows each choice as a removable tag.
 *
 * ## What differs from Select, and why it is one engine rather than two
 *
 * The pattern is the same APG select-only combobox and the same shared engine (D0105): the trigger
 * carries `role="combobox"`, focus never leaves it, and the highlight moves by
 * `aria-activedescendant`. The one behavioural difference is that choosing does not close the list
 * (D0128) - a user picking several values should not reopen it for each - which is an engine
 * OPTION rather than a second keyboard model, because two implementations of one pattern is the
 * drift `lib/overlay-focus.ts` exists to prevent.
 *
 * That option also changes Tab: in single-select Tab commits the highlight, and here it does not.
 * Where selections accumulate, committing a cursor the user never chose adds a value they may not
 * notice, and an accidental toggle is worse than a lost one.
 *
 * ## The tags are the undo
 *
 * Each selection renders as a removable `Tag`, whose remove control is named with the value it
 * removes - so a keyboard user can drop one choice without reopening the list, which is the whole
 * point of showing them.
 *
 * ## The count is announced
 *
 * A polite live region is ALWAYS present and empty until there is something to say. A region created
 * in the same commit as its text is commonly not announced at all - `Input` records that at length -
 * and here the announcement is the only signal a screen-reader user gets that a toggle landed,
 * because the list stays open and focus never moves.
 */
export function MultiSelect<T extends string = string> ({
  options, values, defaultValues, onValuesChange,
  placeholder = 'Select...', disabled, className,
}: MultiSelectProps<T>) {
  const wiring = useFieldWiring()
  const isDisabled = fieldDisabled(wiring, disabled)
  const [open, setOpen] = useState(false)
  const [uncontrolled, setUncontrolled] = useState<ReadonlyArray<T>>(defaultValues ?? [])
  const current = values !== undefined ? values : uncontrolled
  const statusId = `${useId()}-status`

  const apply = (next: T[]) => {
    if (values === undefined) setUncontrolled(next)
    onValuesChange?.(next)
  }
  const toggle = (option: MultiSelectOption<T>) => {
    apply(current.includes(option.value)
      ? current.filter((v) => v !== option.value)
      : [...current, option.value])
  }

  const listbox = useListbox<T>({
    options,
    open,
    onOpen: () => { if (!isDisabled) setOpen(true) },
    onClose: () => setOpen(false),
    onSelect: toggle,
    isSelected: (option) => current.includes(option.value),
    triggerKind: 'button',
    // D0128. The whole difference between this control and Select.
    closeOnSelect: false,
    // No text entry, so printable keys are free to mean typeahead - same as Select.
    typeahead: true,
  })

  const selected = options.filter((o) => current.includes(o.value))
  const aria = fieldAriaProps(wiring, 'toggle', isDisabled) as Record<string, unknown>
  const describedBy = [aria['aria-describedby'] as string | undefined, statusId]
    .filter(Boolean).join(' ')

  return (
    <RadixPopover.Root open={open} onOpenChange={(next) => { if (!isDisabled) setOpen(next) }} modal={false}>
      <div className={cx('clara-multi-select', isDisabled && 'clara-multi-select--disabled', className)}>
        {selected.length > 0 && (
          <ul className="clara-multi-select__tags">
            {selected.map((option) => (
              <li key={option.value}>
                {/* The remove control is named with the VALUE it removes (AC1), not "remove" - a
                    screen-reader user tabbing through several of these otherwise hears the same
                    string every time and cannot tell which one they are about to drop. */}
                <Tag
                  onRemove={() => apply(current.filter((v) => v !== option.value))}
                  removeLabel={`Remove ${option.label}`}
                  disabled={isDisabled}
                >
                  {option.label}
                </Tag>
              </li>
            ))}
          </ul>
        )}
        <RadixPopover.Anchor asChild>
          <button
            type="button"
            role="combobox"
            className="clara-multi-select__trigger"
            {...aria}
            {...listbox.triggerProps}
            aria-describedby={describedBy || undefined}
            aria-haspopup="listbox"
            // `aria-disabled` plus a suppressed handler, never the native attribute: the control
            // keeps its tab stop so a keyboard user can reach it and learn it is unavailable
            // (D0058, D0064).
            onClick={() => { if (!isDisabled) setOpen((o) => !o) }}
          >
            <span className={cx('clara-multi-select__value',
              selected.length === 0 && 'clara-multi-select__value--placeholder')}>
              {selected.length === 0 ? placeholder : `${selected.length} selected`}
            </span>
            <ChevronDownIcon className="clara-multi-select__chevron" aria-hidden="true" />
          </button>
        </RadixPopover.Anchor>
        {/* ALWAYS present, empty until there is something to say (AC2). */}
        <div id={statusId} role="status" aria-live="polite" className="clara-visually-hidden">
          {selected.length > 0 ? `${selected.length} selected` : ''}
        </div>
      </div>
      <ClaraPortal open={open}>
        <RadixPopover.Content
          className="clara-multi-select__listbox-panel"
          side="bottom"
          align="start"
          sideOffset={4}
          avoidCollisions
          collisionPadding={8}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          role="presentation"
        >
          <ul {...listbox.listboxProps} aria-multiselectable="true" className="clara-multi-select__listbox">
            {options.map((option, index) => (
              <li
                key={option.value}
                {...listbox.optionProps(index)}
                className={cx(
                  'clara-multi-select__option',
                  index === listbox.activeIndex && 'clara-multi-select__option--active',
                  option.disabled && 'clara-multi-select__option--disabled',
                )}
              >
                {option.label}
                {/* The CHOICE's visible carrier (D0124). `aria-hidden` because `aria-selected` on
                    this same element already says it. */}
                {current.includes(option.value)
                  && <CheckIcon className="clara-multi-select__check" aria-hidden="true" />}
              </li>
            ))}
          </ul>
        </RadixPopover.Content>
      </ClaraPortal>
    </RadixPopover.Root>
  )
}
