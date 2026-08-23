import { forwardRef, useEffect, useRef, type InputHTMLAttributes, type MutableRefObject } from 'react'
import { cx } from '../../lib/cx'
import { fieldAriaProps, useFieldWiring } from '../../lib/field-context'

/**
 * A checkbox.
 *
 * `indeterminate` is a DOM property, not an attribute - React cannot set it through JSX, so it is
 * applied in an effect against the real node. Getting this wrong produces a "select all" that
 * looks unchecked while reporting mixed, which is how a partially-selected table lies about what
 * a bulk action will affect.
 */
export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  /** Neither checked nor unchecked - some of the things below are selected. */
  indeterminate?: boolean
  label?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox (
  { indeterminate = false, label, className, ...rest }, ref,
) {
  const wiring = useFieldWiring()
  // `| null` in the generic is what makes `current` writable - useRef<T>(null) yields a
  // RefObject whose current is readonly.
  const inner = useRef<HTMLInputElement | null>(null)
  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate
  }, [indeterminate])
  const input = (
    <input
      // Two refs on one node: ours to set `indeterminate`, and the consumer's. A callback ref is
      // the only way to serve both, and `MutableRefObject` is the honest type for the object form -
      // React's own `RefObject.current` is readonly, which is why the naive assignment does not
      // compile.
      ref={(node) => {
        inner.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) (ref as MutableRefObject<HTMLInputElement | null>).current = node
      }}
      type="checkbox"
      className={cx('clara-checkbox', className)}
      aria-checked={indeterminate ? 'mixed' : undefined}
      {...fieldAriaProps(wiring)}
      {...rest}
    />
  )
  // Used inside a CheckboxGroup each box carries its OWN label, because the group's label names
  // the question and each box names an answer.
  return label ? <span className="clara-choice">{input}<span className="clara-choice__label">{label}</span></span> : input
})
