import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import { cx } from '../../lib/cx'
import { fieldAriaProps, fieldChangeGuard, useFieldWiring } from '../../lib/field-context'

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
  { label, className, onClick, onChange, ...rest }, ref,
) {
  const wiring = useFieldWiring()
  const ownId = useId()
  // Inside a Field, the FIELD's label is the accessible name. Rendering our own as well points two
  // labels at one control, and the name becomes both of them concatenated - which axe reports as
  // `form-field-multiple-labels`, and only as "incomplete", so it sat below every threshold.
  const ownLabel = label !== undefined && !wiring
  const input = (
    <input
      ref={ref}
      type="checkbox"
      role="switch"
      className={cx('clara-switch', className)}
      {...fieldAriaProps(wiring, 'toggle')}
      // See Checkbox: aria-disabled does not stop a toggle by itself (D0058).
      onClick={fieldChangeGuard(wiring, onClick)}
      // The change goes through the guard as well as the click - see fieldChangeGuard.
      onChange={fieldChangeGuard(wiring, onChange)}
      {...(ownLabel ? { id: ownId } : {})}
      {...rest}
    />
  )
  return ownLabel
    ? (
      <span className="clara-choice">
        {input}
        <label className="clara-choice__label" htmlFor={ownId}>{label}</label>
      </span>
      )
    : input
})
