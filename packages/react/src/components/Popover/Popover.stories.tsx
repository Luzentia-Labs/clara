import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button/Button'
import { Popover } from './Popover'
import type { PopoverPlacement } from './Popover'

const meta = {
  title: 'Overlays/Popover',
  component: Popover,
  tags: ['autodocs'],
  args: {
    open: false, onOpen: () => {}, onClose: () => {},
    label: 'Column options', trigger: null, children: null, placement: 'bottom',
  },
  argTypes: {
    placement: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left'] },
  },
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

function Demo ({ placement, align = 'center' }: { placement: PopoverPlacement, align?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ padding: 48, display: 'flex', justifyContent: align }}>
      <Popover
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        label="Column options"
        placement={placement}
        trigger={<Button variant="secondary">Options</Button>}
      >
        <p style={{ margin: 0 }}>Choose which columns appear in the table.</p>
      </Popover>
    </div>
  )
}

export const Bottom: Story = { render: () => <Demo placement="bottom" /> }
export const Top: Story = { render: () => <Demo placement="top" /> }

/**
 * Pinned against the edge, which is where AC2's flip and shift are supposed to happen. Nothing
 * automated proves they do - gate 9's fixture is a server render and no portal appears in it
 * (BG-01M0XVXS) - so this story is where a person can currently see it.
 */
export const AgainstTheEdge: Story = { render: () => <Demo placement="left" align="flex-start" /> }

/** Open it, then Tab: focus leaves the panel and the page behind keeps scrolling. */
export const NotAModal: Story = { render: () => <Demo placement="bottom" /> }
