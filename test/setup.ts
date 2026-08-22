import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import './axe.js'

// RTL only auto-cleans when it detects a global `afterEach`, which it does not under Vitest
// unless `globals: true`. Without this every render accumulates in the same document, so a
// second test finds two matching elements and fails with "Found multiple elements" - and, worse,
// a query that happens to be unique still passes while asserting against a stale render.
afterEach(cleanup)
