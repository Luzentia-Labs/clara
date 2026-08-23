import { forwardRef, type ReactNode } from 'react'
import { cx } from '../../lib/cx'

/**
 * A set of related buttons.
 *
 * `role="group"` with a required `label`: a toolbar of unlabelled buttons is announced as a run of
 * controls with no indication of what they belong to. The label is what makes "Save, Cancel" read
 * as one decision rather than two unrelated ones.
 *
 * `orientation` is VISUAL only. `aria-orientation` is not a supported attribute on `role="group"`
 * - axe reports it as a critical violation, which it did on this component's first run - and it
 * would have been meaningless anyway: a group has no navigation model for an orientation to
 * describe.
 *
 * Deliberately NOT a roving-tabindex toolbar. `role="toolbar"` implies arrow-key navigation and
 * removes the buttons from the tab order, which is right for a dense icon bar and wrong for a form
 * footer - and this component is used for both. A component that silently changes the keyboard
 * model based on its contents would be worse than either.
 */
export interface ButtonGroupProps {
  children?: ReactNode
  /** What the group is for. Required - an unlabelled group of controls announces nothing. */
  label: string
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup (
  { children, label, orientation = 'horizontal', className }, ref,
) {
  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className={cx('clara-button-group', `clara-button-group--${orientation}`, className)}
    >
      {children}
    </div>
  )
})
