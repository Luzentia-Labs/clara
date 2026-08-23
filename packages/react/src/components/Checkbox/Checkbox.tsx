import { forwardRef, useEffect, useId, useRef, type InputHTMLAttributes, type MutableRefObject } from 'react'
import { cx } from '../../lib/cx'
import { fieldAriaProps, fieldChangeGuard, useFieldWiring } from '../../lib/field-context'

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
  { indeterminate = false, label, className, onClick, onChange, ...rest }, ref,
) {
  const wiring = useFieldWiring()
  const ownId = useId()
  // Inside a Field, the FIELD's label is the accessible name. Rendering our own as well points two
  // labels at one control, and the name becomes both of them concatenated - which axe reports as
  // `form-field-multiple-labels`, and only as "incomplete", so it sat below every threshold.
  const ownLabel = label !== undefined && !wiring
  // `| null` in the generic is what makes `current` writable - useRef<T>(null) yields a
  // RefObject whose current is readonly.
  const inner = useRef<HTMLInputElement | null>(null)
  // `indeterminate` is a DOM property with no HTML attribute, and a CLICK clears it natively
  // without changing the prop. An effect keyed on [indeterminate] therefore never ran again, and
  // the control ended up drawing a tick while still announcing "mixed" - exactly the "select all
  // lies about what a bulk action will affect" failure this code exists to prevent.
  //
  // Two places, because neither alone is enough: the effect (no dependency array) covers every
  // render, and the click handler covers the click itself, which on an uncontrolled checkbox
  // triggers no React render at all.
  const applyIndeterminate = () => { if (inner.current) inner.current.indeterminate = indeterminate }
  useEffect(applyIndeterminate)
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
      {...fieldAriaProps(wiring, 'toggle')}
      // aria-disabled keeps the control reachable but does not stop it toggling, so the click has
      // to be suppressed the way Button suppresses activation (D0058).
      onClick={fieldChangeGuard(wiring, (event: React.MouseEvent<HTMLInputElement>) => {
        // Restore before anything else observes the node: the native toggle has already cleared it.
        applyIndeterminate()
        onClick?.(event)
      })}
      // The change goes through the guard as well as the click - see fieldChangeGuard.
      onChange={fieldChangeGuard(wiring, onChange)}
      {...(ownLabel ? { id: ownId } : {})}
      {...rest}
    />
  )
  // A real <label htmlFor>, not a span: the label text has to be a click target, which is most of
  // the checkbox's usable hit area and the difference between a comfortable control and a 16px one.
  // Inside a group each box carries its own label, because the group's legend names the question
  // and each box names an answer.
  return ownLabel
    ? (
      <span className="clara-choice">
        {input}
        <label className="clara-choice__label" htmlFor={ownId}>{label}</label>
      </span>
      )
    : input
})
