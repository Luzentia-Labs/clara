import type { ElementType } from 'react'
import { cx } from '../../lib/cx'
import { polymorphicForwardRef } from '../../lib/polymorphic'
import type { PolymorphicPropsWithRef, PolymorphicRef } from '../../lib/polymorphic'

/**
 * A column grid. `columns` is a closed set because an ERP form is a small number of column counts
 * used consistently, not an arbitrary number chosen per screen.
 */
export interface GridOwnProps {
  columns?: 1 | 2 | 3 | 4 | 6 | 12
  gap?: 'none' | 'sm' | 'md' | 'lg'
}

export type GridProps<C extends ElementType = 'div'> = PolymorphicPropsWithRef<C, GridOwnProps>

export const Grid = polymorphicForwardRef<GridOwnProps, 'div'>(function Grid<C extends ElementType = 'div'> (
  { as, columns = 12, gap = 'md', className, ...rest }: GridProps<C>,
  ref: PolymorphicRef<C>,
) {
  const Component = (as ?? 'div') as ElementType
  return (
    <Component
      ref={ref}
      className={cx('clara-grid', `clara-grid--cols-${columns}`, `clara-grid--gap-${gap}`, className)}
      {...rest}
    />
  )
})
