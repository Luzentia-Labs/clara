'use client'

import { type ReactNode } from 'react'
import * as RadixToast from '@radix-ui/react-toast'
import { cx } from '../../lib/cx'
import { ClaraPortal } from '../../theme/ClaraPortal'

/** The intents Clara's semantic colour families cover. */
export type ToastIntent = 'info' | 'success' | 'warning' | 'danger'

export interface ToastProps {
  /** Whether it is on screen. Controlled - Clara never owns this. */
  open: boolean
  /** Called for every dismissal route: the close button, a swipe, and the auto-dismiss timer. */
  onClose: () => void
  /**
   * What kind of news this is. Drives BOTH the live-region politeness and whether it auto-dismisses,
   * because those two decisions have the same answer for the same reason - see the component note.
   */
  intent?: ToastIntent
  /** The headline. Required: a toast with no title is a coloured rectangle. */
  title: string
  /** The detail, if the title cannot carry it alone. */
  description?: string
  /**
   * One action - "Retry", "Undo", "View".
   *
   * Its accessible name has to be complete on its own. A toast is transient, so an action whose
   * label needs explaining is the wrong action: put it behind "View", which opens a surface with
   * room to explain.
   */
  action?: ReactNode
  /** The accessible name of the close button. Defaults to "Close". */
  closeLabel?: string
  className?: string
}

/**
 * The word joined to the accessible name, so the intent never rests on colour alone.
 *
 * The same rule Badge and Alert follow. A red toast and a green toast are the same announcement to
 * anyone who cannot separate the two hues, and to everyone using a screen reader.
 */
const INTENT_WORD: Record<ToastIntent, string> = {
  info: 'Information',
  success: 'Success',
  warning: 'Warning',
  danger: 'Error',
}

/**
 * A transient notification that is announced, and that never disappears before it is read.
 *
 * ## Politeness and persistence are ONE decision, not two
 *
 * `danger` is announced assertively AND does not auto-dismiss. Those look like two independent
 * choices and are not: both follow from the same fact, which is that an error is the one kind of
 * toast whose content the user has to act on. Announcing an error politely means it waits behind
 * whatever is already speaking, by which time the toast may be gone; auto-dismissing it means the
 * information is destroyed on a timer the reader did not set. Splitting them into two props would
 * let a consumer pick the incoherent half - an assertive toast that vanishes, or a persistent one
 * nobody is told about - so `intent` decides both (D0102).
 *
 * Everything else announces politely and dismisses after Radix's default 5 s, which the viewport
 * PAUSES on hover and on focus.
 *
 * ## It shares one layer with Tooltip, and open order decides (D0102)
 *
 * `--clara-layer-toast` and `--clara-layer-tooltip` are the same layer deliberately. A toast
 * arriving over an open tooltip must paint above it, and a tooltip opened on a toast's own action
 * must paint above the toast. Those are opposite directions, so no constant satisfies both and DOM
 * order - which the browser already resolves - is the only mechanism that does.
 *
 * ## Known residual, accepted (D0102)
 *
 * A toast arriving into a viewport whose host is already on the page is a later toast in an EARLIER
 * sibling, so a tooltip opened in between can cover it. The obvious fix - re-appending the viewport
 * host so it is last - is worse than the defect: moving a live DOM node re-parents its subtree,
 * which resets focus and remounts anything stateful inside it.
 */
export function Toast ({
  open, onClose, intent = 'info', title, description, action, closeLabel = 'Close', className,
}: ToastProps) {
  const isError = intent === 'danger'

  return (
    <RadixToast.Provider
      // `foreground` is Radix's name for an assertive live region, `background` for a polite one.
      // The mapping is made here, once, so no Radix vocabulary reaches Clara's surface.
      swipeDirection="right"
    >
      <ClaraPortal open={open}>
        <RadixToast.Viewport className="clara-toast__viewport" />
        <RadixToast.Root
          className={cx('clara-toast', `clara-toast--${intent}`, className)}
          open={open}
          onOpenChange={(next) => { if (!next) onClose() }}
          type={isError ? 'foreground' : 'background'}
          // `Infinity` is Radix's documented way to disable the timer outright, rather than a very
          // large number that would still fire on a machine left open overnight.
          //
          // Spread rather than passed as `undefined`: under `exactOptionalPropertyTypes` an explicit
          // `undefined` is not the same as an absent prop, and Radix's own default (5 s) only
          // applies when the prop is ABSENT.
          {...(isError ? { duration: Infinity } : {})}
        >
          <RadixToast.Title className="clara-toast__title">
            <span className="clara-visually-hidden">{INTENT_WORD[intent]}: </span>
            {title}
          </RadixToast.Title>
          {description && (
            <RadixToast.Description className="clara-toast__description">
              {description}
            </RadixToast.Description>
          )}
          {action && <RadixToast.Action asChild altText={title}>{action}</RadixToast.Action>}
          <RadixToast.Close className="clara-toast__close" aria-label={closeLabel}>
            <span aria-hidden="true">&times;</span>
          </RadixToast.Close>
        </RadixToast.Root>
      </ClaraPortal>
    </RadixToast.Provider>
  )
}
