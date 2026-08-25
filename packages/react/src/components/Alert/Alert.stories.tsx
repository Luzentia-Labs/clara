import type { Meta, StoryObj } from '@storybook/react-vite'
import { Alert } from './Alert'
import type { AlertStaticProps } from './Alert'

const meta = {
  title: 'Feedback/Alert',
  component: Alert,
  tags: ['autodocs'],
  args: { intent: 'info', children: 'Two lines fall outside the period.' },
  argTypes: {
    intent: { control: 'inline-radio', options: ['info', 'success', 'warning', 'danger'] },
  },
} satisfies Meta<AlertStaticProps>

export default meta
type Story = StoryObj<AlertStaticProps>

export const Info: Story = {}
export const Success: Story = { args: { intent: 'success', children: 'Saved.' } }
export const Warning: Story = { args: { intent: 'warning', children: 'Two lines fall outside the period.' } }

export const WithTitle: Story = {
  args: {
    intent: 'danger',
    title: 'Posting failed',
    children: 'Three invoices could not be posted. Check the period and try again.',
  },
}

/** All four, so the icons can be compared against each other rather than only against the text. */
export const EveryIntent: Story = {
  args: {},
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--clara-space-stack)' }}>
      <Alert intent="info">The period closes on Friday.</Alert>
      <Alert intent="success">Saved.</Alert>
      <Alert intent="warning">Two lines fall outside the period.</Alert>
      <Alert intent="danger">Three invoices could not be posted.</Alert>
    </div>
  ),
}

export const Dismissible: Story = {
  args: {},
  render: () => <Alert intent="success" onDismiss={() => {}}>Saved.</Alert>,
}
