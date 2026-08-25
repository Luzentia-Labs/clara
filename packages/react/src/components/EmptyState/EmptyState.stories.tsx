import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button/Button'
import { EmptyState } from './EmptyState'
import type { EmptyStateEmptyProps } from './EmptyState'

const meta = {
  title: 'Feedback/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  args: { reason: 'empty', title: 'No invoices yet' },
} satisfies Meta<EmptyStateEmptyProps>

export default meta
type Story = StoryObj<EmptyStateEmptyProps>

export const Empty: Story = {
  args: { children: 'Invoices appear here once a supplier submits one.' },
}

export const EmptyWithAction: Story = {
  args: {},
  render: () => (
    <EmptyState reason="empty" title="No invoices yet" action={<Button>Create invoice</Button>}>
      Invoices appear here once a supplier submits one.
    </EmptyState>
  ),
}

export const Filtered: Story = {
  args: {},
  render: () => (
    <EmptyState
      reason="filtered"
      title="No invoices match these filters"
      action={<Button variant="secondary">Clear filters</Button>}
    />
  ),
}

/**
 * The two side by side, which is the comparison that matters: a user shown the wrong one either
 * hunts for data that was filtered out, or creates a duplicate of a record that was there.
 */
export const BothCases: Story = {
  args: {},
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--clara-space-section)' }}>
      <EmptyState reason="empty" title="No invoices yet" action={<Button>Create invoice</Button>} />
      <EmptyState
        reason="filtered"
        title="No invoices match these filters"
        action={<Button variant="secondary">Clear filters</Button>}
      />
    </div>
  ),
}
