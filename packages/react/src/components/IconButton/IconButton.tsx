import { forwardRef, type ReactNode } from 'react'
import { Button, type ButtonOwnProps } from '../Button/Button'

/**
 * A button whose content is an icon.
 *
 * `label` is REQUIRED, not optional. An icon-only button with no accessible name is invisible to a
 * screen reader, and it is the most common accessibility defect in an ERP toolbar - precisely
 * because the control looks finished. Making the name a required prop means the omission is a
 * compile error rather than an audit finding.
 *
 * The icon itself is hidden from assistive technology: the label already carries the meaning, and
 * announcing both reads the control twice.
 */
export interface IconButtonProps extends Omit<ButtonOwnProps, 'children'> {
  /** The accessible name. Required - an icon carries no name of its own. */
  label: string
  icon: ReactNode
  className?: string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton (
  { label, icon, className, ...rest }, ref,
) {
  return (
    <Button ref={ref} aria-label={label} className={className} {...rest}>
      <span aria-hidden="true" className="clara-icon-button__icon">{icon}</span>
    </Button>
  )
})
