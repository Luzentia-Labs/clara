import type { ElementType } from 'react'
import { cx } from '../../lib/cx'
import { polymorphicForwardRef } from '../../lib/polymorphic'
import type { PolymorphicPropsWithRef, PolymorphicRef } from '../../lib/polymorphic'

/**
 * Horizontal flow that wraps. `gap` doubles as the adjacent-target spacing when the children are
 * interactive, which is what keeps two chips from touching (WCAG 2.5.8, D0037).
 */
export interface InlineOwnProps {
  gap?: 'none' | 'sm' | 'md' | 'lg'
  align?: 'start' | 'center' | 'end' | 'stretch'
}

export type InlineProps<C extends ElementType = 'div'> = PolymorphicPropsWithRef<C, InlineOwnProps>

export const Inline = polymorphicForwardRef<InlineOwnProps, 'div'>(function Inline<C extends ElementType = 'div'> (
  { as, gap = 'md', align = 'stretch', className, ...rest }: InlineProps<C>,
  ref: PolymorphicRef<C>,
) {
  const Component = (as ?? 'div') as ElementType
  return (
    <Component
      ref={ref}
      className={cx('clara-horizontal', `clara-horizontal--gap-${gap}`, `clara-horizontal--align-${align}`, className)}
      {...rest}
    />
  )
})
