import { useId } from 'react'
import { cx } from '../../lib/cx'
import { fieldDisabled, useFieldWiring } from '../../lib/field-context'

export interface RadioOption {
  value: string
  label: string
  /** Per-option help. Announced with the option, not with the group. */
  description?: string
  disabled?: boolean
}

/**
 * A single choice from a set.
 *
 * A `fieldset`/`legend`, not a div with a label. The legend is what makes a screen reader announce
 * the QUESTION when focus enters the group and the ANSWER as the user arrows through it - a
 * labelled div gives you the answers with no question attached, which in a form of twenty radio
 * groups is unusable.
 *
 * Native radios, so arrow-key navigation, the single tab stop, and the roving focus are the
 * browser's rather than ours. Reimplementing them is how those behaviours drift apart.
 */
export interface RadioGroupProps {
  name: string
  options: RadioOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  /** The question. Required - a set of answers with no question announces nothing useful. */
  legend: string
  orientation?: 'vertical' | 'horizontal'
  className?: string
}

export function RadioGroup ({
  name, options, value, defaultValue, onChange, legend, orientation = 'vertical', className,
}: RadioGroupProps) {
  const wiring = useFieldWiring()
  const base = useId()
  return (
    // `radiogroup` rather than the bare fieldset's implicit `group`: it is the correct role for a
    // set of mutually exclusive options, and it is the one that SUPPORTS aria-required. Putting
    // aria-required on a plain group is invalid ARIA, and axe reports it as critical.
    <fieldset
      role="radiogroup"
      className={cx('clara-radio-group', `clara-radio-group--${orientation}`, className)}
      aria-labelledby={wiring?.labelFor === 'group' ? wiring.labelId : undefined}
      aria-describedby={wiring?.describedBy}
      aria-required={wiring?.required || undefined}
      aria-invalid={wiring?.invalid || undefined}
      aria-errormessage={wiring?.invalid ? wiring.errorId : undefined}
      aria-disabled={wiring?.disabled || undefined}
    >
      {/*
        * In group mode the FIELD's label names the group (aria-labelledby), so rendering the legend
        * as well puts the same words on screen twice. It stays in the accessibility tree as the
        * fieldset's own caption but is visually hidden, because a fieldset with no legend is worse
        * markup than one whose legend is not painted.
        *
        * `(required)` is appended as TEXT rather than as aria-required: a `<fieldset>` is
        * role=group, which does not support that property, and the Field's asterisk is aria-hidden
        * - so without this the required state was announced nowhere at all.
        */}
      <legend className={cx('clara-radio-group__legend', wiring?.labelFor === 'group' && 'clara-visually-hidden')}>
        {legend}{wiring?.required ? ' (required)' : ''}
      </legend>
      {options.map((option) => {
        const id = `${base}-${option.value}`
        const descriptionId = option.description ? `${id}-description` : undefined
        return (
          <span className="clara-choice" key={option.value}>
            <input
              type="radio"
              id={id}
              name={name}
              value={option.value}
              className="clara-radio"
              aria-disabled={option.disabled || wiring?.disabled || undefined}
              aria-describedby={descriptionId}
              {...(value === undefined ? { defaultChecked: defaultValue === option.value } : { checked: value === option.value })}
              onChange={(event) => {
                // aria-disabled keeps the option reachable but does not stop it changing.
                if (option.disabled || fieldDisabled(wiring)) { event.preventDefault(); return }
                onChange?.(option.value)
              }}
              onClick={(event) => { if (option.disabled || fieldDisabled(wiring)) event.preventDefault() }}
            />
            <label className="clara-choice__label" htmlFor={id}>{option.label}</label>
            {option.description ? <span className="clara-choice__description" id={descriptionId}>{option.description}</span> : null}
          </span>
        )
      })}
    </fieldset>
  )
}
