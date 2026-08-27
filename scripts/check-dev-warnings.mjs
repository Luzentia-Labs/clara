/**
 * A development-only warning must really be ELIMINABLE from a production build.
 *
 * `lib/dev-warning.ts` promises exactly that: "`process.env.NODE_ENV` is what every React bundler
 * already replaces, so the whole call is dead code a minifier removes from a production build."
 * Nothing checked it, and the promise is the entire reason a library is allowed to ship a runtime
 * warning at all.
 *
 * It was not idle. A review measured Tooltip's trigger check - a `setTimeout`, a selector match and
 * a ~330-byte message - sitting OUTSIDE the guard in `dist/clara-client-Tooltip.js`, so every
 * consumer's production bundle carried code that could only ever produce a warning they would never
 * see. The guard now wraps the whole check; this proves it, and would catch the next one.
 *
 * The check is the real thing rather than a proxy for it: each chunk that uses `devWarning` is
 * bundled with `NODE_ENV` defined to `production` and minified, exactly as a consumer's bundler
 * does, and the dev-only text must be GONE. Asserting instead that the source contains a guard
 * would pass on a guard placed where it eliminates nothing.
 */
import { readFileSync, existsSync, readdirSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import { fail, pass } from './lib/workspace.mjs'

const RULE = 'dev-warnings'
const root = process.cwd()
const SRC = join(root, 'packages/react/src/components')
const DIST = join(root, 'packages/react/dist')

const ESBUILD = ['node_modules/.pnpm/node_modules/.bin/esbuild', 'node_modules/.bin/esbuild']
  .map((p) => join(root, p)).find((p) => existsSync(p))
if (!ESBUILD) fail(RULE, ['esbuild not found - it is a vite dependency and should be installed'])

/** Components whose SOURCE calls devWarning, so the set cannot drift from the code. */
const users = readdirSync(SRC, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .filter((e) => {
    const file = join(SRC, e.name, `${e.name}.tsx`)
    return existsSync(file) && /\bdevWarning\s*\(/.test(readFileSync(file, 'utf8'))
  })
  .map((e) => e.name)

if (!users.length) {
  fail(RULE, ['no component calls devWarning - either the helper is dead, or this guard stopped finding them'])
}

/*
 * The strings that must not survive. Taken from the SOURCE of each caller rather than hardcoded, so
 * a reworded message cannot quietly stop being checked - which is the drift that makes a
 * denylist-shaped guard rot.
 */
const problems = []
const stage = mkdtempSync(join(tmpdir(), 'clara-devwarn-'))
try {
  for (const name of users) {
    const chunk = join(DIST, `clara-client-${name}.js`)
    if (!existsSync(chunk)) {
      problems.push(`${name} calls devWarning but has no built chunk at ${chunk} - run \`pnpm build\``)
      continue
    }
    const source = readFileSync(join(SRC, name, `${name}.tsx`), 'utf8')
    // Every string literal of 24+ characters passed to devWarning, as a proxy-free sample of the
    // message: if the call survives minification, its text does.
    /*
     * Sample the strings passed to `devWarning`, not every long literal in the file.
     *
     * The previous sampler took any single-quoted run of 24+ characters that was not an import or a
     * path. That is not "the warning message", it is "a long string", and the two coincided only by
     * luck. Combobox has `'clara-combobox--disabled'` - a CSS class name of exactly 24 characters
     * which MUST survive a production build - and the guard reported it as dev-only text shipping to
     * every consumer. A guard that fails on correct code is worse than one that misses, because the
     * way past it is to weaken it.
     *
     * The call site is the honest boundary: walk from each `devWarning(` to its balancing paren and
     * take the literals inside. That is exactly the text this guard's docblock is about.
     */
    const phrases = []
    for (const call of source.matchAll(/\bdevWarning\s*\(/g)) {
      let depth = 1
      let i = call.index + call[0].length
      for (; i < source.length && depth > 0; i++) {
        if (source[i] === '(') depth++
        else if (source[i] === ')') depth--
      }
      const args = source.slice(call.index + call[0].length, i - 1)
      // Both quoting styles: a message long enough to need concatenation uses either, and a
      // template literal's static chunks ship the same way.
      for (const m of args.matchAll(/'([^'\\]{24,})'|`([^`\\$]{24,})`/g)) phrases.push(m[1] ?? m[2])
    }
    if (!phrases.length) {
      problems.push(`${name} calls devWarning but no message text could be sampled from its source`)
      continue
    }
    const out = join(stage, `${name}.js`)
    execFileSync(ESBUILD, [
      chunk, '--bundle', '--format=esm', '--minify',
      '--define:process.env.NODE_ENV="production"',
      '--external:react', '--external:react-dom', '--external:@radix-ui/*',
      '--external:@luzentialabs/*', '--external:./*',
      `--outfile=${out}`,
    ], { cwd: root, stdio: 'pipe' })
    const built = readFileSync(out, 'utf8')
    const survived = phrases.filter((p) => built.includes(p))
    if (survived.length) {
      problems.push(
        `${name}: dev-only text survives a production minify, so it ships to every consumer - ` +
        `the guard is missing or placed where it eliminates nothing. First: "${survived[0].slice(0, 60)}..."`,
      )
    }
  }
} finally {
  rmSync(stage, { recursive: true, force: true })
}

if (problems.length) fail(RULE, problems)
pass(RULE, `${users.length} component(s) call devWarning [${users.join(', ')}]; every message is eliminated by a production minify`)
