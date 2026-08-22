/**
 * Does this EMITTED chunk contain client-only React code?
 *
 * Deliberately independent of the chunk planner. The planner decides placement by parsing source;
 * if that reader has a blind spot, it misplaces a module - and a guard that re-derives placement
 * with the SAME reader iterates an empty set and reports PASS. One reader was a single point of
 * failure for both, which is how a `"use client"` component shipped unmarked with every gate green.
 *
 * This reads the built bytes and asks a different question: does a chunk that carries no directive
 * use a hook that only works on the client? It cannot be fooled by how the source was written,
 * because by this point the source is gone.
 */

// Hooks that require a client component. `useId`, `useMemo` and `useCallback` are omitted on
// purpose: they are not, on their own, evidence of client-only code, and a guard that cries wolf
// gets switched off.
const CLIENT_ONLY_HOOKS = [
  'useState', 'useReducer', 'useEffect', 'useLayoutEffect', 'useInsertionEffect',
  'useContext', 'useImperativeHandle', 'useSyncExternalStore', 'useTransition',
  'useDeferredValue', 'useOptimistic', 'useActionState', 'useFormStatus',
]

/**
 * The client-only hooks a chunk imports from React.
 *
 * Matches the import/require site rather than the call site, because a bundler minifies
 * `useState` to a single letter at the point of use but must keep the real name in the specifier
 * it imports.
 */
export function clientHooksUsed (code) {
  const found = new Set()
  // ESM: `import { useState as a, useRef as b } from "react"`
  for (const m of code.matchAll(/import\s*\{([^}]*)\}\s*from\s*["']react["']/g)) addFrom(m[1], found)
  // CJS: `const a = require("react"); a.useState(...)` - the property access survives minification.
  for (const m of code.matchAll(/require\(\s*["']react["']\s*\)/g)) {
    void m
    for (const hook of CLIENT_ONLY_HOOKS) {
      if (new RegExp(`\\.${hook}\\b`).test(code)) found.add(hook)
    }
  }
  // Namespace or direct reference, minified or not.
  for (const hook of CLIENT_ONLY_HOOKS) {
    if (new RegExp(`\\b${hook}\\s*\\(`).test(code)) found.add(hook)
  }
  return [...found].sort()
}

function addFrom (clause, found) {
  for (const part of clause.split(',')) {
    const name = part.split(' as ')[0].trim()
    if (CLIENT_ONLY_HOOKS.includes(name)) found.add(name)
  }
}

export { CLIENT_ONLY_HOOKS }
