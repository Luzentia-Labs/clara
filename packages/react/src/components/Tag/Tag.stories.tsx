import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tag } from './Tag'
import type { TagStaticProps } from './Tag'

const meta = {
  title: 'Status/Tag',
  component: Tag,
  tags: ['autodocs'],
  args: { children: 'Draft' },
  argTypes: {
    intent: { control: 'inline-radio', options: ['neutral', 'info', 'success', 'warning', 'danger'] },
  },
} satisfies Meta<TagStaticProps>

export default meta
type Story = StoryObj<TagStaticProps>

export const Neutral: Story = {}
export const Warning: Story = { args: { intent: 'warning', children: 'Pending review' } }

/** Removable tags name what they remove, so a filter bar is navigable by ear. */
export const FilterBar: Story = {
  args: {},
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--clara-space-adjacent-target)', flexWrap: 'wrap' }}>
      <Tag intent="danger" onRemove={() => {}}>Overdue</Tag>
      <Tag intent="warning" onRemove={() => {}}>Pending review</Tag>
      <Tag intent="info" onRemove={() => {}}>Submitted</Tag>
      <Tag onRemove={() => {}}>Q3</Tag>
    </div>
  ),
}

/** A static tag adds no tab stop, which is what makes one per row of a list screen affordable. */
export const NotRemovable: Story = { args: { intent: 'success', children: 'Paid' } }
