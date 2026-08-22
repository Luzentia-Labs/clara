import { defineConfig } from 'vite'
// @ts-expect-error - plain .mjs helper
import { bundleRecord } from '../../scripts/lib/bundle-record.mjs'

/**
 * `clara-tokens` is built by Style Dictionary + tsc (D0028), not by a bundler - but it still has to
 * produce a bundle record, and that record must be OBSERVED rather than asserted.
 *
 * The previous approach (`tsc-bundle-record.mjs`) derived `inlined` from the filename mapping and
 * verified only that the source existed. A reviewer appended that writer to the react build script
 * and shipped 55,955 bytes of inlined React with a hash-correct record naming one source file, all
 * 13 guards green (review X1). A hash proves provenance of bytes; it cannot prove completeness of a
 * list.
 *
 * So there is now exactly ONE record writer in the repo, it is a Rollup plugin, and it can only
 * report what the bundler actually did. This pass reads the SAME compiled output tsc produced and
 * records it; it does not replace the tsc build (D0028 stands), it observes it.
 */
export default defineConfig({
  plugins: [bundleRecord({ describeArtifacts: ['dist/index.js', 'dist/index.cjs'] })],
  build: {
    // Entry is the SOURCE, not dist/. Rollup then resolves tokens' real import graph and reports
    // what it would inline - so if this package ever gains a runtime dependency that gets bundled,
    // the record says so. Pointing at dist/ would only have observed a file copy.
    lib: { entry: 'src/generated/index.ts', formats: ['es'], fileName: () => 'index.js' },
    outDir: '.record-scratch',
    emptyOutDir: true,
    write: false,
  },
})
