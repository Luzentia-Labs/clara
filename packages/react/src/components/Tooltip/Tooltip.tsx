'use client'

import { useCallback, useState, type ReactNode } from 'react'
import * as RadixTooltip from '@radix-ui/react-tooltip'
import { cx } from '../../lib/cx'
import { ClaraPortal } from '../../theme/ClaraPortal'
import { devWarning } from '../../lib/dev-warning'

/** Which side of the trigger it prefers. It flips when there is no room. */
export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left'

export interface TooltipProps {
  /**
   * The explanation. A STRING, deliberately, and not `ReactNode`.
   *
   * A tooltip's content is not reachable: it is not in the tab order, it is announced through
   * `aria-describedby` on the trigger, and it disappears the moment attention moves. Any focusable
   * element placed inside one is therefore unreachable by keyboard - a control that exists, paints,
   * and cannot be operated. Typing this as `ReactNode` would make that bug expressible, and every
   * design system that allows it ends up documenting "do not put buttons in tooltips" instead.
   *
   * `string` makes it unrepresentable.
   *
   * It does NOT settle the sole-source question (AC3), and an earlier version of this comment
   * claimed it did. A plain string is perfectly capable of being the only place some essential
   * information appears - the type constrains the SHAPE of the content, not whether the content is
   * load-bearing. AC3 is a manual audit for exactly that reason.
   */
  content: string
  /**
   * The control it describes. Rendered as the trigger, and it must be a focusable element.
   *
   * `aria-describedby` is wired onto whatever this renders, so a tooltip on a `<span>` describes
   * something a keyboard user can never reach - which is precisely the failure AC1 exists to
   * prevent.
   *
   * The TYPE system cannot check it - whether a node renders something focusable is not knowable
   * until runtime - so Clara warns in development instead, through `devWarning`.
   *
   * Two earlier versions of this paragraph deferred that warning, the second on the stated ground
   * that "Clara has no `console.warn` convention anywhere in `packages/react/src` yet". That was
   * FALSE when it was written: `lib/dev-warning.ts` had shipped two days earlier, QA-signed, with
   * dev-only gating and once-per-message dedupe, and NumberInput already called it. The whole
   * argument for deferring rested on a fact nobody checked, which is why it is recorded here rather
   * than quietly deleted.
   */
  children: ReactNode
  placement?: TooltipPlacement
  className?: string
}

/**
 * A short explanation attached to a control, reachable by pointer AND by keyboard.
 *
 * ## Why it opens on focus and not only on hover
 *
 * A hover-only tooltip is invisible to everyone who does not use a mouse, which is the population
 * most likely to need the explanation. Radix opens on focus as well as hover; this component does
 * not disable that, and AC1 asserts it directly rather than trusting the primitive.
 *
 * ## WCAG 1.4.13 - Content on Hover or Focus
 *
 * Three requirements, and Clara meets each with a mechanism rather than a promise:
 *
 * - **Dismissable.** Escape closes it without moving the pointer. Radix's, asserted by AC2.
 * - **Hoverable.** The pointer can travel from the trigger to the tooltip without it vanishing
 *   underneath. This is `disableHoverableContent`, which Radix defaults to `false` - Clara does not
 *   set it, and does not expose it. A prop that lets a consumer turn this off is a prop that lets a
 *   consumer fail 1.4.13, and nothing asked for it.
 * - **Persistent.** It stays until the pointer or focus leaves. Radix applies no hide delay.
 *
 * ## Each Tooltip opens its own Radix provider, and what that costs
 *
 * `@radix-ui/react-tooltip` throws without a provider ancestor - measured, not assumed. The message
 * is "Tooltip must be used within TooltipProvider". Three shapes were available:
 *
 * - **Require ClaraProvider.** Rejected twice over. A consumer who forgets it reads a message
 *   naming a Radix type, and Section 4 rule 7 says no Radix surface reaches Clara's - an error
 *   string is the surface a consumer actually reads. Worse, it would put `@radix-ui/react-tooltip`
 *   in ClaraProvider's chunk, so every consumer of the library's ROOT would carry ~19 kB of
 *   tooltip machinery whether or not they ever render one.
 * - **A public `<TooltipProvider>` for grouping.** Rejected as speculative: no acceptance criterion
 *   asks for it, and it is public API, which under this project's publishing rules is a one-way
 *   door.
 * - **A provider inside every Tooltip.** Chosen. Self-contained, nothing throws, nothing is forced
 *   on a consumer who does not use tooltips, and no new public surface is created.
 *
 * The cost is real and is recorded rather than hidden: `skipDelayDuration` groups delays PER
 * PROVIDER, so with one provider each, moving along a toolbar re-incurs the full 700 ms open delay
 * on every button instead of showing the second and third tooltip immediately. Nothing here is
 * incorrect - it is slower than it could be. If that turns out to matter on a real dense toolbar,
 * the fix is a grouping provider, and it should arrive as its own story with its own evidence,
 * not as a prop added on a guess.
 *
 * ## It shares one layer with Toast, and open order decides (D0102)
 *
 * `--clara-layer-tooltip` and `--clara-layer-toast` are the SAME layer on purpose. A tooltip on a
 * toast's action must paint above the toast, and a toast arriving over an open tooltip must paint
 * above the tooltip. Those are opposite directions, so no constant satisfies both and DOM order -
 * which the browser already resolves - is the only mechanism that does.
 */
export function Tooltip ({ content, children, placement = 'top', className }: TooltipProps) {
  /*
   * Open state is held here ONLY so `ClaraPortal` can be told when the surface opens.
   *
   * It is not public API and it does not change the component's contract: Radix still owns every
   * decision about WHEN to open (hover delay, focus, Escape, the hover bridge), and this mirrors
   * its `onOpenChange` rather than overriding it.
   *
   * `<ClaraPortal open>` - a literal `true` - was the bug. The portal host is appended when its
   * surface OPENS, and that append order is the entire mechanism D0102 relies on: tooltip and toast
   * share one layer, so whichever opened last paints on top. With a constant `open` the host was
   * appended at MOUNT instead, freezing the order at render order, and a tooltip opened over a live
   * toast painted UNDERNEATH it - measured in Chromium with `elementFromPoint`, which is the oracle
   * D0102 itself mandates. That is precisely the outcome the decision exists to prevent, and it
   * reached main because both AC7 e2e assertions happen to be consistent with mount order too.
   *
   * Every sibling overlay already passed state here (Popover, Toast, Drawer, Modal, DropdownMenu);
   * Tooltip was the only one that did not. A closed Tooltip also left two nested divs in
   * `document.body` permanently - sixty of them on a thirty-icon toolbar.
   */
  const [open, setOpen] = useState(false)

  /*
   * The trigger must be focusable, or the explanation never reaches a keyboard user - which is the
   * failure AC1 exists to prevent, reached by a route the type system cannot close.
   *
   * Checked on the node Radix's `asChild` forwards its ref to, which is the SAME node
   * `aria-describedby` lands on, so there is no gap between what is inspected and what is
   * described. Deliberately not a deep search: a focusable descendant would not receive the
   * description either.
   *
   * `setTimeout(0)` rather than an immediate read, because `tabIndex` set in an effect by whatever
   * rendered the child has not run yet at ref time. That closes the one false positive worth
   * closing; a `tabIndex` set later still warns, and the message says what to do about it.
   */
  const checkTrigger = useCallback((node: HTMLElement | null) => {
    if (!node) return
    setTimeout(() => {
      if (!node.isConnected) return
      const focusable = node.matches(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
        'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      devWarning(
        !focusable,
        `A Tooltip's trigger is a <${node.tagName.toLowerCase()}>, which cannot receive keyboard ` +
        'focus, so the tooltip opens on hover only and its content never reaches a keyboard or ' +
        'screen-reader user - `aria-describedby` points at a description nobody can reach. Put the ' +
        'tooltip on a button, a link, or any element with `tabIndex={0}`.',
      )
    }, 0)
  }, [])

  return (
    <RadixTooltip.Provider>
      <RadixTooltip.Root open={open} onOpenChange={setOpen}>
        <RadixTooltip.Trigger asChild ref={checkTrigger}>{children}</RadixTooltip.Trigger>
        <ClaraPortal open={open}>
          <RadixTooltip.Content
            className={cx('clara-tooltip', className)}
            side={placement}
            // Flip when the preferred side has no room, then shift to stay on screen. A tooltip
            // that renders off the viewport is the same as no tooltip.
            avoidCollisions
            collisionPadding={8}
            sideOffset={6}
          >
            {content}
          </RadixTooltip.Content>
        </ClaraPortal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  )
}
