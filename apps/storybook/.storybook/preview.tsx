import type { Decorator, Preview } from '@storybook/react-vite'
import { ClaraProvider, ClaraScope } from '@luzentialabs/clara-react'

// All four sheets, in this order. The theme and density OVERRIDES are separate stylesheets, so
// importing only `tokens.css` leaves the toolbars with nothing to apply and every story renders
// light and comfortable under whatever the toolbar says - a playground that lies quietly.
import '@luzentialabs/clara-tokens/tokens.css'
import '@luzentialabs/clara-tokens/themes/dark.css'
import '@luzentialabs/clara-tokens/themes/compact.css'
import '@luzentialabs/clara-react/styles.css'

/** AC1. Theme and density are the two axes every Clara component is specified against. */
const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Clara colour theme',
    toolbar: {
      icon: 'circlehollow',
      items: [
        { value: 'light', title: 'Light' },
        { value: 'dark', title: 'Dark' },
      ],
      dynamicTitle: true,
    },
  },
  density: {
    name: 'Density',
    description: 'Clara density scale',
    toolbar: {
      icon: 'component',
      items: [
        { value: 'comfortable', title: 'Comfortable' },
        { value: 'compact', title: 'Compact' },
      ],
      dynamicTitle: true,
    },
  },
} as const

/**
 * The toolbars drive `ClaraScope`, the same public API a consumer uses - not a class on a wrapper
 * div and not a direct `data-clara-theme` attribute. If scoping breaks, the playground breaks with
 * it rather than papering over it: BG-01M0WQY1 was exactly that failure, where the attributes were
 * all correct and nothing downstream followed, and a hand-rolled wrapper here would have hidden it.
 */
const withClara: Decorator = (Story, context) => {
  const { theme, density } = context.globals

  return (
    <ClaraProvider>
      <ClaraScope theme={theme as 'light' | 'dark'} density={density as 'comfortable' | 'compact'}>
        <div
          style={{
            // The canvas has to come from the theme too, or a dark story renders on Storybook's
            // white background and every contrast judgement made here is against the wrong ground.
            background: 'var(--clara-color-bg-canvas)',
            color: 'var(--clara-color-fg-default)',
            padding: '24px',
            minHeight: '100vh',
            boxSizing: 'border-box',
          }}
        >
          <Story />
        </div>
      </ClaraScope>
    </ClaraProvider>
  )
}

const preview: Preview = {
  globalTypes,
  initialGlobals: { theme: 'light', density: 'comfortable' },
  decorators: [withClara],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    // Clara paints its own canvas in the decorator above, so Storybook's own background switcher
    // would fight it and produce a light frame around a dark story.
    backgrounds: { disable: true },
    a11y: { test: 'todo' },
  },
}

export default preview
