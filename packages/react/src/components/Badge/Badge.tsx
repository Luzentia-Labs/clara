import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

/** The intents Clara's semantic colour families cover. `neutral` is the default and adds nothing. */
export type BadgeIntent = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

interface BadgeBaseProps {
  intent?: BadgeIntent
  className?: string
}

/** A badge whose visible text carries the meaning. */
export interface BadgeLabelProps extends BadgeBaseProps {
  children: ReactNode
  count?: never
  countLabel?: never
}

/**
 * A badge carrying a number. `countLabel` is REQUIRED and not optional-with-a-default, because a
 * bare number is the one badge shape where the visible text cannot carry its own meaning: "3" in
 * red and "3" in green differ by colour alone, which is exactly what AC1 exists to prevent.
 */
export interface BadgeCountProps extends BadgeBaseProps {
  count: number
  /** What is being counted, e.g. "overdue invoices". Announced with the number. */
  countLabel: string
  children?: never
}

export type BadgeProps = BadgeLabelProps | BadgeCountProps

/**
 * The intent as a word, joined to the accessible name so the colour is never the only carrier.
 *
 * `neutral` is absent deliberately: it is the default and means "no intent", so announcing it
 * would add a word to every badge that says nothing.
 */
const INTENT_WORD: Record<Exclude<BadgeIntent, 'neutral'>, string> = {
  info: 'Information',
  success: 'Success',
  warning: 'Warning',
  danger: 'Error',
}

/**
 * A small status marker.
 *
 * **What this component can and cannot guarantee about colour.** It guarantees the intent reaches
 * the accessible name, so a screen reader never depends on the colour. It cannot guarantee the
 * VISIBLE text distinguishes two badges: `<Badge intent="danger">Open</Badge>` beside
 * `<Badge intent="success">Open</Badge>` reads identically to a sighted user who cannot separate
 * the two hues, and no API can stop an author writing that. The docs say so plainly rather than
 * implying the component solves WCAG 1.4.1 on the author's behalf.
 */
export function Badge (input: BadgeProps) {
  const { intent = 'neutral', className } = input
  const isCount = input.count !== undefined

  return (
    <span className={cx('clara-badge', `clara-badge--${intent}`, className)}>
      {intent !== 'neutral' && (
        <span className="clara-visually-hidden">{INTENT_WORD[intent]}: </span>
      )}
      {isCount
        ? (
          <>
            <span className="clara-badge__count">{input.count}</span>
            <span className="clara-visually-hidden"> {input.countLabel}</span>
          </>
          )
        : input.children}
    </span>
  )
}
