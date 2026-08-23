import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react'
import { cx } from '../../lib/cx'
import { fieldAriaProps, useFieldWiring } from '../../lib/field-context'

/**
 * A password input with a reveal toggle.
 *
 * The toggle is a real button, in the tab order, with a name that says what it will DO next -
 * "Show password" / "Hide password". A control named for its current state leaves the user
 * guessing what pressing it achieves.
 *
 * `aria-pressed` is deliberately absent: this is not a toggle button reporting a state, it is a
 * button whose label changes. Announcing both the changed name and a pressed state says the same
 * thing twice, differently.
 */
export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput (
  { className, ...rest }, ref,
) {
  const wiring = useFieldWiring()
  const [revealed, setRevealed] = useState(false)
  const toggleId = useId()
  return (
    <span className="clara-password">
      <input
        ref={ref}
        type={revealed ? 'text' : 'password'}
        className={cx('clara-input', className)}
        {...fieldAriaProps(wiring)}
        {...rest}
      />
      <button
        type="button"
        id={toggleId}
        className="clara-password__toggle"
        onClick={() => setRevealed((v) => !v)}
        disabled={wiring?.disabled}
      >
        {revealed ? 'Hide password' : 'Show password'}
      </button>
    </span>
  )
})
