import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

/**
 * Server-capable: no function props, no state, no browser APIs.
 */
export interface TextProps {
  children?: ReactNode
  /** Body is the default; caption is the smaller step. Size never changes with density. */
  size?: 'body' | 'body-lg' | 'caption'
  tone?: 'default' | 'muted'
  /**
   * Figures that line up in columns. Tabular numerals give every digit the same advance width, so
   * a column of amounts aligns without a monospace font - which in an ERP is most columns.
   */
  numeric?: boolean
  /**
   * Truncate to one line. Requires `fullValue`, because a truncated value a keyboard user cannot
   * recover is a value they cannot read: `title` only appears on hover, and a non-focusable element
   * is unreachable without a pointer (PRD, D0028). Truncating makes the element focusable and gives
   * it the full text as its accessible name.
   */
  truncate?: boolean
  /** The untruncated text. Required when `truncate` is set. */
  fullValue?: string
}

export function Text ({ children, size = 'body', tone = 'default', numeric, truncate, fullValue }: TextProps) {
  const recoverable = truncate
    ? { tabIndex: 0, title: fullValue, 'aria-label': fullValue }
    : {}
  return (
    <span
      className={cx(
        'clara-text',
        `clara-text--${size}`,
        tone === 'muted' && 'clara-text--muted',
        numeric && 'clara-text--numeric',
        truncate && 'clara-text--truncate',
      )}
      {...recoverable}
    >
      {children}
    </span>
  )
}
