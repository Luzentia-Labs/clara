import { forwardRef, useRef, useState, type InputHTMLAttributes, type KeyboardEvent, type MutableRefObject } from 'react'
import { cx } from '../../lib/cx'
import { fieldAriaProps, fieldDisabled, useFieldWiring } from '../../lib/field-context'

/**
 * A numeric input.
 *
 * `inputMode="decimal"` on a text input rather than `type="number"`. A number input silently
 * discards what it cannot parse, and strips leading zeros from things that are identifiers rather
 * than quantities - order numbers, account codes, and an ERP is full of them. The value stays a
 * string; validation stays the form's job. Because the control is never `type="number"`, the wheel
 * cannot change it: a page scrolled over a focused field silently editing a figure is the reason
 * `type="number"` has the reputation it has in data entry (D0062). That guarantee comes from the
 * type, not from a handler - an earlier version blurred the control on wheel, which protected
 * against nothing and stole focus from anyone scrolling a long form.
 *
 * Arrow-key stepping is restored deliberately, because dropping `type="number"` loses it.
 *
 * The `aria-value*` contract is applied ONLY when a bound is supplied, and then in full: the role
 * becomes `spinbutton`, which is the only role that supports those properties. They were previously
 * emitted on the implicit `textbox` role, where they are invalid - so no assistive technology
 * announced them, and axe reported it as a critical `aria-allowed-attr` violation while the
 * component's own documentation claimed the bounds were announced. Without a bound the control is
 * an ordinary textbox, which is correct: an account code is not a value in a range.
 */
export interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type' | 'size' | 'min' | 'max' | 'step'> {
  size?: 'sm' | 'md'
  /** Announced unit, e.g. "GBP". Becomes `aria-valuetext` when the control is a spinbutton. */
  unit?: string
  /**
   * The bounds. Supplying either makes the control a `spinbutton`: they are announced as
   * `aria-valuemin` / `aria-valuemax` alongside `aria-valuenow`, and enforced when stepping.
   *
   * Deliberately `number`, not the HTML attribute's `string | number`: a bound that arrives as a
   * string is compared as one, and `"9" > "10"` is true. Narrowing it here makes that unwritable.
   */
  min?: number
  /** See `min`. */
  max?: number
  /** The step applied by Arrow Up and Arrow Down, and by PageUp / PageDown at ten times. Defaults to 1. */
  step?: number
}

/**
 * Round to the precision the step implies. `0.1 + 0.1 + 0.1` is 0.30000000000000004 in binary
 * floating point, and writing seventeen significant digits into a currency field is a defect the
 * user has to clean up by hand.
 */
function atStepPrecision (n: number, step: number): string {
  // `String(step)` switches to exponential notation below 1e-6 - `String(1e-7)` is "1e-7" - so
  // splitting on "." returned undefined and rounding silently stopped for exactly the small steps
  // that need it most. An FX rate at seven or eight decimals is an ordinary ERP case.
  const text = String(step)
  const exponent = /e-(\d+)$/i.exec(text)
  const mantissa = exponent ? (text.split('e')[0]?.split('.')[1] ?? '').length : 0
  const decimals = exponent ? Number(exponent[1]) + mantissa : (text.split('.')[1] ?? '').length
  // Returns a STRING, and formats it here rather than letting the caller do `String(n)`. Rounding
  // to 8 decimals and then stringifying gives back "1.5e-7", because `String` re-exponentiates any
  // small number - so the user would see scientific notation in a currency field. toFixed accepts
  // 0-100; beyond that is past double precision anyway.
  if (!decimals) return String(n)
  // Trim the zeros toFixed pads with, so a 0.1 step on 0.2 reads "0.3" and not "0.3000000".
  return n.toFixed(Math.min(decimals, 100)).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput (
  { size = 'md', unit, min, max, step = 1, className, onChange, onKeyDown, ...rest }, ref,
) {
  const wiring = useFieldWiring()
  const inner = useRef<HTMLInputElement | null>(null)
  const bounded = min !== undefined || max !== undefined

  // `aria-valuenow` has to track the value, so the value has to be observable. A controlled
  // consumer supplies it; an uncontrolled one does not, so the last known value is held here and
  // updated from the same change event React reports.
  const controlled = rest.value !== undefined
  const [seen, setSeen] = useState(() => String(rest.defaultValue ?? ''))
  const current = controlled ? String(rest.value ?? '') : seen
  const asNumber = current.trim() === '' ? Number.NaN : Number(current)

  const clamp = (n: number) => {
    if (min !== undefined && n < min) return min
    if (max !== undefined && n > max) return max
    return n
  }

  const stepBy = (delta: number, event: KeyboardEvent<HTMLInputElement>) => {
    const el = inner.current
    // `readOnly` stops the user TYPING; it does not stop us writing through the native setter, so
    // a disabled control still stepped on every arrow key.
    if (!el || fieldDisabled(wiring)) return
    event.preventDefault()
    const from = Number(el.value)
    const next = atStepPrecision(clamp((Number.isFinite(from) ? from : 0) + delta), step)
    // Set through the native setter so React's onChange fires - assigning `.value` directly does
    // not, and a controlled consumer would never see the step.
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(el, next)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }

  const jumpTo = (bound: number | undefined, event: KeyboardEvent<HTMLInputElement>) => {
    const el = inner.current
    if (!el || bound === undefined || fieldDisabled(wiring)) return
    event.preventDefault()
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(el, String(bound))
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }

  // A spinbutton that announces bounds but offers no way to reach them is half a contract, so the
  // full APG key set travels with the role rather than arrow keys alone.
  const spinbuttonAria = bounded
    ? {
        role: 'spinbutton',
        'aria-valuemin': min,
        'aria-valuemax': max,
        ...(Number.isFinite(asNumber) ? { 'aria-valuenow': asNumber } : {}),
        ...(unit && Number.isFinite(asNumber) ? { 'aria-valuetext': `${current} ${unit}` } : {}),
      }
    : {}

  return (
    <span className="clara-number">
      <input
        ref={(node) => {
          inner.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) (ref as MutableRefObject<HTMLInputElement | null>).current = node
        }}
        type="text"
        inputMode="decimal"
        className={cx('clara-input', `clara-input--${size}`, 'clara-input--numeric', className)}
        {...spinbuttonAria}
        onKeyDown={(event) => {
          if (event.key === 'ArrowUp') stepBy(step, event)
          else if (event.key === 'ArrowDown') stepBy(-step, event)
          else if (event.key === 'PageUp') stepBy(step * 10, event)
          else if (event.key === 'PageDown') stepBy(-step * 10, event)
          else if (event.key === 'Home') jumpTo(min, event)
          else if (event.key === 'End') jumpTo(max, event)
          onKeyDown?.(event)
        }}
        onChange={(event) => {
          if (!controlled) setSeen(event.currentTarget.value)
          onChange?.(event)
        }}
        {...fieldAriaProps(wiring)}
        {...rest}
      />
      {unit ? <span className="clara-number__unit">{unit}</span> : null}
    </span>
  )
})
