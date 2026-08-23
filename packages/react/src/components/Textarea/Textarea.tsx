import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cx } from '../../lib/cx'
import { fieldAriaProps, useFieldWiring } from '../../lib/field-context'

/**
 * A multi-line text input.
 *
 * `rows` is a real prop rather than a CSS height because it is what a keyboard user's scroll and a
 * screen reader's line count are computed from.
 */
export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  rows?: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea (
  { rows = 3, className, ...rest }, ref,
) {
  const wiring = useFieldWiring()
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cx('clara-input', 'clara-textarea', className)}
      {...fieldAriaProps(wiring)}
      {...rest}
    />
  )
})
