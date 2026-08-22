import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
// @ts-expect-error - plain .mjs helper, no declarations
import { bundleRecord } from '../../scripts/lib/bundle-record.mjs'

/**
 * Library build for @luzentialabs/clara-react.
 *
 * `cssFileName` is stated explicitly rather than inherited: it defaults to the package name, and
 * the closed exports map promises `./styles.css`. `build.cssCodeSplit` already defaults to false
 * in library mode, which is what makes it ONE stylesheet - Clara's CSS is deliberately not
 * tree-shaken (AGENTS.md).
 */
export default defineConfig({
  plugins: [
    dts({ insertTypesEntry: true, tsconfigPath: './tsconfig.json' }),
    bundleRecord(),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
      cssFileName: 'styles',
    },
    rollupOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/, /^@luzentialabs\//],
      // Clara's CSS is deliberately not tree-shaken (AGENTS.md): consumers get ONE styles.css.
      // Rollup's default would drop a stylesheet whose importing module has no surviving export,
      // which silently breaks the `./styles.css` subpath the exports map promises. Consumers
      // still tree-shake the JS themselves through the ESM build.
      treeshake: { moduleSideEffects: true },
    },
  },
})
