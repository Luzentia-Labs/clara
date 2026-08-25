import type { Meta, StoryObj } from '@storybook/react-vite'
import { Skeleton, SkeletonGroup } from './Skeleton'

const meta = {
  title: 'Feedback/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  args: { width: 'full' },
  argTypes: {
    width: { control: 'inline-radio', options: ['full', 'three-quarters', 'half', 'quarter'] },
  },
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Single: Story = {}

/** A ragged edge is the effect; four widths produce it without a CSS length in the API. */
export const Paragraph: Story = {
  render: () => (
    <SkeletonGroup label="Loading invoice detail">
      <Skeleton />
      <Skeleton />
      <Skeleton width="three-quarters" />
    </SkeletonGroup>
  ),
}

/**
 * Forty placeholders, ONE announcement. This is the story the component exists for, and it is also
 * the one to look at when judging whether stillness was the right call: imagine these shimmering.
 */
export const LoadingList: Story = {
  render: () => (
    <SkeletonGroup label="Loading invoices">
      {Array.from({ length: 40 }, (_, i) => (
        <Skeleton key={i} width={i % 3 === 0 ? 'three-quarters' : 'full'} />
      ))}
    </SkeletonGroup>
  ),
}
