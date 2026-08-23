import { forwardRef, type InputHTMLAttributes } from 'react'
import { cx } from '../../lib/cx'
import { fieldAriaProps, useFieldWiring } from '../../lib/field-context'

/**
 * An on/off switch.
 *
 * A checkbox under the hood with `role="switch"`: it is the same interaction and the same keyboard
 * model, and building it from a div would mean reimplementing both. The role is what makes a
 * screen reader say "on"/"off" rather than "checked"/"unchecked" - which matters, because a switch
 * takes effect immediately while a checkbox usually waits for submit.
 */
export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  label?: string
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch (
  { label, className, ...rest }, ref,
) {
  const wiring = useFieldWiring()
  const input = (
    <input
      ref={ref}
      type="checkbox"
      role="switch"
      className={cx('clara-switch', className)}
      {...fieldAriaProps(wiring)}
      {...rest}
    />
  )
  return label ? <span className="clara-choice">{input}<span className="clara-choice__label">{label}</span></span> : input
})
