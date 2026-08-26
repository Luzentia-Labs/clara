'use client'

import { forwardRef, useId, type ReactNode, type RefObject } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { CloseIcon } from '@luzentialabs/clara-icons'
import { cx } from '../../lib/cx'
import { useOverlayFocusRestore } from '../../lib/overlay-focus'
import { ClaraPortal } from '../../theme/ClaraPortal'
import { IconButton } from '../IconButton/IconButton'

/** Which edge the panel is attached to. Closed set: an arbitrary edge is not a design decision. */
export type DrawerPlacement = 'left' | 'right' | 'bottom'

export interface DrawerProps {
  /** Whether the drawer is on screen. Controlled - Clara never owns this. */
  open: boolean
  /**
   * Called for EVERY dismissal route: Escape, a scrim click, the close button, and whatever the
   * footer does. One callback rather than four, for the reason Modal gives.
   */
  onClose: () => void
  /** The drawer's accessible name. Required: an unnamed dialog is announced as "dialog", nothing more. */
  title: string
  /** Announced after the title. Use it for the consequence of the action, not for instructions. */
  description?: string
  /** The scrolling body. Header and footer stay put around it. */
  children?: ReactNode
  /** Actions. Rendered outside the scroll container, so they are always reachable. */
  footer?: ReactNode
  placement?: DrawerPlacement
  /** The element to focus when it opens. Without it focus goes to the close button. */
  initialFocus?: RefObject<HTMLElement | null>
  /** Where focus returns on close. Defaults to whatever was focused when it opened. */
  returnFocus?: RefObject<HTMLElement | null>
  /**
   * Whether Escape and a scrim click dismiss. `false` for a drawer that must be answered - it does
   * NOT remove the close button, because a drawer with no way out is a trap.
   */
  dismissible?: boolean
  className?: string
}

/**
 * A panel attached to an edge of the viewport: focus goes in, stays in, and comes back.
 *
 * ## Focus parity with Modal is by IDENTITY, not by imitation
 *
 * Both call `useOverlayFocusRestore`. That hook is ~100 lines whose every comment records a defect
 * measured across nine adversarial review rounds - the opener captured in the wrong commit, the
 * restore firing on mount and stealing focus, the unmount route stranding focus on `document.body`,
 * the two-phase ordering that lets a named target beat another overlay's anonymous fallback. A copy
 * would inherit the code and not the reasons. AC2 asks for parity asserted by identity; this is what
 * identity means.
 *
 * ## Motion, and why a Drawer has some where Modal has none
 *
 * D0094 ruled that Modal does not animate, and its argument was specific: a centred dialog has no
 * spatial origin. A drawer has one - it is attached to an edge, and where it came from is where it
 * will go back to. D0100 permits exactly that meaning, so the panel slides in from its own edge at
 * `duration.state-change` with `easing.enter`.
 *
 * It exits instantly, per D0094's pre-commitment, and under `prefers-reduced-motion: reduce` the
 * slide is REMOVED rather than replaced. That is D0100's Class A: the origin is useful but the state
 * change is already carried louder than any slide could carry it - the viewport dims, focus
 * relocates, and the background goes inert.
 */
export const Drawer = forwardRef<HTMLDivElement, DrawerProps>(function Drawer ({
  open, onClose, title, description, children, footer,
  placement = 'right', initialFocus, returnFocus, dismissible = true, className,
}, ref) {
  const titleId = useId()
  const descriptionId = useId()

  const { handleOpenAutoFocus } = useOverlayFocusRestore(open, returnFocus)

  // Radix reports every dismissal as a transition to closed. Clara's contract is one callback for
  // all of them, so this is the single place the two vocabularies meet - and it is internal.
  const handleOpenChange = (next: boolean) => { if (!next) onClose() }

  // `dismissible: false` blocks the two routes that can happen by accident. It deliberately does
  // NOT block the close button.
  const blockIfNotDismissible = (event: Event) => { if (!dismissible) event.preventDefault() }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <ClaraPortal open={open}>
        {/* Siblings in one host, panel after scrim: equal z-index paints in tree order, so the
            panel is over the scrim for free and the whole host stacks by open order (D0088). */}
        <Dialog.Overlay className="clara-drawer__scrim" />
        <Dialog.Content
          ref={ref}
          className={cx('clara-drawer', `clara-drawer--${placement}`, className)}
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          onEscapeKeyDown={blockIfNotDismissible}
          onPointerDownOutside={blockIfNotDismissible}
          onInteractOutside={blockIfNotDismissible}
          onOpenAutoFocus={(event) => handleOpenAutoFocus(event, initialFocus)}
          // Clara restores focus itself, in the shared hook. Radix's restore runs against a portal
          // host Clara has already removed, so letting it also try means two mechanisms racing.
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <div className="clara-drawer__header">
            <Dialog.Title id={titleId} className="clara-drawer__title">{title}</Dialog.Title>
            {/* No `onClick={onClose}`: `Dialog.Close` already routes through `onOpenChange`, and
                adding one called `onClose` twice on this route - which a consumer notices as a
                double-submitted form, not as a focus bug. */}
            <Dialog.Close asChild>
              <IconButton icon={<CloseIcon />} label="Close" variant="secondary" />
            </Dialog.Close>
          </div>
          {description
            ? <Dialog.Description id={descriptionId} className="clara-drawer__description">{description}</Dialog.Description>
            : null}
          <div className="clara-drawer__body">{children}</div>
          {footer ? <div className="clara-drawer__footer">{footer}</div> : null}
        </Dialog.Content>
      </ClaraPortal>
    </Dialog.Root>
  )
})
