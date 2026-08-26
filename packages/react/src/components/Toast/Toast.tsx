'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import * as RadixToast from '@radix-ui/react-toast'
import { cx } from '../../lib/cx'
import { ClaraPortal } from '../../theme/ClaraPortal'
import { claimToastId, publishToast, retractToast, useIsToastHost, useToastEntries } from './toast-store'

/*
 * A PASSIVE effect, deliberately - not `useLayoutEffect`.
 *
 * The orphaned-entry defect that round 2 fixed is about effect phase versus RENDER phase: an effect
 * of either kind is skipped for a render React discards, and that is the whole property. Layout
 * timing was never what fixed it, and an earlier comment here said it was. A review settled it by
 * measuring both effects passive with all three discarded-render regression tests still green.
 *
 * Asking for layout timing anyway cost something real: `useLayoutEffect` warns on every server
 * render ("useLayoutEffect does nothing on the server"), measured at 208 warnings across 203 server
 * renders of a Toast where the previous passive version produced none. PRD F23 has this library
 * rendering on the server, and a component that fills the log on every request teaches its
 * consumers to ignore the log.
 *
 * `ClaraPortal` guards the same hazard with `typeof document === 'undefined' ? useEffect :
 * useLayoutEffect`, which is right THERE because it genuinely needs the host to exist before paint.
 * That guard cannot help here anyway: `renderToStaticMarkup` runs under jsdom in this repo's own
 * tests, where `document` is defined, so the module-level check picks layout during a server render.
 * The store has no paint to beat, so the simpler answer is the correct one.
 */

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
 * The shared provider and viewport, rendered exactly once by whichever toast currently owns it.
 *
 * `open` is driven by whether ANY toast is open, not a constant - a constant would append the host
 * at mount and leave a fixed empty region on every page that imports a Toast, and
 * `check-overlay-contract` refuses it for the stacking reason recorded there.
 */
function ToastHost () {
  const entries = useToastEntries()
  const anyOpen = entries.some((entry) => entry.isOpen)

  return (
    <RadixToast.Provider swipeDirection="right">
      <ClaraPortal open={anyOpen}>
        <RadixToast.Viewport className="clara-toast__viewport" />
        {entries.map((entry) => entry.node)}
      </ClaraPortal>
    </RadixToast.Provider>
  )
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
  const idRef = useRef<number | null>(null)
  idRef.current ??= claimToastId()
  const id = idRef.current

  const isHost = useIsToastHost(id)

  const root = (
    <RadixToast.Root
      key={id}
      className={cx('clara-toast', `clara-toast--${intent}`, className)}
      open={open}
      onOpenChange={(next) => { if (!next) onClose() }}
      type={isError ? 'foreground' : 'background'}
      // `Infinity` is Radix's documented way to disable the timer outright, rather than a very
      // large number that would still fire on a machine left open overnight.
      //
      // Spread rather than passed as `undefined`: under `exactOptionalPropertyTypes` an explicit
      // `undefined` is not the same as an absent prop, and Radix's own default (5 s) only applies
      // when the prop is ABSENT.
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
  )

  /*
   * Published in a LAYOUT EFFECT, never during render.
   *
   * Publishing during render looked harmless - it is just a `Map` write - and it made `<Toast>`
   * render nothing at all, permanently, on any page with a Suspense boundary.
   *
   * React re-invokes a component body with fresh hook state on a render it then DISCARDS, which
   * StrictMode does deliberately and any suspended sibling does in production. `idRef` was claimed
   * during render, so the discarded pass claimed a SECOND id and published under it, while the
   * cleanup closed over only the surviving one. The first entry was orphaned - and because
   * ownership is `entries[0].id`, the dead orphan owned the shared host forever. Nothing rendered
   * it and nothing could remove it, so every subsequent toast on that page rendered nothing.
   * Measured under StrictMode and, separately, with a suspended sibling and no StrictMode.
   *
   * An EFFECT of either kind never runs for a discarded render, so no orphan is created. That is
   * the property that matters here - not layout timing, which a review confirmed by measuring both
   * effects passive with all three regression tests still green. It also fixes the
   * second symptom of the same cause: `emit()` during render synchronously notified
   * `useSyncExternalStore` subscribers mid-render, producing React's "Cannot update a component
   * while rendering a different component" warning on every prop change - silent, because nothing
   * fails a test on `console.error`.
   *
   * No dependency array: this must re-publish on EVERY commit, so the node the host renders closes
   * over current props. Publishing once would freeze a toast's title at its first value.
   */
  useEffect(() => { publishToast(id, root, open) })

  useEffect(() => () => { retractToast(id) }, [id])

  // Exactly one toast renders the shared provider and viewport; the rest render nothing of their
  // own, because their content is rendered by the host. That is the whole fix: one viewport, one
  // stack, in arrival order.
  return isHost ? <ToastHost /> : null
}
