import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import './axe.js'

// RTL only auto-cleans when it detects a global `afterEach`, which it does not under Vitest
// unless `globals: true`. Without this every render accumulates in the same document, so a
// second test finds two matching elements and fails with "Found multiple elements" - and, worse,
// a query that happens to be unique still passes while asserting against a stale render.
afterEach(cleanup)

/*
 * jsdom implements no Pointer Capture API, and Radix's swipe-to-dismiss handling calls it on every
 * `pointerdown` inside a Toast. The result was `TypeError: target.hasPointerCapture is not a
 * function` raised as an UNHANDLED error - which vitest reports and then passes anyway ("this might
 * cause false positive tests"), while Stryker's runner crashed outright trying to stringify it:
 * "Test runner crashed... Cannot convert object to primitive value". So `pnpm test` was green and
 * `check:mutation-config` was red, with an error message naming neither the file nor the cause.
 *
 * These are the real semantics, not stubs that swallow the calls: capture is tracked per element and
 * per pointer id, so `hasPointerCapture` answers truthfully after a set or a release. A version
 * returning a bare `false` would let a test pass through a code path that, in a browser, had
 * captured the pointer and taken a different branch.
 */
// `typeof Element` guard, not a bare reference: this setup file also loads for suites running in
// the NODE environment (test/build/*), where there is no DOM and `Element` is undefined. Without it
// those files fail to load at all - and they fail as a SUITE with zero failing tests, so
// `pnpm test` reported "1131 passed" while a whole file never ran.
if (typeof Element !== 'undefined' && !('hasPointerCapture' in Element.prototype)) {
  const captured = new WeakMap<Element, Set<number>>()
  const proto = Element.prototype as Element
  proto.hasPointerCapture = function (pointerId: number) {
    return captured.get(this)?.has(pointerId) ?? false
  }
  proto.setPointerCapture = function (pointerId: number) {
    const ids = captured.get(this) ?? new Set<number>()
    ids.add(pointerId)
    captured.set(this, ids)
  }
  proto.releasePointerCapture = function (pointerId: number) {
    captured.get(this)?.delete(pointerId)
  }
}
