import { forwardRef, useRef, useState, type InputHTMLAttributes, type MutableRefObject } from 'react'
import { cx } from '../../lib/cx'
import { fieldAriaProps, fieldDisabled, useFieldWiring } from '../../lib/field-context'

/**
 * A search input.
 *
 * `type="search"` so browsers and assistive technology treat it as one. It still requires a Field
 * label - "Search" as a placeholder is the same defect as any other placeholder-as-label, and this
 * is the commonest place people commit it.
 *
 * Clearing RETURNS FOCUS to the input. A clear button that leaves focus on itself strands a
 * keyboard user on a control that has just disappeared, and their next keystroke goes nowhere.
 *
 * Debouncing is deliberately the consumer's: how long to wait before searching depends on what the
 * search costs, which this component cannot know.
 */
export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  /** Show a clear button when there is a value. Its accessible name is "Clear search". */
  clearable?: boolean
  /**
   * Called after the value is cleared and focus has returned to the input. Use it to re-run the
   * search with an empty query; it is not needed to clear the value itself.
   */
  onClear?: () => void
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput (
  { clearable = true, onClear, className, disabled = false, ...rest }, ref,
) {
  const wiring = useFieldWiring()
  const inner = useRef<HTMLInputElement | null>(null)
  // The button was rendered whenever `clearable`, so every EMPTY search field shipped a permanent
  // "Clear search" tab stop that did nothing - while the prop doc and the docs page both said it
  // appears only when there is a value. Tracking emptiness is what makes those true.
  const controlled = rest.value !== undefined
  const [typed, setTyped] = useState(() => String(rest.defaultValue ?? ''))
  const hasValue = (controlled ? String(rest.value ?? '') : typed).length > 0

  const clear = () => {
    if (fieldDisabled(wiring, disabled)) return
    const el = inner.current
    if (el) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(el, '')
      el.dispatchEvent(new Event('input', { bubbles: true }))
      if (!controlled) setTyped('')
      // Focus returns to the INPUT: the button is about to be removed from the page, and a
      // keyboard user left standing on it has nothing to arrow to.
      el.focus()
    }
    onClear?.()
  }

  return (
    <span className="clara-search">
      <input
        ref={(node) => {
          inner.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) (ref as MutableRefObject<HTMLInputElement | null>).current = node
        }}
        type="search"
        className={cx('clara-input', 'clara-input--search', className)}
        {...fieldAriaProps(wiring, 'text', disabled)}
        {...rest}
        onChange={(event) => {
          if (!controlled) setTyped(event.currentTarget.value)
          rest.onChange?.(event)
        }}
      />
      {clearable && hasValue ? (
        <button type="button" className="clara-search__clear" onClick={clear} aria-disabled={wiring?.disabled || undefined}>
          Clear search
        </button>
      ) : null}
    </span>
  )
})
