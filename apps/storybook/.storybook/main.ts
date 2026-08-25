import type { StorybookConfig } from '@storybook/react-vite'

/**
 * The component playground, and the source Chromatic reads (TSD Section 5, D0013).
 *
 * Stories live NEXT TO their components in `packages/react/src`, not in this app. A design system
 * whose stories sit in a separate tree grows stories for components that no longer exist and
 * misses components that do - which is the whole subject of the story coverage gate
 * (US-01M0GMNM). Keeping them colocated means the gate compares two things in one place.
 */
const config: StorybookConfig = {
  framework: '@storybook/react-vite',

  stories: [
    '../../../packages/react/src/**/*.mdx',
    '../../../packages/react/src/**/*.stories.@(ts|tsx)',
  ],

  addons: [
    // AC2. Runs axe in the panel, per story, as the author works. It does NOT replace gate 5
    // (`pnpm check:axe`), which blocks the merge - an addon nobody opens is not a gate.
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
  ],

  // AC3. The props table is generated from the TypeScript types and their TSDoc, so it cannot
  // drift from the API the way a hand-written table does. `react-docgen-typescript` is the
  // variant that reads TSDoc comments; the default `react-docgen` does not resolve types across
  // files, which matters here because every prop type is an interface in its own module.
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      // Colocated stories in a monorepo: the component sources have to be in the TS program or
      // docgen silently produces empty prop tables rather than failing.
      include: ['**/*.tsx', '../../packages/react/src/**/*.tsx'],
      // A consumer never sets `key`, `ref` or the 200 inherited DOM attributes, and a props table
      // that lists them buries the eight props that are actually Clara's.
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },

  docs: { autodocs: 'tag' },

  // The automatic JSX runtime, stated rather than inherited. Without it the config files and
  // stories compile to bare `React.createElement` calls with no React import, and every story
  // renders as "ReferenceError: React is not defined" in the preview iframe while the BUILD still
  // reports success - a playground that is green in CI and blank in a browser.
  viteFinal: (config) => ({
    ...config,
    esbuild: { ...(typeof config.esbuild === 'object' ? config.esbuild : {}), jsx: 'automatic' },
  }),
}

export default config
