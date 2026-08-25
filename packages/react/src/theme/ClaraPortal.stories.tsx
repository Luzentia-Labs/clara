import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../components/Button/Button'
import { ClaraPortal } from './ClaraPortal'
import { ClaraScope } from './ClaraScope'

/**
 * A portal moves its content to `document.body` - physically OUTSIDE the scope element it was
 * written in. TRD ADR-006 says it must keep that scope anyway, and `ClaraPortal` does it by
 * stamping the resolved `data-clara-theme` / `data-clara-density` onto the portal root.
 *
 * Those attributes being right is not the claim. BG-01M0WQY1 was exactly the case where every
 * attribute was correct and the rendered values were not, and the browser gate that shipped with
 * that fix only ever rendered in-document scopes. This story is the portalled case, so
 * `e2e/scoping.spec.ts` can assert what a portal actually computes.
 */
const meta = {
  title: 'Theme/ClaraPortal',
  component: ClaraPortal,
  parameters: {
    // The portal escapes the decorator's canvas by design, so a padded frame would be misleading.
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ClaraPortal>

export default meta
type Story = StoryObj<typeof meta>

/**
 * A dark, compact island on whatever the toolbar says the page is - with the button that proves
 * the scope survived the trip to `document.body` rendered inside a portal.
 */
export const ScopedToWhereItWasWritten: Story = {
  args: { open: true, children: null },
  render: () => (
    <div data-probe="page" style={{ padding: 24 }}>
      <Button variant="secondary">In the document</Button>
      <ClaraScope theme="dark" density="compact">
        <ClaraPortal open>
          <div data-probe="portalled">
            <Button variant="secondary">Inside a portal</Button>
          </div>
        </ClaraPortal>
      </ClaraScope>
    </div>
  ),
}
