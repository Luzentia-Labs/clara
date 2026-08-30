'use client'

import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

/** The same intents Badge carries, so a status reads identically wherever it appears. */
export type TagIntent = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

interface TagBaseProps {
  intent?: TagIntent
  className?: string
}

/** A tag that is displayed but not removable. Its content may be any node. */
export interface TagStaticProps extends TagBaseProps {
  children: ReactNode
  onRemove?: never
  removeLabel?: never
}

/**
 * A removable tag.
 *
 * `children` narrows to `string` here, and that is the point rather than a limitation: the remove
 * control has to be named for the value it removes ("Remove Overdue", not "Remove"), and a name
 * cannot be derived from an arbitrary `ReactNode`. A screen-reader user moving through a filter bar
 * of eight tags hears eight identical "Remove" buttons otherwise, and has to leave the control to
 * find out which is which.
 */
export interface TagRemovableProps extends TagBaseProps {
  children: string
  onRemove: () => void
  /** Overrides the `Remove <children>` accessible name, for a different word or another language. */
  removeLabel?: string
  /**
   * Marks the remove control unavailable. It KEEPS its tab stop and gains `aria-disabled` rather
   * than the native attribute (D0058, D0064) - a keyboard user has to be able to reach it and learn
   * it is unavailable, which a silently-inert button does not tell them.
   */
  disabled?: boolean
}

export type TagProps = TagStaticProps | TagRemovableProps

const INTENT_WORD: Record<Exclude<TagIntent, 'neutral'>, string> = {
  info: 'Information',
  success: 'Success',
  warning: 'Warning',
  danger: 'Error',
}

/**
 * A compact, optionally removable label - a filter chip, a selected value, an applied facet.
 *
 * Client-only, and not by choice: `onRemove` is a function prop, which TRD Section 7 makes the
 * boundary test. Tag is one component rather than a server `Tag` and a client `RemovableTag`
 * because splitting it would put the choice in the consumer's import statement, where getting it
 * wrong is a build error in an app rather than a decision Clara made.
 */
export function Tag (input: TagProps) {
  const { intent = 'neutral', className } = input
  const removable = input.onRemove !== undefined

  return (
    <span className={cx('clara-tag', `clara-tag--${intent}`, removable && 'clara-tag--removable',
      removable && input.disabled && 'clara-tag--disabled', className)}>
      {intent !== 'neutral' && (
        <span className="clara-visually-hidden">{INTENT_WORD[intent]}: </span>
      )}
      <span className="clara-tag__label">{input.children}</span>
      {removable && (
        <button
          type="button"
          className="clara-tag__remove"
          // Named for what it removes. `children` is a string on this variant precisely so this
          // name can exist without the consumer having to supply it twice.
          aria-label={input.removeLabel ?? `Remove ${input.children}`}
          aria-disabled={input.disabled || undefined}
          onClick={() => { if (!input.disabled) input.onRemove() }}
        >
          {/* aria-hidden: the button already has its name, and "x" read aloud is noise. */}
          <span aria-hidden="true">&times;</span>
        </button>
      )}
    </span>
  )
}
