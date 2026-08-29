'use client'

import { useState } from 'react'
import * as RadixPopover from '@radix-ui/react-popover'
import { CheckIcon, ChevronDownIcon } from '@luzentialabs/clara-icons'
import { cx } from '../../lib/cx'
import { ClaraPortal } from '../../theme/ClaraPortal'
import { fieldAriaProps, fieldDisabled, useFieldWiring } from '../../lib/field-context'
import { useListbox, type ListboxOption } from '../../lib/listbox'

export type SelectOption<T extends string = string> = ListboxOption<T>

export interface SelectProps<T extends string = string> {
  options: ReadonlyArray<SelectOption<T>>
  /** Controlled value. Pair with `onValueChange`. */
  value?: T
  /** Uncontrolled starting value. */
  defaultValue?: T
  /**
   * Receives the VALUE, not an event (AC3).
   *
   * A select has no meaningful `event.target.value` of its own - the trigger is a button - so
   * handing back an event would force every caller to reach through a synthetic object for the one
   * thing they wanted. Every composite control in Clara reports the value itself.
   */
  onValueChange?: (value: T) => void
  /** Shown when nothing is selected. Not a label: a Field owns the label. */
  placeholder?: string
  disabled?: boolean
  className?: string
}

/**
 * A single-choice control that opens a list.
 *
 * ## The pattern, and why focus never moves
 *
 * This is the APG's **select-only combobox**: the trigger carries `role="combobox"` with
 * `aria-expanded`, `aria-controls` and `aria-activedescendant`, and the popup carries
 * `role="listbox"` with `role="option"` children. Focus STAYS on the trigger the whole time and the
 * highlight moves by activedescendant. `onOpenAutoFocus` is prevented for exactly that reason - let
 * Radix move focus into the panel and `aria-activedescendant` is pointing at an option the user is
 * not on, which is worse than having no highlight at all.
 *
 * ## Positioning without dialog semantics
 *
 * It anchors to `RadixPopover.Anchor`, never `Trigger`. Radix's Trigger hardcodes
 * `aria-haspopup="dialog"` (the defect BG-01M105C0 records on Popover) and sets its own
 * `aria-expanded`, both of which would fight the combobox role this control needs. The Anchor gives
 * positioning and collision handling and adds no semantics, which is the whole of what is wanted.
 *
 * ## Inside a Modal
 *
 * The listbox portals through `ClaraPortal` and takes the shared overlay layer token, so it paints
 * above a Modal by open order rather than by a per-role z-index (D0088, AC4).
 */
export function Select<T extends string = string> ({
  options, value, defaultValue, onValueChange, placeholder = 'Select...', disabled, className,
}: SelectProps<T>) {
  const wiring = useFieldWiring()
  const isDisabled = fieldDisabled(wiring, disabled)
  const [open, setOpen] = useState(false)
  const [uncontrolled, setUncontrolled] = useState<T | undefined>(defaultValue)
  const current = value !== undefined ? value : uncontrolled

  const select = (option: SelectOption<T>) => {
    if (value === undefined) setUncontrolled(option.value)
    onValueChange?.(option.value)
  }

  const listbox = useListbox<T>({
    options,
    open,
    onOpen: () => { if (!isDisabled) setOpen(true) },
    onClose: () => setOpen(false),
    onSelect: select,
    isSelected: (option) => option.value === current,
    triggerKind: 'button',
    // A select-only combobox has no text entry, so printable keys are free to mean typeahead.
    typeahead: true,
  })

  const selected = options.find((o) => o.value === current)
  const aria = fieldAriaProps(wiring, 'toggle', isDisabled) as Record<string, unknown>

  return (
    <RadixPopover.Root open={open} onOpenChange={(next) => { if (!isDisabled) setOpen(next) }} modal={false}>
      <RadixPopover.Anchor asChild>
        <button
          type="button"
          role="combobox"
          className={cx('clara-select', isDisabled && 'clara-select--disabled', className)}
          {...aria}
          {...listbox.triggerProps}
          aria-haspopup="listbox"
          // `aria-disabled` plus a suppressed handler, never the native attribute: the control keeps
          // its tab stop so a keyboard user can reach it and learn it is unavailable (D0058, D0064).
          onClick={() => { if (!isDisabled) setOpen((o) => !o) }}
        >
          <span className={cx('clara-select__value', selected === undefined && 'clara-select__value--placeholder')}>
            {selected?.label ?? placeholder}
          </span>
          {/* Decoration. The state is already in `aria-expanded`, and announcing a chevron is noise. */}
          <ChevronDownIcon className="clara-select__chevron" aria-hidden="true" />
        </button>
      </RadixPopover.Anchor>
      <ClaraPortal open={open}>
        <RadixPopover.Content
          className="clara-select__listbox-panel"
          side="bottom"
          align="start"
          sideOffset={4}
          avoidCollisions
          collisionPadding={8}
          // THE load-bearing line. Focus stays on the trigger, because that is what
          // activedescendant means.
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          // Radix's Content is a `role="dialog"`, and a dialog wrapping a listbox is not this
          // pattern - axe reports it, and a screen reader would announce a dialog the user never
          // opened. The positioned element is scaffolding here, so it says so.
          role="presentation"
        >
          <ul {...listbox.listboxProps} className="clara-select__listbox">
            {options.map((option, index) => (
              <li
                key={option.value}
                {...listbox.optionProps(index)}
                className={cx(
                  'clara-select__option',
                  index === listbox.activeIndex && 'clara-select__option--active',
                  option.value === current && 'clara-select__option--selected',
                  option.disabled && 'clara-select__option--disabled',
                )}
              >
                {option.label}
                {/* The CHOICE, given a visible carrier by D0124. `aria-selected` on the same element
                    announces it; before this the announcement was the only channel, so a sighted
                    user could not tell their own selection from any other option. `aria-hidden`
                    because the glyph duplicates what `aria-selected` already says. */}
                {option.value === current
                  && <CheckIcon className="clara-select__check" aria-hidden="true" />}
              </li>
            ))}
          </ul>
        </RadixPopover.Content>
      </ClaraPortal>
    </RadixPopover.Root>
  )
}
