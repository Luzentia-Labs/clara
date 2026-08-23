#!/usr/bin/env node
/**
 * Component CSS references tier 2 or tier 3 only, and contains no raw literal
 * (TRD Section 6, TRD Section 9 gate 2, AGENTS.md).
 *
 * Two rules, one reason. A component reaching past the semantic layer into a primitive is how the
 * semantic layer stops being the place a theme is changed - the output looks identical and the
 * theming quietly stops working for that component. A raw literal is the same failure without even
 * a token to grep for.
 *
 * Written as a standalone guard rather than a stylelint plugin: the rule needs the BUILD's tier
 * manifest to know which tier a token belongs to, and a lint plugin that hardcodes the tier list
 * is the name-prefix mistake this repo has already undone three times.
 *
 * Declarations come from PostCSS, not from a line regex. The first version matched
 * `^\s*([a-z-]+)\s*:\s*(.+)$` per line, which silently skipped every declaration written on the
 * same line as its selector - `.probe { margin: 12px; }` passed with a raw literal in it. That is
 * the tenth hand-rolled parser in this repo to be defeated by ordinary input; PostCSS is what Vite
 * already uses to read this exact file.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import postcss from 'postcss'
import { focusableClassGroups, claraClassesByComponent } from './lib/focusable.mjs'
import { componentsInFile } from './lib/module-exports.mjs'
import { fail, pass } from './lib/workspace.mjs'

const RULE = 'component-css'

/**
 * `--component <Name>` scopes the shape and focus contracts to one component's own selectors.
 *
 * Without it this guard is a repo-wide sweep, which is the right shape for `pnpm check` and the
 * wrong shape for an acceptance criterion: ten stories cited it unscoped as their per-component
 * "token-only styling" verifier, so one stray literal anywhere reddened all ten and isolated none -
 * exactly the anti-pattern `check-verification.mjs` articulates and refuses for itself.
 *
 * The literal and tier rules stay repo-wide either way; they are properties of the stylesheet, not
 * of a component.
 */
const scopeAt = process.argv.indexOf('--component')
const scope = scopeAt === -1 ? null : process.argv[scopeAt + 1]
const root = process.cwd()
const manifestPath = join(root, 'packages/tokens/build/tier-manifest.json')
if (!existsSync(manifestPath)) fail(RULE, ['build/tier-manifest.json missing - build the tokens first'])
const tiers = JSON.parse(readFileSync(manifestPath, 'utf8'))
const tier1 = new Set(tiers.tier1.map((t) => t.name))
const allowed = new Set([...tiers.tier2, ...(tiers.tier3 ?? [])].map((t) => t.name))

/** Colour, length and radius literals. A length of 0 is unitless and carries no design decision. */
/**
 * A raw value, in any of the forms CSS actually accepts.
 *
 * The first version matched `#hex`, `rgb()`, `hsl()`, `oklch()` and `px|rem|em` - case-sensitively.
 * A review appended five probes and every one passed: `color: red` (a named colour), `padding: 12pt`
 * and `width: 50vw` (unlisted units), `margin: 12PX` (no `i` flag), and `border-color: rebeccapurple`.
 * A guard whose entire job is catching literals let five through, which is the failure mode this
 * repo keeps finding: the check looked right and did not cover its own subject.
 */
const NAMED_COLOURS = [
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black',
  'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse',
  'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan',
  'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki', 'darkmagenta',
  'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen',
  'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise', 'darkviolet', 'deeppink',
  'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen',
  'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'greenyellow',
  'grey', 'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender',
  'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan',
  'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey', 'lightpink', 'lightsalmon',
  'lightseagreen', 'lightskyblue', 'lightslategray', 'lightslategrey', 'lightsteelblue',
  'lightyellow', 'lime', 'limegreen', 'linen', 'magenta', 'maroon', 'mediumaquamarine',
  'mediumblue', 'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue',
  'mediumspringgreen', 'mediumturquoise', 'mediumvioletred', 'midnightblue', 'mintcream',
  'mistyrose', 'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange',
  'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise', 'palevioletred',
  'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple', 'rebeccapurple',
  'red', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell',
  'sienna', 'silver', 'skyblue', 'slateblue', 'slategray', 'slategrey', 'snow', 'springgreen',
  'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'wheat', 'white',
  'whitesmoke', 'yellow', 'yellowgreen',
]
const UNITS = 'px|rem|em|pt|pc|cm|mm|in|q|ch|ex|vh|vw|vmin|vmax|svh|lvh|dvh'
const LITERAL = new RegExp(
  '(#[0-9a-f]{3,8}\\b' +
  '|\\brgba?\\([^)]*\\)|\\bhsla?\\([^)]*\\)|\\boklch\\([^)]*\\)|\\boklab\\([^)]*\\)' +
  '|\\blab\\([^)]*\\)|\\blch\\([^)]*\\)|\\bcolor-mix\\([^)]*\\)|\\bcolor\\([^)]*\\)' +
  `|(?<![\\w-])\\d*\\.?\\d+(${UNITS})\\b` +
  `|(?<![\\w-])(${NAMED_COLOURS.join('|')})(?![\\w-]))`,
  'gi',
)
// Properties where a literal is structural rather than a design value.
const STRUCTURAL = /^(z-index|opacity|flex|order|grid-|line-height|font-weight|content|transform|scale)/

const walk = (p) => !existsSync(p) ? []
  : statSync(p).isFile() ? [p]
    : readdirSync(p).flatMap((e) => (e === 'node_modules' || e === 'dist' ? [] : walk(join(p, e))))

const files = walk(join(root, 'packages/react/src')).filter((f) => f.endsWith('.css'))
const problems = []
let declarations = 0

for (const file of files) {
  const rel = relative(root, file)
  const root_ = postcss.parse(readFileSync(file, 'utf8'), { from: file })
  root_.walkDecls((decl) => {
    const at = `${rel}:${decl.source?.start?.line ?? '?'}`
    for (const m of decl.value.matchAll(/var\(\s*(--clara-[\w-]+)/g)) {
      const name = m[1].replace(/^--clara-/, '')
      declarations++
      if (allowed.has(name)) continue
      problems.push(tier1.has(name)
        ? `${at}: reads --clara-${name}, a tier 1 primitive - component CSS may read tier 2 or tier 3 only`
        : `${at}: reads --clara-${name}, which is not a token this build emits`)
    }
    // A custom-property DEFINITION and a structural property are not design values.
    if (decl.prop.startsWith('--') || STRUCTURAL.test(decl.prop)) return
    for (const lit of decl.value.matchAll(LITERAL)) {
      if (/^0(px|rem|em)$/.test(lit[0])) continue
      problems.push(`${at}: ${decl.prop} uses the literal ${lit[0]} - use a token`)
    }
  })
}

// A stylesheet set that reads no token has verified nothing.
if (files.length && !declarations) {
  problems.push(`${files.length} stylesheet(s) but no --clara- token reference - this gate checked nothing`)
}

/**
 * The shape contract: declarations a component's CSS must actually make.
 *
 * An adversarial review removed `width`, `min-height` and `border` from `.clara-input` and the
 * ENTIRE suite stayed green - every test, every guard, axe and the geometry gate included. jsdom
 * computes no layout, so nothing running there can see an input with no box, and the token gate
 * measures tokens rather than the rules consuming them. This is the cheapest check that can see it:
 * the declarations must exist. They are already forced through tier 2 by the loop above.
 *
 * It is NOT a substitute for visual regression (gate 7, US-01M0GMZW). It cannot see what a control
 * looks like - only that the rules giving it a shape are present.
 */
const SHAPE_CONTRACT = [
  ['.clara-input', ['width', 'min-height', 'border', 'background', 'color', 'padding']],
  // The decorated Input strips the inner control's box and draws it on the group instead, so the
  // group carries the same obligation - without this entry a decorated Input could lose its entire
  // visible boundary with every gate green.
  ['.clara-input-group', ['width', 'min-height', 'border', 'background', 'color', 'padding']],
  // Asserted by Checkbox AC3 ("a 24x24 hit area in compact"): without a size the control has no hit
  // area at all, and no test in this repo can see one.
  ['.clara-checkbox', ['appearance', 'min-width', 'min-height']],
  ['.clara-switch', ['appearance']],
  // The Field is the epic's centrepiece and had no entry at all: deleting its grid, its label
  // typography and its error styling left all 26 gates green.
  ['.clara-field', ['display', 'gap']],
  ['.clara-field__label', ['font-size', 'color']],
  ['.clara-field__description', ['font-size', 'color']],
  ['.clara-field__error', ['font-size', 'color']],
  // Input AC2: readonly text keeps FULL contrast - Clara does not take WCAG's exemption. Without a
  // colour there is nothing to measure and the criterion rests on nothing.
  ['.clara-input[readonly]:not([aria-disabled="true"])', ['color']],
  // `resize` is asserted by the Textarea story; deleting it left every criterion green.
  ['.clara-textarea', ['min-height', 'resize']],
  ['.clara-radio-group', ['display', 'gap']],
  ['.clara-checkbox-group', ['display', 'gap']],
  // Load-bearing twice: it hides both groups' legends so the label is not painted twice, and it
  // keeps the `(required)` marker out of the layout while leaving it in the accessible name.
  ['.clara-visually-hidden', ['position', 'width', 'height', 'overflow', 'clip-path']],
]

/**
 * Declarations a selector must NOT make. `.clara-visually-hidden` has to stay in the accessibility
 * tree, so `display: none` and `visibility: hidden` defeat its whole purpose - and either could be
 * introduced with every gate green, silently reverting D0071 and re-painting every group label
 * twice, because jsdom applies no stylesheet and no test can see it.
 */
const FORBIDDEN = [
  ['.clara-visually-hidden', { display: 'none', visibility: 'hidden' }],
]

/**
 * Every focusable thing this stylesheet renders must have a `:focus-visible` rule.
 *
 * A review deleted the whole `.clara-input:focus-visible` block and every gate stayed green - and
 * separately found three keyboard-reachable buttons that had never had a ring, under a comment
 * claiming the indicator applied to "every other control". A control that can be tabbed to and
 * cannot be seen when focused is unusable by exactly the people the tab stop was kept for (D0058),
 * and jsdom cannot see it, so this is the only place it can be caught.
 */
/**
 * Derived, not hand-written. A hand-maintained list cannot notice a focusable element nobody
 * remembered to type into it, which is exactly what happened: `.clara-link` renders an `<a href>`,
 * ships today, and had no ring for a whole epic while a comment here and D0072 both claimed the
 * indicator covered "every focusable thing this stylesheet renders".
 *
 * The class names come from the components' own JSX - any element that is focusable by virtue of
 * what it IS (an anchor with href, a button, an input, a textarea, or an explicit tabIndex).
 */
const FOCUSABLE = focusableClassGroups()

const FOCUS_RING_PROPS = ['outline', 'box-shadow']

const focusRings = new Map()
for (const file of files) {
  postcss.parse(readFileSync(file, 'utf8'), { from: file }).walkRules((rule) => {
    for (const sel of rule.selectors ?? []) {
      if (!sel.endsWith(':focus-visible')) continue
      const base = sel.slice(0, -':focus-visible'.length)
      const declared = focusRings.get(base) ?? new Set()
      rule.walkDecls((decl) => declared.add(decl.prop))
      focusRings.set(base, declared)
    }
  })
}
/**
 * The selectors a component owns, read from what it RENDERS.
 *
 * The first version derived them from the name - `.clara-` + kebab(NumberInput) - which matches
 * nothing at all, because the real selectors are `.clara-number` and `.clara-input`. Three stories
 * therefore cited a verifier that could not fail on their own component: the exact anti-pattern
 * scoping was added to remove, arrived at through the exact failure this repo keeps finding.
 */
const OWNED = claraClassesByComponent()
if (scope && !OWNED.has(scope)) {
  fail(RULE, [
    `${scope} renders no Clara class names, or is not a component under packages/react/src.`,
    'An empty scope would pass on everything, which is how a typo turns an acceptance criterion into nothing.',
  ])
}
const owned = scope ? OWNED.get(scope) : null
// A modifier belongs to whoever owns its base.
const inScope = owned ? (selector) => owned.has(selector.split('--')[0]) : () => true

// A focusable element whose class list cannot be resolved statically is a blind spot, and a blind
// spot reported to nobody is the same as none. `TableSortButton` rendered a class-less <button> and
// was skipped in silence until this was made loud.
for (const { where, file } of FOCUSABLE.unresolved ?? []) {
  // Attributed by what the FILE exports, not by its name. `if (scope) continue` meant the check
  // existed only on the path no acceptance criterion takes - and then attributing it by filename
  // put `Field/index.tsx` outside `--component Field`, which is the same failure one step along.
  if (scope && !componentsInFile(file).includes(scope)) continue
  problems.push(`${where} is focusable and carries no resolvable Clara class - it cannot be checked for a focus ring, so give it one`)
}

for (const group of FOCUSABLE.filter((g) => g.some(inScope))) {
  // An element is covered if ANY of its class names carries a complete ring: a textarea renders
  // `cx('clara-input', 'clara-textarea')` and takes its indicator from the first.
  const covering = group.map((sel) => focusRings.get(sel)).filter(Boolean)
  const selector = group.join(' + ')
  if (!covering.length) {
    problems.push(`${selector} is focusable and has no \`:focus-visible\` rule - a control that can be tabbed to and not seen is unusable`)
    continue
  }
  const declared = new Set(covering.flatMap((d) => [...d]))
  // Existing is not the same as drawing. Replacing the indicator's three declarations with a colour
  // change, leaving the selector list intact, removed D0054's two-part ring from all seven controls
  // with every gate green - the selector was checked and the declarations were not.
  for (const prop of FOCUS_RING_PROPS) {
    if (!declared.has(prop)) {
      problems.push(`${selector}:focus-visible declares no \`${prop}\` - the indicator is two-part (D0054), and a selector that draws nothing is not a focus ring`)
    }
  }
}

const unconditional = (rule) => {
  // A rule inside @media/@supports applies only sometimes, so it is neither a conflicting
  // redeclaration of an unconditional one nor a substitute for it. `walkRules` descends into them
  // and both new matchers were blind: a breakpoint override read as a conflict (making ordinary
  // responsive CSS unlandable), and a required declaration hiding inside a query read as present.
  for (let node = rule.parent; node; node = node.parent) {
    if (node.type === 'atrule' && /^(media|supports|container)$/.test(node.name)) return false
  }
  return true
}

for (const [selector, banned] of FORBIDDEN.filter(([sel]) => inScope(sel))) {
  for (const file of files) {
    postcss.parse(readFileSync(file, 'utf8'), { from: file }).walkRules((rule) => {
      // Anywhere in the selector, in any compound. Requiring whitespace or a combinator before the
      // class missed `.clara-checkbox-group__legend.clara-visually-hidden` - the exact pair both
      // groups render - so the compound form named in this check's own docblock went unchecked.
      // No lookbehind: the leading `.` IS the delimiter, and a class may follow another class
      // directly. Requiring a non-word character before the dot meant the compound form -
      // `.clara-checkbox-group__legend.clara-visually-hidden`, which both groups render - never
      // matched, so the check named after compounds was checking only descendants.
      const targets = new RegExp(`${selector.replace('.', '\\.')}(?![\\w-])`)
      if (!(rule.selectors ?? []).some((sel) => targets.test(sel))) return
      rule.walkDecls((decl) => {
        if (banned[decl.prop] === decl.value.trim()) {
          problems.push(`${selector} declares \`${decl.prop}: ${decl.value}\`, which removes it from the accessibility tree - the point of the class is to be unseen and still READ`)
        }
      })
    })
  }
}

for (const [selector, required] of SHAPE_CONTRACT.filter(([sel]) => inScope(sel))) {
  const declared = new Set()
  for (const file of files) {
    postcss.parse(readFileSync(file, 'utf8'), { from: file }).walkRules((rule) => {
      // The element's OWN rules, matched exactly. A descendant rule like
      // `.clara-input-group .clara-input` styles the control in ONE context and does not satisfy
      // the base contract - and treating it as though it did masked the deletion of the base
      // `min-height` entirely, which is how this mutation started reporting SURVIVED.
      // Unconditional only: a `min-height` that exists solely inside `@media (min-width: 3000px)`
      // does not give the control a height, and accepting it was a live escape of the very defect
      // this contract was written for.
      if (!unconditional(rule)) return
      if (!(rule.selectors ?? []).includes(selector)) return
      rule.walkDecls((decl) => declared.add(decl.prop))
    })
  }
  if (!declared.size) {
    problems.push(`${selector} has no rule of its own - the shape contract cannot be checked, so it is not checked`)
    continue
  }
  for (const prop of required) {
    if (!declared.has(prop)) {
      problems.push(`${selector} declares no \`${prop}\`: a control with no ${prop} is invisible to every test that runs in jsdom`)
    }
  }
}

/**
 * A selector must not be declared twice with CONFLICTING values.
 *
 * Same layer, same specificity: the later rule simply wins, and nothing in this repo can see the
 * result - jsdom computes no layout and gate 7 is unwired. A commit adding a focus ring appended a
 * second `.clara-text--truncate` whose `display: block` overrode the original `inline-block`, so a
 * truncating Text used inline became full width. That is a visual regression delivered as a
 * side-effect of an unrelated edit, which is exactly what a stylesheet makes easy.
 */
const declaredBy = new Map()
for (const file of files) {
  postcss.parse(readFileSync(file, 'utf8'), { from: file }).walkRules((rule) => {
    if (!unconditional(rule)) return
    for (const sel of rule.selectors ?? []) {
      if (!inScope(sel.split(':')[0])) continue
      rule.walkDecls((decl) => {
        const key = `${sel}|${decl.prop}`
        const seen = declaredBy.get(key)
        if (seen !== undefined && seen !== decl.value.trim()) {
          problems.push(
            `${sel} declares \`${decl.prop}\` twice with different values ("${seen}" then "${decl.value.trim()}") - ` +
            'the later one silently wins, and no test in this repo can see the difference',
          )
        }
        declaredBy.set(key, decl.value.trim())
      })
    }
  })
}

if (problems.length) fail(RULE, problems)
pass(RULE, `${scope ? `${scope}: ` : ''}${files.length} component stylesheet(s), ${declarations} token reference(s), all tier 2 or 3, no literals`)
