import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

/**
 * Server-capable: no function props, no state, no browser APIs.
 *
 * `level` and `size` are SEPARATE props on purpose. A heading's level is document structure - screen
 * reader users navigate by it, and skipping from h2 to h4 breaks that outline. Its size is visual
 * emphasis. Tying them together forces a choice between a correct outline and a correct-looking
 * page, and in an ERP the page usually wins, which is how heading order gets broken.
 */
export interface HeadingProps {
  children?: ReactNode
  /** Document structure. Choose this for the outline, not for the appearance. */
  level: 1 | 2 | 3 | 4 | 5 | 6
  /** Visual size. Defaults to the level's natural size when omitted. */
  size?: 'sm' | 'md' | 'lg'
}

const NATURAL: Record<number, 'sm' | 'md' | 'lg'> = { 1: 'lg', 2: 'lg', 3: 'md', 4: 'md', 5: 'sm', 6: 'sm' }

export function Heading ({ children, level, size }: HeadingProps) {
  const Tag = `h${level}` as const
  return <Tag className={cx('clara-heading', `clara-heading--${size ?? NATURAL[level]}`)}>{children}</Tag>
}
