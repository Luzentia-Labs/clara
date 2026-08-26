import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button/Button'
import { Tooltip } from './Tooltip'

const meta = {
  title: 'Overlays/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  args: {
    content: 'Recalculates every open line on this order',
    children: null,
    placement: 'top',
  },
  argTypes: {
    placement: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left'] },
  },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

function Demo () {
  return (
    <div style={{ padding: 96, display: 'flex', justifyContent: 'center' }}>
      <Tooltip content="Recalculates every open line on this order">
        <Button variant="secondary">Recalculate</Button>
      </Tooltip>
    </div>
  )
}

export const Default: Story = { render: () => <Demo /> }

/** Tab to the button. It opens on focus with no delay, and Escape dismisses it. */
export const OnKeyboardFocus: Story = { render: () => <Demo /> }

/**
 * The hover bridge (WCAG 1.4.13 "hoverable"): hover the button, then move the pointer down onto the
 * tooltip. It must not vanish on the way.
 *
 * This story is the fixture `e2e/stacking.spec.ts` drives, because the bridge is a grace-area
 * polygon computed from real bounding rectangles and a real pointer position - jsdom has neither,
 * so it cannot be asserted anywhere but a browser.
 *
 * `bottom` on purpose: the pointer travels DOWNWARD from trigger to content, which is the direction
 * a person actually moves and the one where an unbridged tooltip disappears most obviously.
 */
export const HoverBridge: Story = {
  render: () => (
    <div style={{ padding: 96, display: 'flex', justifyContent: 'center' }}>
      <Tooltip content="The pointer can reach this without it vanishing" placement="bottom">
        <Button variant="secondary">Hover me</Button>
      </Tooltip>
    </div>
  ),
}

/**
 * Pinned against the edge, where collision handling has to flip or shift it. Nothing automated
 * proves it does - the same gap Popover records (BG-01M0XVXS) - so this is where a person sees it.
 */
export const AgainstTheEdge: Story = {
  render: () => (
    <div style={{ padding: 8, display: 'flex', justifyContent: 'flex-start' }}>
      <Tooltip content="There is no room on the left, so this has to flip or shift" placement="left">
        <Button variant="secondary">Edge</Button>
      </Tooltip>
    </div>
  ),
}
