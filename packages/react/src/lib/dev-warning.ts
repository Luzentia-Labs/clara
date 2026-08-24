/**
 * A warning for the developer, in development only.
 *
 * Clara does not warn at runtime as a habit - this is the first, and it exists for a specific
 * reason. D0086 removed NumberInput's out-of-range signal because it fired on valid entry, was
 * invisible to sighted users, and obliged the library to write error text it has no honest basis
 * for. Removing it left the behaviour with NO observable property: nothing a test could assert, and
 * no way to tell "we chose not to signal" apart from "the bounds wiring is broken". That was QA's
 * condition for signing off the removal, and it follows the precedent D0077 already set - a blind
 * spot is REPORTED rather than skipped.
 *
 * Three properties make it safe to ship in a library:
 *
 * - **Development only.** `process.env.NODE_ENV` is what every React bundler already replaces, so
 *   the whole call is dead code a minifier removes from a production build. The `typeof` check
 *   matters: a browser with no bundler has no `process`, and a library that throws there is worse
 *   than one that stays quiet.
 * - **Once per message.** A warning on every keystroke is noise the developer learns to filter,
 *   which is the same failure as an over-eager live region.
 * - **No user-facing copy.** It speaks to whoever is writing the code, in English, in a console.
 *   Nothing here is translated or announced.
 */
const seen = new Set<string>()

export function devWarning (condition: boolean, message: string): void {
  if (typeof process === 'undefined' || process.env?.NODE_ENV === 'production') return
  if (!condition || seen.has(message)) return
  seen.add(message)
  // eslint-disable-next-line no-console -- the whole point; see the docblock above
  console.warn(`[clara] ${message}`)
}

/** Test-only: forget what has been warned, so a case can be exercised more than once. */
export function resetDevWarnings (): void {
  seen.clear()
}
