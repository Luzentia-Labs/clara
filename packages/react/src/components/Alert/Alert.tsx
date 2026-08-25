'use client'

import type { ReactNode } from 'react'
import { CloseIcon, DangerIcon, InfoIcon, SuccessIcon, WarningIcon } from '@luzentialabs/clara-icons'
import { cx } from '../../lib/cx'

/** An alert always has an intent. There is no neutral alert - that is a paragraph. */
export type AlertIntent = 'info' | 'success' | 'warning' | 'danger'

interface AlertBaseProps {
  intent: AlertIntent
  /** A short heading. Omit for a single-sentence alert, where a heading would just repeat it. */
  title?: string
  children: ReactNode
  className?: string
}

export interface AlertStaticProps extends AlertBaseProps {
  onDismiss?: never
  dismissLabel?: never
}

export interface AlertDismissibleProps extends AlertBaseProps {
  onDismiss: () => void
  /** Overrides the "Dismiss" accessible name, for another word or another language. */
  dismissLabel?: string
}

export type AlertProps = AlertStaticProps | AlertDismissibleProps

/**
 * Icon, word, and role per intent.
 *
 * The WORD is what makes this not colour-alone in the accessibility tree, and the ICON is what
 * makes it not colour-alone on screen. Both are needed and neither substitutes: an icon has no
 * accessible name here (it is `aria-hidden`, because the word already says it), and a
 * visually-hidden word paints nothing.
 */
const INTENT = {
  info: { Icon: InfoIcon, word: 'Information', role: 'status' },
  success: { Icon: SuccessIcon, word: 'Success', role: 'status' },
  warning: { Icon: WarningIcon, word: 'Warning', role: 'alert' },
  danger: { Icon: DangerIcon, word: 'Error', role: 'alert' },
} as const

/**
 * A banner carrying an intent - a form-level error, a saved confirmation, a policy warning.
 *
 * **Why `role` differs by intent.** `alert` is an assertive live region: it interrupts whatever a
 * screen reader is saying. That is right for an error the user must act on and wrong for a
 * confirmation, which should wait its turn - so `danger` and `warning` announce assertively and
 * `info` and `success` politely. Grace hears "Error: three invoices could not be posted" the moment
 * it appears, and hears "Saved" when she next pauses.
 *
 * Client-only: `onDismiss` is a function prop, which TRD Section 7 makes the boundary test. A
 * non-dismissible Alert would be server-capable, and `client-boundary.json` has recorded that
 * distinction since before this was built - it stays one component for the reason Tag does.
 */
export function Alert (input: AlertProps) {
  const { intent, title, className } = input
  const { Icon, word, role } = INTENT[intent]
  const dismissible = input.onDismiss !== undefined

  return (
    <div className={cx('clara-alert', `clara-alert--${intent}`, className)} role={role}>
      {/* Unlabelled, so `Icon` marks it `aria-hidden` itself - the intent is already in the
          accessible name as a word, one line below, and announcing it twice is noise. */}
      <Icon className="clara-alert__icon" />
      <div className="clara-alert__body">
        <span className="clara-visually-hidden">{word}: </span>
        {title !== undefined && <p className="clara-alert__title">{title}</p>}
        <div className="clara-alert__content">{input.children}</div>
      </div>
      {dismissible && (
        <button
          type="button"
          className="clara-alert__dismiss"
          aria-label={input.dismissLabel ?? 'Dismiss'}
          onClick={input.onDismiss}
        >
          <CloseIcon />
        </button>
      )}
    </div>
  )
}
