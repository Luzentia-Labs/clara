import type { Meta, StoryObj } from '@storybook/react-vite'
import { ProgressBar } from './ProgressBar'
import type { ProgressBarDeterminateProps } from './ProgressBar'

const meta = {
  title: 'Feedback/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
  args: { label: 'Posting invoices', value: 62 },
} satisfies Meta<ProgressBarDeterminateProps>

export default meta
type Story = StoryObj<ProgressBarDeterminateProps>

export const Determinate: Story = {}
export const Empty: Story = { args: { value: 0 } }
export const Complete: Story = { args: { value: 100 } }

/** No `value`, and the type will not let you pass one - it cannot claim a percentage it lacks. */
export const Indeterminate: Story = {
  args: {},
  render: () => <ProgressBar label="Checking supplier" indeterminate />,
}

/**
 * Switch your OS to "reduce motion" and reload the indeterminate bar: the segment stops travelling
 * and the whole track pulses instead. A traverse is a translation, which is the thing the
 * vestibular response is triggered by; a parked segment would read as a percentage it does not know.
 */
export const BothModes: Story = {
  args: {},
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--clara-space-stack)' }}>
      <ProgressBar label="Posting invoices" value={62} />
      <ProgressBar label="Checking supplier" indeterminate />
    </div>
  ),
}
