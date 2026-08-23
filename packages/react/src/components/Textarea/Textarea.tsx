import { forwardRef, useCallback, useLayoutEffect, useRef, type TextareaHTMLAttributes, type MutableRefObject } from 'react'
import { cx } from '../../lib/cx'
import { fieldAriaProps, useFieldWiring } from '../../lib/field-context'

/**
 * A multi-line text input.
 *
 * `rows` is a real attribute rather than a CSS height: it is what a screen reader's line count and
 * a keyboard user's paging are computed from.
 *
 * Auto-resize is BOUNDED by `maxRows`. An unbounded one grows until the submit button is off
 * screen, which in a form is worse than a scrollbar - the user cannot see what they are about to
 * do. Past the bound it scrolls.
 */
export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  rows?: number
  /** Grow with the content, up to this many rows, then scroll. Omit for a fixed height. */
  maxRows?: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea (
  { rows = 3, maxRows, className, onChange, disabled = false, ...rest }, ref,
) {
  const wiring = useFieldWiring()
  const inner = useRef<HTMLTextAreaElement | null>(null)

  const resize = useCallback(() => {
    const el = inner.current
    if (!el || !maxRows) return
    // Measure from a collapsed height, or the box only ever grows.
    el.style.height = 'auto'
    const line = parseFloat(getComputedStyle(el).lineHeight) || 20
    const max = line * maxRows
    el.style.height = `${Math.min(el.scrollHeight, max)}px`
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden'
  }, [maxRows])

  // Layout effect, not effect: resizing after paint is a visible jump on first render. `value` is
  // a dependency because a CONTROLLED value can change without any change event of ours - a form
  // reset, or setValue from the outside - and the box would keep the height it had.
  useLayoutEffect(resize, [resize, rest.value])

  return (
    <textarea
      ref={(node) => {
        inner.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) (ref as MutableRefObject<HTMLTextAreaElement | null>).current = node
      }}
      rows={rows}
      className={cx('clara-input', 'clara-textarea', className)}
      onChange={(event) => { resize(); onChange?.(event) }}
      {...fieldAriaProps(wiring, 'text', disabled)}
      {...rest}
    />
  )
})
