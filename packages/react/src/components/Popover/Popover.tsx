'use client'

import { useId, type ReactNode } from 'react'
import * as RadixPopover from '@radix-ui/react-popover'
import { cx } from '../../lib/cx'
import { ClaraPortal } from '../../theme/ClaraPortal'

/** Which side of the trigger it prefers. It flips when there is no room. */
export type PopoverPlacement = 'top' | 'right' | 'bottom' | 'left'

export interface PopoverProps {
  /** Whether it is on screen. Controlled - Clara never owns this. */
  open: boolean
  /**
   * Called when the popover asks to open: the trigger was activated.
   *
   * Two callbacks rather than one taking a boolean, because `onOpenChange` is Radix's name and no
   * Radix surface reaches Clara's (TRD Section 402). Two Clara-shaped events read better at the
   * call site than one that has to be destructured.
   */
  onOpen: () => void
  /** Called for every dismissal route: Escape, an outside click, and a control inside the panel. */
  onClose: () => void
  /**
   * The control it hangs from. Rendered as the anchor AND as where focus returns.
   *
   * A node rather than a ref, because the trigger has to be INSIDE the positioning root for the
   * panel to stay anchored to it - which is also what gives Radix a real trigger to restore focus
   * to, and why this component needs none of Modal's restoration machinery.
   */
  trigger: ReactNode
  children: ReactNode
  /** An accessible name for the panel. Without one it announces as an unnamed group. */
  label: string
  placement?: PopoverPlacement
  className?: string
}

/**
 * A non-modal overlay anchored to its trigger.
 *
 * ## Why this has none of Modal's focus machinery, and that is not an inconsistency
 *
 * Modal and Drawer share `useOverlayFocusRestore` because Clara does not expose a trigger for them:
 * the consumer owns the opener, so Clara must capture `document.activeElement` at the right commit
 * and restore it itself, which took nine review rounds to get right.
 *
 * A Popover's trigger is INSIDE the component - it has to be, for the panel to stay anchored - so
 * Radix holds a real ref to it and its own restore is correct by construction. Adding Clara's
 * machinery here would be two mechanisms racing for one outcome, which is exactly the defect
 * `onCloseAutoFocus` preventDefault exists to prevent in Modal.
 *
 * ## Non-modal means focus is never trapped
 *
 * `modal={false}`: Tab moves out of the panel and on through the page, the background is neither
 * inert nor `aria-hidden`, and the page still scrolls. A popover that trapped focus would be a
 * dialog wearing a smaller box.
 */
export function Popover ({
  open, onOpen, onClose, trigger, children, label, placement = 'bottom', className,
}: PopoverProps) {
  const labelId = useId()

  // Radix reports both directions through one boolean. Clara's two callbacks meet it here, and
  // this is the only place the two vocabularies touch.
  const handleOpenChange = (next: boolean) => { if (next) onOpen(); else onClose() }

  return (
    <RadixPopover.Root open={open} onOpenChange={handleOpenChange} modal={false}>
      <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
      <ClaraPortal open={open}>
        <RadixPopover.Content
          className={cx('clara-popover', className)}
          side={placement}
          // Flip when the preferred side has no room, then shift along the cross axis to stay on
          // screen. Both are Radix's, and both are the behaviour AC2 names.
          avoidCollisions
          collisionPadding={8}
          role="group"
          aria-labelledby={labelId}
        >
          <span id={labelId} className="clara-visually-hidden">{label}</span>
          {children}
        </RadixPopover.Content>
      </ClaraPortal>
    </RadixPopover.Root>
  )
}
