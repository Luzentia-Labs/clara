import { useId } from 'react'
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
  const selected = value ?? defaultValue ?? []

  return (
    <fieldset
      className={cx('clara-checkbox-group', `clara-checkbox-group--${orientation}`, className)}
      aria-describedby={wiring?.describedBy}
      aria-invalid={wiring?.invalid || undefined}
      aria-errormessage={wiring?.invalid ? wiring.errorId : undefined}
      disabled={wiring?.disabled || undefined}
    >
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
