import type { ElementType } from 'react'
import { cx } from '../../lib/cx'
import { polymorphicForwardRef } from '../../lib/polymorphic'
import type { PolymorphicPropsWithRef, PolymorphicRef } from '../../lib/polymorphic'

/**
 * Server-capable: no function props, no state, no browser APIs.
 *
 * The spacing scale is a closed set rather than a number, so `padding` cannot drift off the
 * density system - a raw value would look identical and stop responding to density.
 */
export interface BoxOwnProps {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export type BoxProps<C extends ElementType = 'div'> = PolymorphicPropsWithRef<C, BoxOwnProps>

export const Box = polymorphicForwardRef<BoxOwnProps, 'div'>(function Box<C extends ElementType = 'div'> (
  { as, padding = 'none', className, ...rest }: BoxProps<C>,
  ref: PolymorphicRef<C>,
) {
  const Component = (as ?? 'div') as ElementType
  return <Component ref={ref} className={cx('clara-box', `clara-box--${padding}`, className)} {...rest} />
})
