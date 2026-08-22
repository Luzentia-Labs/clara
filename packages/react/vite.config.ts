import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
// @ts-expect-error - plain .mjs helper, no declarations
import { bundleRecord } from '../../scripts/lib/bundle-record.mjs'
// @ts-expect-error - plain .mjs helper, no declarations
import { manualChunks } from '../../scripts/lib/chunk-plan.mjs'

/**
 * Library build for @luzentialabs/clara-react.
 *
 * `cssFileName` is stated explicitly rather than inherited: it defaults to the package name, and
 * the closed exports map promises `./styles.css`. `build.cssCodeSplit` already defaults to false
 * in library mode, which is what makes it ONE stylesheet - Clara's CSS is deliberately not
 * tree-shaken (AGENTS.md).
 *
 * The output is cut into a client chunk and a server chunk from `client-boundary.json` (D0041).
 * A bundle has one top, so one chunk could carry `"use client"` for everything or for nothing,
 * while TRD Section 7 requires it on client components and absent from server-capable ones. The
 * entry stays unchunked and undirectived, which is what keeps the package server-capable.
 *
 * The chunks are NOT new public API. The exports map still names only `.`, `./styles.css` and
 * `./package.json` (D0006); the chunks are internal files the entry imports.
 */
const classification = JSON.parse(readFileSync(new URL('./client-boundary.json', import.meta.url), 'utf8'))

export default defineConfig({
  plugins: [
    // `bundleTypes` rolls every declaration into one index.d.ts. Without it the entry re-exports
    // `./components/Box/Box` with no extension, which node16 ESM resolution cannot follow - attw
    // reports InternalResolutionError, and TRD Section 9 gate 10 fails on it. It also stops a
    // `dist/components/` tree from shipping, which would widen the deep-import surface the closed
    // exports map exists to prevent (D0006).
    dts({ insertTypesEntry: true, bundleTypes: true, tsconfigPath: './tsconfig.json' }),
    bundleRecord(),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      cssFileName: 'styles',
    },
    rollupOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/, /^@luzentialabs\//],
      // Clara's CSS is deliberately not tree-shaken (AGENTS.md): consumers get ONE styles.css.
      // Rollup's default would drop a stylesheet whose importing module has no surviving export,
      // which silently breaks the `./styles.css` subpath the exports map promises. Consumers
      // still tree-shake the JS themselves through the ESM build.
      treeshake: { moduleSideEffects: true },
      // One output per format, stated explicitly. Sharing a single `output` block gave both
      // passes the same `chunkFileNames`, so the CJS pass silently OVERWROTE the ESM chunks and
      // dist/index.js imported a file full of `require()` calls. The extension has to distinguish
      // them, exactly as it does for the entry.
      output: [
        {
          format: 'es',
          entryFileNames: 'index.js',
          // Named rather than hashed: check-client-boundary and the size budgets address the
          // chunks by name, and a hash would change them on every build.
          chunkFileNames: '[name].js',
          manualChunks: manualChunks(classification),
        },
        {
          format: 'cjs',
          entryFileNames: 'index.cjs',
          // `.cjs` for chunks too, so Rollup emits requires that resolve without any rename step.
          chunkFileNames: '[name].cjs',
          exports: 'named',
          manualChunks: manualChunks(classification),
        },
      ],
    },
  },
})
