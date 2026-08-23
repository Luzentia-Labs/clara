import type { ReactNode, SVGProps } from 'react'

/**
 * The base every generated icon renders through.
 *
 * **Decorative by default.** An icon beside a text label that announces itself makes a screen
 * reader read the control twice; an icon that carries meaning alone and says nothing is invisible.
 * The default is the safe one, and `label` is how you opt into the other - which means the
 * accessible name is a deliberate act rather than something inherited by accident.
 *
 * Colour and size are INHERITED (`currentColor`, `1em`) rather than defaulted to a token. An icon
 * sits inside text, so it should take that text's colour and size without being told - a fixed
 * default would need overriding at nearly every call site.
 */
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children' | 'aria-label'> {
  /** The accessible name. Give it only when the icon carries meaning on its own. */
  label?: string
  children?: ReactNode
}

export function Icon ({ label, children, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      {...rest}
    >
      {children}
    </svg>
  )
}
