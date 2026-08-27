import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button/Button'
import { Drawer } from './Drawer'
import type { DrawerPlacement } from './Drawer'

const meta = {
  title: 'Overlays/Drawer',
  component: Drawer,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  // `open`, `onClose` and `title` are required props, so meta has to supply them even though every
  // story below drives them from its own state - a `satisfies Meta<typeof Drawer>` alone does not
  // satisfy the type.
  //
  // The three identifiers above were EATEN when this file was first written: passed through an
  // unquoted shell heredoc, backtick spans ran as command substitution and the comment shipped
  // reading "//  and  are required props". AGENTS.md names the rule - pass prose as a document,
  // not as a shell argument.
  args: { open: false, onClose: () => {}, title: 'Filters', placement: 'right' },
  argTypes: {
    placement: { control: 'inline-radio', options: ['left', 'right', 'bottom'] },
  },
} satisfies Meta<typeof Drawer>

export default meta
type Story = StoryObj<typeof meta>

/** Opened from a real button, so focus restoration has somewhere true to return to. */
function Demo ({ placement }: { placement: DrawerPlacement }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ padding: 24 }}>
      <Button onClick={() => setOpen(true)}>Open {placement} drawer</Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Filters"
        description="Narrow the list to the records you are working on."
        placement={placement}
        footer={<Button onClick={() => setOpen(false)}>Apply</Button>}
      >
        <p>Body content scrolls here; the header and footer stay put.</p>
      </Drawer>
    </div>
  )
}

export const Right: Story = { render: () => <Demo placement="right" /> }
export const Left: Story = { render: () => <Demo placement="left" /> }
export const Bottom: Story = { render: () => <Demo placement="bottom" /> }

/**
 * Open it, then press Escape or click the scrim: focus returns to the button you opened it from.
 * Switch your OS to "reduce motion" and the slide is gone, while everything else is unchanged.
 */
export const FocusAndMotion: Story = { render: () => <Demo placement="right" /> }
