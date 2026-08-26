'use client'

import { type ReactNode } from 'react'
import * as RadixTooltip from '@radix-ui/react-tooltip'
import { cx } from '../../lib/cx'
import { ClaraPortal } from '../../theme/ClaraPortal'

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
   * `string` makes it unrepresentable. It also settles the sole-source question (AC3) at the type
   * level for the common case: a sentence is a description, not a place to hide a control or a
   * table.
   */
  content: string
  /**
   * The control it describes. Rendered as the trigger, and it must be a focusable element.
   *
   * `aria-describedby` is wired onto whatever this renders, so a tooltip on a `<span>` describes
   * something a keyboard user can never reach - which is precisely the failure AC1 exists to
   * prevent. Clara cannot check that in the type system; the docs page says it and the keyboard
   * table shows it.
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
 *   in ClaraProvider's chunk, so every consumer of the library's ROOT would carry ~24 kB of
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
  return (
    <RadixTooltip.Provider>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <ClaraPortal open>
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
