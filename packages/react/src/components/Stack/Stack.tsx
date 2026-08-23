import type { ElementType } from 'react'
import { cx } from '../../lib/cx'
import { polymorphicForwardRef } from '../../lib/polymorphic'
import type { PolymorphicPropsWithRef, PolymorphicRef } from '../../lib/polymorphic'

/**
 * Vertical rhythm. `gap` is a semantic step, so a Stack tightens with density automatically.
 */
export interface StackOwnProps {
  gap?: 'none' | 'sm' | 'md' | 'lg'
  align?: 'start' | 'center' | 'end' | 'stretch'
}

export type StackProps<C extends ElementType = 'div'> = PolymorphicPropsWithRef<C, StackOwnProps>

export const Stack = polymorphicForwardRef<StackOwnProps, 'div'>(function Stack<C extends ElementType = 'div'> (
  { as, gap = 'md', align = 'stretch', className, ...rest }: StackProps<C>,
  ref: PolymorphicRef<C>,
) {
  const Component = (as ?? 'div') as ElementType
  return (
    <Component
      ref={ref}
      className={cx('clara-vertical', `clara-vertical--gap-${gap}`, `clara-vertical--align-${align}`, className)}
      {...rest}
    />
  )
})
