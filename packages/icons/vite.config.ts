import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
// @ts-expect-error - plain .mjs helper, no declarations
import { bundleRecord } from '../../scripts/lib/bundle-record.mjs'

/**
 * Library build for @luzentialabs/clara-icons.
 *
 * `formats` is stated rather than inherited: Vite's default is ['es','umd'] for a single entry,
 * and this package must publish ES + CJS to match its exports map.
 */
export default defineConfig({
  // `bundleTypes` (the option formerly called `rollupTypes`) is deliberately NOT used: it needs
  // @microsoft/api-extractor as an extra dependency. Per-file declarations are fine here because
  // the exports map is closed - no extra .d.ts file is reachable as public API (PL-01M0HVR8 risk 2).
  plugins: [// `bundleTypes` for the same reason as clara-react: without it the entry .d.ts re-exports
    // './generated' with no extension, which node16 ESM resolution cannot follow - attw reports
    // InternalResolutionError and gate 10 fails.
    dts({ insertTypesEntry: true, bundleTypes: true, tsconfigPath: './tsconfig.json' }), bundleRecord()],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      // React is a peer, never a dependency. A published package carrying its own React copy
      // breaks every consumer at runtime and the consumer cannot fix it. The regex covers
      // subpath imports (react/jsx-runtime) that an exact-string list would miss.
      external: [/^react($|\/)/, /^react-dom($|\/)/, /^@luzentialabs\//],
    },
  },
})
