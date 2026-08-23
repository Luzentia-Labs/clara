import { useState, type ElementType, type ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { polymorphicForwardRef } from '../../lib/polymorphic'
import type { PolymorphicPropsWithRef, PolymorphicRef } from '../../lib/polymorphic'

/**
 * Client-only: its public props include a function and it holds pressed state.
 *
 * `disabled` is rendered as `aria-disabled`, NOT the `disabled` attribute (D0028). A natively
 * disabled control is removed from the tab order, so a keyboard user can never reach it - and in an
 * ERP a form is frequently mostly disabled, with the reason ("approved records cannot be edited")
 * attached to the control they cannot reach. Keeping it focusable keeps the explanation reachable.
 * The trade is that activation must be suppressed in the handler, which is what `isInert` does.
 */
export interface ButtonOwnProps {
  children?: ReactNode
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md'
  disabled?: boolean
  /**
   * In flight. Sets `aria-busy`, suppresses activation, and PRESERVES the button's width - a
   * button that shrinks to a spinner moves everything beside it, and in a form footer that means
   * the control under the user's cursor changes between the press and the release.
   */
  loading?: boolean
  onClick?: (event: React.MouseEvent) => void
}

export type ButtonProps<C extends ElementType = 'button'> = PolymorphicPropsWithRef<C, ButtonOwnProps>

export const Button = polymorphicForwardRef<ButtonOwnProps, 'button'>(function Button<C extends ElementType = 'button'> (
  { as, children, variant = 'primary', size = 'md', disabled = false, loading = false, onClick, className, ...rest }: ButtonProps<C>,
  ref: PolymorphicRef<C>,
) {
  const [pressed, setPressed] = useState(false)
  const Component = (as ?? 'button') as ElementType
  // Loading is a form of unavailable, so it shares the disabled path rather than inventing a
  // second one that a consumer would have to handle separately.
  const inert = disabled || loading
  return (
    <Component
      ref={ref}
      type={as ? undefined : 'button'}
      className={cx(
        'clara-button', `clara-button--${variant}`, `clara-button--${size}`,
        inert && 'clara-button--disabled', loading && 'clara-button--loading', className,
      )}
      aria-disabled={inert || undefined}
      aria-busy={loading || undefined}
      data-pressed={pressed || undefined}
      onPointerDown={() => !inert && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onClick={(event: React.MouseEvent) => {
        // aria-disabled does not stop activation the way the disabled attribute would, so the
        // handler has to. Preventing default matters for `as="a"`, which would otherwise navigate.
        if (inert) { event.preventDefault(); return }
        onClick?.(event)
      }}
      {...rest}
    >
      {/*
        * The label stays in the DOM while loading, hidden from view but still occupying its width -
        * which is what keeps the button from resizing. Replacing it with a spinner would collapse
        * the button to the spinner's width.
        */}
      <span className={cx('clara-button__label', loading && 'clara-button__label--hidden')}>{children}</span>
      {loading ? <span className="clara-button__spinner" aria-hidden="true" /> : null}
    </Component>
  )
})
