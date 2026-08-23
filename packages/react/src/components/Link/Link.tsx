import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react'
import { cx } from '../../lib/cx'

/**
 * A link.
 *
 * Not polymorphic and not `as`-able to a button: a link navigates and a button acts, and the
 * distinction is what decides whether Enter or Space activates it, whether it appears in the
 * browser's link list, and whether middle-click opens a tab. Blurring it is a common and
 * expensive accessibility defect, so the API does not offer it.
 *
 * Underlined by default, and that is not styling. Colour alone cannot distinguish a link (WCAG
 * 1.4.1) - a user with a colour vision deficiency, or reading a printed page, sees no link at all.
 * The underline is the affordance; the colour is reinforcement.
 *
 * `external` adds the affordance rather than only the behaviour - a link that opens a new tab
 * without saying so takes control away from the user (WCAG 3.2.5).
 */
export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  children?: ReactNode
  href: string
  external?: boolean
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link (
  { children, href, external = false, className, ...rest }, ref,
) {
  return (
    <a
      ref={ref}
      href={href}
      className={cx('clara-link', className)}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {children}
      {external ? <span className="clara-link__external">(opens in a new tab)</span> : null}
    </a>
  )
})
