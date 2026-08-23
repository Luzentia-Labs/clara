import { forwardRef, type InputHTMLAttributes } from 'react'
import { cx } from '../../lib/cx'
import { fieldAriaProps, useFieldWiring } from '../../lib/field-context'

/**
 * A numeric input.
 *
 * `inputMode="decimal"` rather than `type="number"`: a number input silently discards what it
 * cannot parse, scrolls its value on a stray wheel gesture, and in several browsers strips leading
 * zeros from things that are not quantities - order numbers, account codes. An ERP is full of
 * digits that are identifiers rather than amounts, so the value stays a string and validation
 * stays the form's job.
 *
 * Figures render with tabular numerals, so a column of them lines up.
 */
export interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type' | 'size'> {
  size?: 'sm' | 'md'
  /** Announced unit, e.g. "GBP". Becomes part of the control's accessible description. */
  unit?: string
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput (
  { size = 'md', unit, className, ...rest }, ref,
) {
  const wiring = useFieldWiring()
  const aria = fieldAriaProps(wiring)
  return (
    <span className="clara-number">
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        className={cx('clara-input', `clara-input--${size}`, 'clara-input--numeric', className)}
        {...aria}
        {...rest}
      />
      {unit ? <span className="clara-number__unit">{unit}</span> : null}
    </span>
  )
})
