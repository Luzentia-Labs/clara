import { forwardRef, useId, useRef, useState, type InputHTMLAttributes, type MutableRefObject, type ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { fieldAriaProps, fieldDisabled, useFieldWiring } from '../../lib/field-context'

/**
 * A single-line text input.
 *
 * Takes no `label` prop. The label belongs to the Field, and offering both would let a consumer
 * set one on each and produce a control with two names - or, worse, rely on `placeholder`, which
 * disappears the moment the user types. In a dense ERP form that is unrecoverable.
 */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'size' | 'prefix'> {
  /** Visual size. Not the HTML `size` attribute, which counts characters. */
  size?: 'sm' | 'md'
  /**
   * Fixed content before the field - a currency symbol, a scheme, a unit.
   *
   * Decoration, not a control: it is `aria-hidden`, because a screen reader reading "pound, Amount,
   * edit text" ahead of every amount is noise. When the prefix carries MEANING the field does not
   * otherwise convey, put it in the Field's `description`, where it is announced once and read.
   */
  prefix?: ReactNode
  /** Fixed content after the field. Same rules as `prefix`. */
  suffix?: ReactNode
  /**
   * Show a clear button when there is a value.
   *
   * Its accessible name composes the word "Clear" with the Field's own label, so a form with
   * several clearable inputs does not present a row of identical "Clear" buttons that a screen
   * reader user has to disambiguate by position.
   */
  clearable?: boolean
  /** Called after the value is cleared and focus has returned to the input. */
  onClear?: () => void
  /**
   * Show a live character count against this limit.
   *
   * It does NOT set `maxLength`. A hard cut-off silently discards a paste, which is how a user
   * loses the end of a pasted reference without noticing; the count tells them where they are and
   * the form decides what to do about it. The count is announced politely, and only once the user
   * is near the limit - a live region that fires on every keystroke is unusable.
   */
  maxCount?: number
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input (
  { size = 'md', className, type = 'text', prefix, suffix, clearable = false, onClear, maxCount, onChange, ...rest }, ref,
) {
  const wiring = useFieldWiring()
  const inner = useRef<HTMLInputElement | null>(null)
  const countId = useId()
  const controlled = rest.value !== undefined
  const [typed, setTyped] = useState(() => String(rest.defaultValue ?? ''))
  const current = controlled ? String(rest.value ?? '') : typed
  const decorated = prefix !== undefined || suffix !== undefined || clearable || maxCount !== undefined

  const clear = () => {
    if (fieldDisabled(wiring)) return
    const el = inner.current
    if (el) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(el, '')
      el.dispatchEvent(new Event('input', { bubbles: true }))
      if (!controlled) setTyped('')
      // Focus returns to the input: the button is about to be removed from the page.
      el.focus()
    }
    onClear?.()
  }

  const aria: Record<string, unknown> = fieldAriaProps(wiring)
  const describedBy = [aria['aria-describedby'] as string | undefined, maxCount === undefined ? undefined : countId]
    .filter(Boolean).join(' ') || undefined

  const field = (
    <input
      ref={(node) => {
        inner.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) (ref as MutableRefObject<HTMLInputElement | null>).current = node
      }}
      type={type}
      className={cx('clara-input', `clara-input--${size}`, !decorated && className)}
      {...aria}
      aria-describedby={describedBy}
      onChange={(event) => {
        if (!controlled) setTyped(event.currentTarget.value)
        onChange?.(event)
      }}
      {...rest}
    />
  )

  if (!decorated) return field

  const over = maxCount !== undefined && current.length > maxCount
  return (
    <span className={cx('clara-input-group', `clara-input-group--${size}`, className)}>
      {prefix !== undefined ? <span className="clara-input-group__affix" aria-hidden="true">{prefix}</span> : null}
      {field}
      {suffix !== undefined ? <span className="clara-input-group__affix" aria-hidden="true">{suffix}</span> : null}
      {clearable && current.length > 0
        ? (
          <button
            type="button"
            className="clara-input-group__clear"
            id={`${countId}-clear`}
            aria-labelledby={wiring ? `${countId}-clear ${wiring.labelId}` : undefined}
            aria-disabled={fieldDisabled(wiring) || undefined}
            onClick={clear}
          >
            Clear
          </button>
          )
        : null}
      {maxCount !== undefined
        ? (
          <>
            {/*
              * The visible count is NOT a live region. It is read on demand through
              * `aria-describedby`, which is how a count should be reached.
              */}
            <span
              id={countId}
              className={cx('clara-input-group__count', over && 'clara-input-group__count--over')}
            >
              {current.length} of {maxCount}
            </span>
            {/*
              * A separate announcer, always present so assistive technology has registered it, and
              * empty until there is something worth saying. Toggling `aria-live` on the count
              * itself was wrong twice over: a region that appears in the same commit as its text
              * is commonly not announced at all - so the boundary crossing, the one announcement
              * that matters, was the likeliest to be silent - and past the threshold every
              * keystroke rewrote it, which is the behaviour the docs page calls unusable.
              */}
            <span className="clara-visually-hidden" aria-live="polite">
              {over
                ? `${current.length - maxCount} over the limit`
                : current.length === maxCount
                  ? 'limit reached'
                  : ''}
            </span>
          </>
          )
        : null}
    </span>
  )
})
