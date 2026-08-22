import { defineConfig } from 'vitest/config'

/**
 * Unit, interaction and accessibility harness.
 *
 * Coverage thresholds are D0014's values and are NOT softened to what an empty source set can
 * earn. Today they are close to vacuous - both packages export `export {}`, so there is almost
 * nothing to cover - which is exactly why `pnpm test:gate-fires` exists: it proves the gate can
 * fail rather than trusting that a green number means anything. The numbers become load-bearing
 * with the first component (US-01M0GM69).
 */
export default defineConfig({
  // Stated explicitly rather than inherited from tsconfig: Vitest configures esbuild itself, and
  // the root has no tsconfig covering `test/`. Without this, JSX compiles to the classic runtime
  // and every test throws "React is not defined".
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['packages/*/src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}', 'scripts/**/*.test.{ts,tsx}'],
    css: true,
    coverage: {
      provider: 'v8',
      // CR-01M0MBGN: `scripts/lib` is inside the coverage surface. All seven Criticals across seven
      // review rounds lived in the guard layer, and it was the only code no quality gate measured -
      // the reviewer was doing the job a test suite should have done, at ~180k tokens a pass.
      //
      // `scripts/check-*.mjs` are top-level scripts that call process.exit; they are proven by
      // `prove-guards-fail.mjs` at the integration level, which is the honest place for them. Stated
      // rather than papered over with a lower threshold.
      include: ['packages/*/src/**/*.{ts,tsx}', 'scripts/lib/**/*.mjs'],
      exclude: [
        '**/*.d.ts',
        'packages/tokens/src/generated/**',
        '**/__tests__/**',
        // Executable scripts, not modules: they run top-level and call process.exit, so unit
        // coverage would mean asserting on a process. They are proven at the integration level by
        // `prove-guards-fail.mjs`, which now pins each rule by its own diagnostic (CR-01M0MBGN AC3).
        // Stated here rather than hidden by lowering a threshold.
        'scripts/lib/finalize-dual.mjs',
        'scripts/lib/bundle-record.mjs',
      ],
      reporter: ['text-summary'],
      thresholds: { statements: 90, branches: 85 },
    },
  },
})
