import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './Badge'
import type { BadgeLabelProps } from './Badge'

const meta = {
  title: 'Status/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: { children: 'Draft' },
  argTypes: {
    intent: { control: 'inline-radio', options: ['neutral', 'info', 'success', 'warning', 'danger'] },
  },
} satisfies Meta<BadgeLabelProps>

export default meta
type Story = StoryObj<BadgeLabelProps>

export const Neutral: Story = {}
export const Info: Story = { args: { intent: 'info', children: 'Submitted' } }
export const Success: Story = { args: { intent: 'success', children: 'Paid' } }
export const Warning: Story = { args: { intent: 'warning', children: 'Pending review' } }
export const Danger: Story = { args: { intent: 'danger', children: 'Overdue' } }

/** A count needs `countLabel`; the number alone cannot carry its own meaning. */
export const WithCount: Story = {
  args: {},
  render: () => <Badge intent="danger" count={3} countLabel="overdue invoices" />,
}

/**
 * The failure this component cannot prevent, shown on purpose. Both read "Open"; only the hue
 * separates them, which is the WCAG 1.4.1 trap the docs page warns about.
 */
export const ColourAloneIsNotEnough: Story = {
  args: {},
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--clara-space-adjacent-target)' }}>
      <Badge intent="danger">Open</Badge>
      <Badge intent="success">Open</Badge>
    </div>
  ),
}
