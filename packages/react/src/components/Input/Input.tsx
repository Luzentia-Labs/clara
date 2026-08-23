import { forwardRef, type InputHTMLAttributes } from 'react'
import { cx } from '../../lib/cx'
import { fieldAriaProps, useFieldWiring } from '../../lib/field-context'

/**
 * A single-line text input.
 *
 * Takes no `label` prop. The label belongs to the Field, and offering both would let a consumer
 * set one on each and produce a control with two names - or, worse, rely on `placeholder`, which
 * disappears the moment the user types. In a dense ERP form that is unrecoverable.
 */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'size'> {
  /** Visual size. Not the HTML `size` attribute, which counts characters. */
  size?: 'sm' | 'md'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input (
  { size = 'md', className, type = 'text', ...rest }, ref,
) {
  const wiring = useFieldWiring()
  return (
    <input
      ref={ref}
      type={type}
      className={cx('clara-input', `clara-input--${size}`, className)}
      {...fieldAriaProps(wiring)}
      {...rest}
    />
  )
})
