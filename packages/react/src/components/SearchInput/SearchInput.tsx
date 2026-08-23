import { forwardRef, type InputHTMLAttributes } from 'react'
import { cx } from '../../lib/cx'
import { fieldAriaProps, useFieldWiring } from '../../lib/field-context'

/**
 * A search input.
 *
 * `type="search"` so browsers and assistive technology treat it as one, and `role="searchbox"`
 * comes with that for free. Still requires a Field label - "search" as a placeholder is the same
 * defect as any other placeholder-as-label, and the commonest place people commit it.
 */
export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput (
  { className, ...rest }, ref,
) {
  const wiring = useFieldWiring()
  return (
    <input
      ref={ref}
      type="search"
      className={cx('clara-input', 'clara-input--search', className)}
      {...fieldAriaProps(wiring)}
      {...rest}
    />
  )
})
