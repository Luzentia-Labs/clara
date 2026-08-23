import { useId, useState } from 'react'
import { cx } from '../../lib/cx'
import { useFieldWiring } from '../../lib/field-context'

export interface CheckboxOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

/**
 * Several independent choices from a set.
 *
 * Same fieldset/legend reasoning as RadioGroup - the legend is the question - but the interaction
 * is genuinely different: every box is its own tab stop, because they are independent decisions
 * rather than one decision with several answers. Borrowing the radio group's single tab stop here
 * would make the user arrow past options they cannot toggle.
 */
export interface CheckboxGroupProps {
  name: string
  options: CheckboxOption[]
  value?: string[]
  defaultValue?: string[]
  onChange?: (value: string[]) => void
  legend: string
  orientation?: 'vertical' | 'horizontal'
  className?: string
}

export function CheckboxGroup ({
  name, options, value, defaultValue, onChange, legend, orientation = 'vertical', className,
}: CheckboxGroupProps) {
  const wiring = useFieldWiring()
  const base = useId()
  const controlled = value !== undefined
  // Uncontrolled needs STATE. With `selected = value ?? defaultValue ?? []` the uncontrolled set
  // was frozen at the initial value, so every onChange was computed from it: ticking A then B
  // reported ["b"] rather than ["a","b"], while the boxes on screen stayed correct. A form reading
  // onChange therefore submitted a different set from the one the user could see.
  const [internal, setInternal] = useState<string[]>(() => defaultValue ?? [])
  const selected = value ?? internal

  return (
    <fieldset
      className={cx('clara-checkbox-group', `clara-checkbox-group--${orientation}`, className)}
      aria-labelledby={wiring?.labelFor === 'group' ? wiring.labelId : undefined}
      aria-describedby={wiring?.describedBy}
      aria-invalid={wiring?.invalid || undefined}
      aria-errormessage={wiring?.invalid ? wiring.errorId : undefined}
      aria-disabled={wiring?.disabled || undefined}
    >
      {/*
        * No aria-required. A `<fieldset>` is role=group, which does not support it - emitting it
        * anyway is invalid ARIA and axe reports it as critical. There is also nothing for it to
        * mean: each box is independently optional, and "at least one of these" is a form-level
        * rule, not a property of the group. A required choice belongs in the label or description.
        */}
      <legend className="clara-checkbox-group__legend">{legend}</legend>
      {options.map((option) => {
        const id = `${base}-${option.value}`
        const descriptionId = option.description ? `${id}-description` : undefined
        const isOn = selected.includes(option.value)
        return (
          <span className="clara-choice" key={option.value}>
            <input
              type="checkbox"
              id={id}
              name={name}
              value={option.value}
              className="clara-checkbox"
              disabled={option.disabled || undefined}
              aria-describedby={descriptionId}
              {...(controlled ? { checked: isOn } : { defaultChecked: isOn })}
              onChange={(event) => {
                const next = event.currentTarget.checked
                  ? [...selected, option.value]
                  : selected.filter((v) => v !== option.value)
                if (!controlled) setInternal(next)
                onChange?.(next)
              }}
            />
            <label className="clara-choice__label" htmlFor={id}>{option.label}</label>
            {option.description ? <span className="clara-choice__description" id={descriptionId}>{option.description}</span> : null}
          </span>
        )
      })}
    </fieldset>
  )
}
