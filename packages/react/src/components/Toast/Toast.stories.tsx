import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button/Button'
import { Tooltip } from '../Tooltip/Tooltip'
import { Toast } from './Toast'

const meta = {
  title: 'Overlays/Toast',
  component: Toast,
  tags: ['autodocs'],
  args: { open: true, onClose: () => {}, title: 'Journal 4471 posted', intent: 'success' },
  argTypes: {
    intent: { control: 'inline-radio', options: ['info', 'success', 'warning', 'danger'] },
  },
} satisfies Meta<typeof Toast>

export default meta
type Story = StoryObj<typeof meta>

export const Success: Story = {
  render: () => <Toast open onClose={() => {}} intent="success" title="Journal 4471 posted" />,
}

/** An error does not auto-dismiss, and is announced assertively. Both follow from the same fact. */
export const Error_: Story = {
  name: 'Error',
  render: () => (
    <Toast
      open
      onClose={() => {}}
      intent="danger"
      title="Could not post journal 4471"
      description="The period is closed."
      action={<Button variant="secondary" size="sm">Retry</Button>}
    />
  ),
}

/**
 * AC7, direction one: a tooltip opened on a toast's own action must paint ABOVE the toast.
 *
 * The action carries a tooltip whose panel overlaps the toast body, which is the overlap
 * `e2e/stacking.spec.ts` probes with `document.elementFromPoint`. The two share one layer by
 * design (D0102), so this resolves by open order and NOT by a z-index comparison - comparing the
 * computed values would prove nothing, since they are equal.
 */
export const TooltipOnAToastAction: Story = {
  render: () => (
    <Toast
      open
      onClose={() => {}}
      intent="danger"
      title="Could not post journal 4471"
      description="The period is closed, so the entry cannot be posted to it."
      action={(
        <Tooltip content="Posts the journal again once the period is reopened" placement="top">
          <Button variant="secondary" size="sm">Retry</Button>
        </Tooltip>
      )}
    />
  ),
}

/**
 * AC7, direction two: a toast ARRIVING over an already-open tooltip must paint above it.
 *
 * The trigger sits in the bottom-right so its tooltip lands where the toast viewport is. Open the
 * tooltip first, then press Notify - the order is what decides, which is the whole point.
 */
function ArrivingDemo () {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <div style={{ position: 'fixed', top: 16, left: 16 }}>
        <Button variant="secondary" onClick={() => setOpen(true)}>Notify</Button>
      </div>
      {/*
        * Positioned so the tooltip's PANEL lands on top of where the toast arrives, not merely
        * near it. Measured at 1280x720: the trigger here puts the tooltip at y 636-690 and the
        * toast occupies y 649-696, so they genuinely overlap - the first attempt left an 89 px gap
        * and the e2e probe correctly refused to draw a conclusion from a point only one of them
        * covered.
        */}
      <div style={{ position: 'fixed', bottom: 90, right: 120 }}>
        <Tooltip content="This tooltip is directly under where the toast will arrive" placement="bottom">
          <Button variant="secondary">Explain</Button>
        </Tooltip>
      </div>
      <Toast open={open} onClose={() => setOpen(false)} intent="info" title="Journal 4471 posted" />
    </div>
  )
}

export const ToastArrivingOverATooltip: Story = { render: () => <ArrivingDemo /> }

/**
 * AC7's THIRD direction, and the one that was missing: the toast arrives FIRST and the tooltip
 * opens over it afterwards.
 *
 * Both existing assertions happen to be consistent with mount order as well as open order, so a
 * bug that froze the stacking at mount order passed them both. A review measured it in Chromium and
 * found the tooltip painting UNDER the toast, which is the defect D0102 exists to prevent. This
 * fixture exists so the mechanism is pinned in the direction that actually distinguishes them.
 */
export const TooltipOpenedOverALiveToast: Story = { render: () => <ArrivingDemo /> }

/**
 * Three at once - BG-01M0Y2H2's fixture.
 *
 * Every `<Toast>` used to bring its own fixed viewport, so these three landed at the identical rect
 * and only the last was reachable. `elementFromPoint` on the first one's close button returned the
 * third one's. They now share one stack.
 */
export const AStackOfThree: Story = {
  render: () => (
    <>
      <Toast open onClose={() => {}} intent="success" title="Journal 4471 posted" />
      <Toast open onClose={() => {}} intent="info" title="Journal 4472 queued" />
      <Toast open onClose={() => {}} intent="danger" title="Journal 4473 could not post"
        description="The period is closed." />
    </>
  ),
}
