import { forwardRef } from 'react'
import { cx } from '../../lib/cx'

/**
 * A separator.
 *
 * Not polymorphic, deliberately: `<hr>` carries the `separator` role and the semantics are the
 * point. Rendering it as a `div` would make it decoration, which is a different thing.
 *
 * `decorative` exists for the case where the rule is genuinely presentational - a visual break
 * between two halves of one control - and it hides it from assistive technology rather than
 * announcing a separator that means nothing.
 */
export interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  /** Hide from assistive technology, for a rule that carries no meaning. */
  decorative?: boolean
  className?: string
}

export const Divider = forwardRef<HTMLHRElement, DividerProps>(function Divider (
  { orientation = 'horizontal', decorative = false, className }, ref,
) {
  return (
    <hr
      ref={ref}
      className={cx('clara-divider', `clara-divider--${orientation}`, className)}
      {...(decorative
        ? { 'aria-hidden': true }
        : { role: 'separator', 'aria-orientation': orientation })}
    />
  )
})
