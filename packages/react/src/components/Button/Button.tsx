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
  disabled?: boolean
  onClick?: (event: React.MouseEvent) => void
}

export type ButtonProps<C extends ElementType = 'button'> = PolymorphicPropsWithRef<C, ButtonOwnProps>

export const Button = polymorphicForwardRef<ButtonOwnProps, 'button'>(function Button<C extends ElementType = 'button'> (
  { as, children, variant = 'primary', disabled = false, onClick, className, ...rest }: ButtonProps<C>,
  ref: PolymorphicRef<C>,
) {
  const [pressed, setPressed] = useState(false)
  const Component = (as ?? 'button') as ElementType
  return (
    <Component
      ref={ref}
      type={as ? undefined : 'button'}
      className={cx('clara-button', `clara-button--${variant}`, disabled && 'clara-button--disabled', className)}
      aria-disabled={disabled || undefined}
      data-pressed={pressed || undefined}
      onPointerDown={() => !disabled && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onClick={(event: React.MouseEvent) => {
        // aria-disabled does not stop activation the way the disabled attribute would, so the
        // handler has to. Preventing default matters for `as="a"`, which would otherwise navigate.
        if (disabled) { event.preventDefault(); return }
        onClick?.(event)
      }}
      {...rest}
    >
      {children}
    </Component>
  )
})
