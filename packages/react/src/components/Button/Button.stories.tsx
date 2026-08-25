import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import type { ButtonOwnProps } from './Button'

/**
 * Stories live next to the component, not in the Storybook app, so the story-coverage gate
 * (US-01M0GMNM) compares two things in one directory rather than across two trees.
 *
 * `Meta<ButtonOwnProps>` rather than `Meta<typeof Button>`: Button is polymorphic, so its type is
 * a generic call signature and `typeof Button` gives Storybook a component type it cannot infer
 * args from. The own-props interface is the surface a story actually sets.
 */
const meta = {
  title: 'Actions/Button',
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Save changes' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<ButtonOwnProps>

export default meta
type Story = StoryObj<ButtonOwnProps>

export const Primary: Story = { args: { variant: 'primary' } }

export const Secondary: Story = { args: { variant: 'secondary', children: 'Cancel' } }

export const Small: Story = { args: { size: 'sm', children: 'Undo' } }

export const Disabled: Story = { args: { disabled: true } }

export const Loading: Story = { args: { loading: true } }

/**
 * Both variants at both sizes, in one frame. The theme and density toolbars apply to this story
 * like any other, so it doubles as the fastest way to see a scope change take effect.
 */
export const AllVariants: Story = {
  args: {},
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--clara-space-adjacent-target)', flexWrap: 'wrap' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="primary" size="sm">Primary sm</Button>
      <Button variant="secondary" size="sm">Secondary sm</Button>
      <Button variant="primary" disabled>Disabled</Button>
      <Button variant="primary" loading>Loading</Button>
    </div>
  ),
}
