import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button/Button'
import { Spinner } from './Spinner'

const meta = {
  title: 'Feedback/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  args: { label: 'Loading invoices' },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/**
 * The same ring, in both the places it appears. If these ever turn at different rates, the shared
 * implementation D0100 requires has been broken.
 */
export const SharedWithButton: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--clara-space-stack)' }}>
      <Spinner label="Loading invoices" />
      <Button loading>Save changes</Button>
    </div>
  ),
}

/**
 * Switch your OS to "reduce motion" and reload: the ring stops rotating and pulses instead, on the
 * same period. Replaced, not removed - a spinner that stops is indistinguishable from a hang.
 */
export const ReducedMotion: Story = {}
