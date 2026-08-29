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
import selectorParser from 'postcss-selector-parser'
import ts from 'typescript'
import { focusableClassGroups, claraClassesByComponent } from './lib/focusable.mjs'
import { componentsInFile } from './lib/module-exports.mjs'
import { fail, pass, readWorkspace } from './lib/workspace.mjs'

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
// `s` and `ms` were absent, so two hand-typed durations passed the literal rule while the guard
// reported "no literals". Motion is a design value like any other - D0094 turns entirely on a
// component not being able to type one - and the tier 1 duration steps exist to be referenced.
//
// `%` was absent too (BG-01M0WZGB), so `width: 25%` and `border-radius: 50%` were invisible to the
// guard whose entire job is refusing hand-typed values. It is now a unit like any other, with ONE
// exemption below.
const UNITS = 'px|rem|em|pt|pc|cm|mm|in|q|ch|ex|vh|vw|vmin|vmax|svh|lvh|dvh|ms|s'

/**
 * `100%` is exempt, and nothing else is.
 *
 * A percentage is usually a design value - `width: 25%` is a decision somebody made about how wide
 * a thing should look, and it belongs in a token like every other such decision. `100%` is not that
 * kind of statement. It means "all of the container" or "my own full extent", which is structural
 * geometry: there is no other number it could have been, and no design review would ever re-tune
 * it.
 *
 * Percentages inside `transform` are already covered by STRUCTURAL below, which is why
 * `translateX(-100%)` and `translate(-50%, -50%)` do not need to be enumerated here - they are
 * offsets by an element's own extent, not appearance.
 */
const STRUCTURAL_PERCENT = /^100%$/

/**
 * Properties where a percentage is PLACEMENT rather than appearance.
 *
 * `top: 50%` paired with `translate(-50%, -50%)` is the centring idiom; `clip-path: circle(50%)`
 * means "a circle inscribed in this box". Neither is a design value - there is no other number
 * they could be, and no design review would re-tune them.
 *
 * Deliberately NOT added to STRUCTURAL above, which exempts a property's literals ENTIRELY.
 * `top: 13px` is a design value and must stay caught; only the percentage form is placement.
 *
 * Size and appearance properties are absent on purpose: `width: 25%` IS a decision about how wide
 * something should look, and it belongs in a token like every other such decision.
 */
const PERCENT_IS_PLACEMENT = /^(top|left|right|bottom|inset|clip-path|background-position|object-position|transform-origin)/
const LITERAL = new RegExp(
  '(#[0-9a-f]{3,8}\\b' +
  '|\\brgba?\\([^)]*\\)|\\bhsla?\\([^)]*\\)|\\boklch\\([^)]*\\)|\\boklab\\([^)]*\\)' +
  '|\\blab\\([^)]*\\)|\\blch\\([^)]*\\)|\\bcolor-mix\\([^)]*\\)|\\bcolor\\([^)]*\\)' +
  // `%` is matched WITHOUT a trailing `\\b`, and that is not a stylistic choice: `%` is not a
  // word character, so `\\b` after it demands a word character next - and a declaration ends
  // `25%;`, where both sides are non-word. A first attempt at this bug simply appended `%` to
  // UNITS above, and the probe from the bug report still reported PASS: the pattern was there
  // and matched nothing. A fix that cannot fail is the defect it was fixing.
  `|(?<![\\w-])\\d*\\.?\\d+(?:(${UNITS})\\b|%)` +
  `|(?<![\\w-])(${NAMED_COLOURS.join('|')})(?![\\w-]))`,
  'gi',
)
// Properties where a literal is structural rather than a design value.
//
// `z-index` was here and should not have been. It IS a design value - it is the whole subject of
// the layer scale - and exempting it made that scale advisory: a spec review appended
// `z-index: 999999` to this stylesheet and the guard passed. Thirteen overlay components could
// each have typed a number with every gate green, which is precisely the defect the scale exists
// to prevent ("each overlay picks a z-index and the answer becomes whichever number was typed
// last"). It is now checked separately below, because the literal regex needs a unit and a bare
// integer never matched it either.
const STRUCTURAL = /^(opacity|flex|order|grid-|line-height|font-weight|content|transform|scale)/

/**
 * Every `z-index` must resolve through the layer scale.
 *
 * A bare integer is invisible to the literal rule (which requires a unit), so this is its own
 * check. `calc()` over a layer token is allowed - the scale leaves room above `overlay` precisely
 * so a component can take `calc(var(--clara-layer-overlay) + 1)` without a token change - but only
 * as a single-digit nudge.
 *
 * Two review defeats shaped the grammar below, and both were real CSS a browser honours:
 * `Z-INDEX: 999999` walked past a case-sensitive `decl.prop !== 'z-index'` (CSS property names are
 * case-insensitive and PostCSS preserves the author's case), and
 * `calc(999999 + 0 * var(--clara-layer-overlay))` walked past a test that only asked whether the
 * value CONTAINED a layer token. Containment was never the property; resolving through the scale
 * is. Both are proved to fail in `prove-guards-fail.mjs`.
 */
const LAYER_VAR = /var\(\s*--clara-layer-[\w-]+\s*\)/gi

const zIndexProblems = (decl, where) => {
  if (decl.prop.toLowerCase() !== 'z-index') return []
  const value = decl.value.trim()
  const reject = (why) => [`${where}: z-index "${value}" ${why} - use var(--clara-layer-*), or calc() over one with a single-digit offset. A hand-typed z-index is how a stacking order becomes whichever number was typed last.`]
  if (/^(auto|inherit|initial|unset|revert)$/i.test(value)) return []

  const calc = /^calc\(([\s\S]*)\)$/i.exec(value)
  const inner = (calc ? calc[1] : value).trim()
  const tokens = inner.match(LAYER_VAR)
  // A fallback is refused DELIBERATELY, and says so. `var(--clara-layer-overlay, 0)` is legal CSS
  // and looks defensive, but the build always emits every layer token, so the fallback is either
  // dead or it is silently substituting a hand-typed stacking order on the one day the token is
  // missing - which is the day you most want a red build. Reported separately because the generic
  // "does not resolve" message left an author guessing at a shape the gate refuses on purpose
  // (US-01M0GM61 rounds 3 and 5).
  if (/var\(\s*--clara-layer-[a-z0-9-]+\s*,/.test(value)) {
    return reject('supplies a FALLBACK to a layer token. The build emits every layer token, so a '
      + 'fallback is either dead or it hides a missing token behind a hand-typed number. Drop it')
  }
  if (!tokens || tokens.length !== 1) return reject('does not resolve through exactly one layer token')

  const rest = inner.replace(LAYER_VAR, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ').trim()
  if (rest === '') return []
  if (!calc) return reject('mixes a layer token with something else')
  // Inside calc() the only thing allowed beside the token is a small +/- nudge. Multiplication,
  // division and multi-digit addends are how a hand-typed number smuggles itself back in.
  //
  // The MAGNITUDE is summed, not checked per term: `+ 9` written ten times is a hand-typed 90, and
  // written forty-five times it clears the tooltip layer, with every single term a legal nudge.
  let offset = 0
  let sign = 1
  for (const bit of rest.split(/\s+/).filter(Boolean)) {
    if (bit === '+') { sign = 1; continue }
    if (bit === '-') { sign = -1; continue }
    const term = /^([+-]?)(\d)$/.exec(bit)
    if (!term) return reject('may only add or subtract a single-digit offset from a layer token inside calc()')
    offset += (term[1] === '-' ? -1 : sign) * Number(term[2])
    sign = 1
  }
  if (Math.abs(offset) > 9) return reject(`nudges a layer token by ${offset}, and the scale admits at most 9 - a bigger offset is a hand-typed z-index spelled as a sum`)
  return []
}

/**
 * The same rule for inline styles, and for the DOM APIs that set one.
 *
 * `style={{ zIndex: 999999 }}` is not CSS this guard walks, and thirteen of the components about to
 * be written are overlays that Radix positions with inline styles as a matter of course - so a
 * `.css`-only check would have left the scale advisory exactly where it matters most. Read from the
 * JSX with TypeScript's parser, for the same reason the focusable-class list is (D0051): a regex
 * over source text is the parser this repo keeps losing to.
 *
 * The first version matched only a literal `{ zIndex: <literal> }`. A review walked past it five
 * ways: a shorthand `{ zIndex }` over a const, a computed key `{ ['zIndex']: n }`,
 * `el.style.zIndex = ...`, `style.setProperty('z-index', ...)` and `setAttribute('style', ...)`.
 * The rule is stated the other way round now - any appearance of a z-index-setting name is a
 * problem UNLESS it is a string literal that resolves through the scale - because a denylist of
 * shapes is a list of the shapes somebody happened to think of.
 */
const Z_NAMES = new Set(['zIndex', 'z-index'])

const inlineZIndexProblems = (file, rel) => {
  const out = []
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const at = (node) => `${rel}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`
  const literal = (node) => (node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : null)
  const opaque = (where, what) => [`${where}: ${what} - a z-index must be a string literal reading var(--clara-layer-*), so its value can be checked. Anything computed is a hand-typed number this gate cannot see.`]

  const check = (node, value, what) => {
    const text = literal(value)
    out.push(...(text === null ? opaque(at(node), what) : zIndexProblems({ prop: 'z-index', value: text }, at(node))))
  }

  const visit = (node) => {
    if (ts.isPropertyAssignment(node)) {
      const name = node.name
      const named = (ts.isIdentifier(name) || ts.isStringLiteral(name)) ? name.text
        : ts.isComputedPropertyName(name) ? (literal(name.expression) ?? '')
          : ''
      if (Z_NAMES.has(named)) check(node, node.initializer, 'inline zIndex is not a layer token')
    }
    // `{ zIndex }` - shorthand over a const declared somewhere else entirely.
    if (ts.isShorthandPropertyAssignment(node) && Z_NAMES.has(node.name.text)) {
      out.push(...opaque(at(node), 'inline zIndex is set from a variable'))
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken
      && ts.isPropertyAccessExpression(node.left)) {
      // `el.style.zIndex = ...`
      if (Z_NAMES.has(node.left.name.text) && /(^|\.)style$/.test(node.left.expression.getText())) {
        check(node, node.right, 'z-index assigned through element.style')
      }
      // `el.style.cssText = ...` - a whole stylesheet the CSS walk never sees.
      if (node.left.name.text === 'cssText' && /z-index/i.test(node.right.getText())) {
        out.push(...opaque(at(node), 'z-index set through cssText'))
      }
    }
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const method = node.expression.name.text
      if (method === 'setProperty' && Z_NAMES.has(literal(node.arguments[0]) ?? '')) {
        check(node, node.arguments[1], 'z-index set through style.setProperty')
      }
      if (method === 'setAttribute' && literal(node.arguments[0]) === 'style'
        && /z-index/i.test(node.arguments[1]?.getText() ?? '')) {
        out.push(...opaque(at(node), 'z-index set by writing a whole style attribute'))
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return out
}

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
    for (const m of decl.value.matchAll(/var\(\s*(--clara-[\w-]+)/gi)) {
      const name = m[1].replace(/^--clara-/, '')
      declarations++
      if (allowed.has(name)) continue
      problems.push(tier1.has(name)
        ? `${at}: reads --clara-${name}, a tier 1 primitive - component CSS may read tier 2 or tier 3 only`
        : `${at}: reads --clara-${name}, which is not a token this build emits`)
    }
    // A component may not REDEFINE a token the build emits. `--clara-layer-overlay: 999999` on a
    // component's own rule is legal CSS, inherits to every descendant, and put the hand-typed
    // number back with the z-index rule fully green - a scale is only a scale if its values come
    // from the token build.
    // `allowed` is tier 2 and tier 3 only, so redefining a tier 1 PRIMITIVE walked straight past
    // this: `--clara-layer-overlay` is emitted as `var(--clara-layer-2)`, so redefining
    // `--clara-layer-2` on a component rule moves the overlay layer with `pnpm check` green and
    // every AC passing. Not layer-specific - `--clara-color-neutral-0` escaped the same way.
    // Reading tier 1 is already refused above; redefining it has to be too, or the refusal is a
    // formality with a documented way around it (US-01M0GM61 round 4, anton-reis).
    const defined = decl.prop.replace(/^--clara-/i, '')
    if (/^--clara-/i.test(decl.prop) && (allowed.has(defined) || tier1.has(defined))) {
      problems.push(`${at}: redefines ${decl.prop}, which the token build emits - a component that redefines a token overrides it for its whole subtree, which makes the token's value a local literal`)
    }
    // A custom-property DEFINITION and a structural property are not design values.
    if (decl.prop.startsWith('--') || STRUCTURAL.test(decl.prop)) return
    for (const lit of decl.value.matchAll(LITERAL)) {
      if (/^0(px|rem|em)$/.test(lit[0])) continue
      if (STRUCTURAL_PERCENT.test(lit[0])) continue
      if (lit[0].endsWith('%') && PERCENT_IS_PLACEMENT.test(decl.prop)) continue
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
 * It is NOT a substitute for visual regression (gate 7, US-01M0WSME). It cannot see what a control
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
  // NumberInput AC2 asserts tabular figures, so a column of amounts lines up. Nothing else in the
  // repo could see this declaration disappear.
  ['.clara-input--numeric', ['font-variant-numeric']],
  // Modal AC5 says the BODY scrolls while header and footer stay put. jsdom computes no layout, so
  // no test can see it: flipping `overflow-y` to `visible` left every Modal test green, because the
  // strongest thing a jsdom test can assert is that the element exists. The declarations are the
  // only observable, which is what this contract is for.
  // `box-sizing` is here because Clara ships no reset: without it the padding and border sit
  // OUTSIDE the width, so `calc(100vw - 2 x padding)` renders wider than the viewport. Measured in
  // Chromium at 562x645 forced to content-box against 512x595 correct - and deleting it left every
  // gate green, because jsdom computes no layout.
  ['.clara-modal', ['box-sizing', 'position', 'display', 'max-height', 'background', 'color', 'border', 'border-radius']],
  /*
   * EVERY portalled panel, not just Modal (round 3, Popover).
   *
   * Modal was enrolled here and the other five were not, and the gap was not academic:
   * `.clara-popover` and `.clara-drawer` declared a background and NO `color`, so a dark-theme panel
   * took its text colour from the page while taking its background from the portal's scope -
   * measured in Chromium at 1.26:1, against 16.64:1 for the panels that declare it.
   *
   * Four gates were blind by construction, which is why three review rounds walked past it: axe
   * disables `color-contrast`, jsdom resolves no `var()`, `check-contrast` measures only DECLARED
   * pairings (and with no fg token there was no pairing to declare), and this contract - the one
   * whose own message says "a control with no color is invisible to every test that runs in jsdom" -
   * did not list the class.
   *
   * A portalled surface is exactly where this bites, because it is the one place a panel cannot
   * inherit from where it was written.
   */
  ['.clara-modal__scrim', ['position', 'inset', 'background']],
  ['.clara-popover', ['box-sizing', 'background', 'color', 'border', 'border-radius', 'max-block-size', 'overflow-y']],
  // `max-block-size` is not decoration: without it a bottom drawer with long content grows past
  // the viewport and its footer becomes unreachable. It was deletable with every gate green.
  ['.clara-drawer', ['box-sizing', 'position', 'background', 'color', 'max-block-size']],
  ['.clara-drawer__body', ['overflow-y']],
  ['.clara-drawer__body > *', ['flex-shrink']],
  ['.clara-tooltip', ['box-sizing', 'background', 'color', 'border-radius']],
  ['.clara-toast', ['box-sizing', 'background', 'color', 'border-radius']],
  ['.clara-dropdown-menu', ['box-sizing', 'background', 'color', 'border-radius', 'max-block-size', 'overflow-y']],
  /*
   * Select and Combobox, enrolled late and for the reason this whole block exists. Both shipped
   * AFTER the list above was written and neither was added to it, so the list silently exempted
   * what it forgot - the same enumeration-staleness class as `check:keyboard`'s hand-typed file
   * list (BG-01M10BWX). A review seat proved the gap by deleting `color` from the Select panel:
   * nine guards and all 26 tests stayed green, while the comment directly above that declaration
   * describes precisely the dark-on-dark failure it prevents.
   */
  /*
   * `font-size` is here for the same reason `color` is, and it was missing for the same reason.
   * A portalled panel inherits the CONSUMER's body size, not Clara's: measured on a 13px body,
   * every option label and the 1em check glyph fell under the 14px floor. The trigger is a
   * <button>, which takes the UA font entirely - 13.3333px in Chromium on a STOCK page, with no
   * consumer CSS at all. jsdom resolves no `var()` and computes no layout, so nothing else here
   * can see any of it.
   */
  ['.clara-select', ['font-size']],
  ['.clara-select__listbox-panel', ['box-sizing', 'background', 'color', 'font-size', 'border', 'border-radius', 'max-block-size', 'overflow-y']],
  ['.clara-combobox__panel', ['box-sizing', 'background', 'color', 'font-size', 'border', 'border-radius', 'max-block-size', 'overflow-y']],
  /*
   * The activedescendant CURSOR needs a SECOND CHANNEL, not just a background (D0124). The tint
   * alone measures 1.14:1 light and 2.28:1 dark against the panel, and jsdom resolves no `var()`
   * and computes no layout, so no test in this repository can see the bar appear or disappear.
   * These two entries are the only thing standing between the colour-alone defect and a green run.
   */
  ['.clara-select__option--active', ['background', 'box-shadow']],
  ['.clara-combobox__option--active', ['background', 'box-shadow']],
  // The CHOICE's glyph. Deleting its colour makes it inherit the option's, which erases the
  // distinction between cursor and choice that the option state model exists to draw.
  ['.clara-select__check', ['color', 'forced-color-adjust']],
  // The group label's SECOND channel. Colour alone would leave a heading indistinguishable from the
  // options beneath it - identical size, indent and weight - and identical in colour too under
  // forced-colors, where both resolve to CanvasText.
  ['.clara-combobox__group-label', ['font-size', 'font-weight']],
  ['.clara-combobox__check', ['color', 'forced-color-adjust']],
  // MultiSelect, enrolled with the component rather than after it.
  ['.clara-multi-select__trigger', ['font-size']],
  ['.clara-multi-select__listbox-panel', ['box-sizing', 'background', 'color', 'font-size', 'border', 'border-radius', 'max-block-size', 'overflow-y']],
  ['.clara-multi-select__option--active', ['background', 'box-shadow']],
  ['.clara-multi-select__check', ['color', 'forced-color-adjust']],
  // DatePicker, enrolled with the component.
  ['.clara-date-picker__input', ['font-size']],
  ['.clara-date-picker__panel', ['box-sizing', 'background', 'color', 'font-size', 'border', 'border-radius', 'max-block-size', 'overflow-y']],
  ['.clara-date-picker__day--focused', ['background', 'box-shadow']],
  ['.clara-date-picker__day--selected', ['background', 'color']],
  ['.clara-date-picker__day--unavailable', ['color']],
  ['.clara-modal__body', ['overflow-y']],
  // A flex column shrinks its children by default, so a fixed-height child is squashed rather than
  // scrolled. The rule that stops it is on the CHILDREN, and nothing else can see its absence.
  ['.clara-modal__body > *', ['flex-shrink']],
  ['.clara-modal__header', ['display']],
  ['.clara-modal__footer', ['display']],
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
 * Where the VALUE is the contract, not merely the declaration.
 *
 * SHAPE_CONTRACT asserts a property is declared, which is the right check for "this control has a
 * box". It is the wrong check whenever a specific value is the criterion: a review flipped
 * `.clara-modal__body` to `overflow-y: visible` - the exact mutant Modal's AC5 names - and every
 * Modal test, the CSS guard and the whole AC gate stayed green, because the property was still
 * declared. Presence and correctness are different questions and both are worth asking.
 *
 * `[selector, prop, test, why]`. `test` receives the declared value, lowercased and trimmed.
 */
const VALUE_CONTRACT = [
  // `[selector, family, ok(prop, value), why]`. The family is a PREFIX: every `overflow*`,
  // `background*` and `flex*` declaration on the element is checked, so a property nobody thought
  // to enumerate fails rather than slips through.
  ['.clara-popover', 'overflow', (prop, v) => (
    prop === 'overflow-y' ? v === 'auto' || v === 'scroll' : !/(^|\s)(visible|hidden)(\s|$)/.test(v)
  ), 'a positioned panel must SCROLL its overflow, not show it: the popper wrapper is `position: fixed`, so anything past the viewport edge cannot be reached by the browser or by the page. The `overflow` shorthand sets it too'],
  ['.clara-dropdown-menu', 'overflow', (prop, v) => (
    prop === 'overflow-y' ? v === 'auto' || v === 'scroll' : !/(^|\s)(visible|hidden)(\s|$)/.test(v)
  ), 'a positioned menu must SCROLL its overflow - a thirty-entry menu past the viewport edge is unreachable under a fixed wrapper'],
  ['.clara-modal__body', 'overflow', (prop, v) => (
    prop === 'overflow-x' ? true : /^(auto|scroll|overlay)$/.test(v.split(/\s+/)[0] ?? '')
  ), 'the BODY is the scroll container (AC5); `visible` scrolls the whole panel and takes the header and footer with it. The `overflow` shorthand sets it too'],
  ['.clara-modal__body > *', 'flex', (prop, v) => (
    prop === 'flex-shrink' ? v === '0' : prop === 'flex' ? /^0(\s|$)/.test(v) : true
  ), 'children of the scroll container must not shrink (AC5) - a flex column squashes a fixed-height chart to nothing instead of scrolling it, and the `flex` shorthand resets flex-shrink to 1'],
  // Drawer's body is the scroll container for the same reason Modal's is, and Drawer AC6 makes the
  // same claim - but only Modal was enrolled, so `overflow-y: visible` on `.clara-drawer__body`
  // passed every gate. A contract that covers one of two components implementing one rule is how
  // the rule comes back in the component nobody enrolled.
  ['.clara-drawer__body', 'overflow', (prop, v) => (
    prop === 'overflow-x' ? true : /^(auto|scroll|overlay)$/.test(v.split(/\s+/)[0] ?? '')
  ), 'the BODY is the scroll container; `visible` scrolls the whole panel and carries the header and footer away with it. The `overflow` shorthand sets it too'],
  ['.clara-drawer__body > *', 'flex', (prop, v) => (
    prop === 'flex-shrink' ? v === '0' : prop === 'flex' ? /^0(\s|$)/.test(v) : true
  ), 'children of the scroll container must not shrink - a flex column squashes a fixed-height chart to nothing instead of scrolling it, and the `flex` shorthand resets flex-shrink to 1'],
  ['.clara-modal', 'background', (prop, v) => (
    prop === 'background-image' ? v === 'none' : v.includes('--clara-color-bg-surface')
  ), 'the panel is an opaque surface that resolves per theme; a scrim, a fixed colour or a gradient renders a dark modal on a light ground'],
  ['.clara-modal__scrim', 'background', (prop, v) => (
    prop === 'background-image' ? v === 'none' : v.includes('--clara-color-bg-scrim')
  ), 'the scrim is the token whose alpha was solved against page legibility (D0092)'],
  // AC9/D0088: one shared layer, and tree order separates scrim from panel. A calc() offset here is
  // a per-role constant wearing a token, and it is exactly the thing the layer scale removed.
  ['.clara-modal', 'z-index', (prop, v) => v === 'var(--clara-layer-overlay)',
    'scrim and panel share ONE layer and are separated by tree order (D0088); an offset re-introduces the per-role constant'],
  ['.clara-modal__scrim', 'z-index', (prop, v) => v === 'var(--clara-layer-overlay)',
    'scrim and panel share ONE layer and are separated by tree order (D0088)'],
]

/**
 * Properties a selector may not declare AT ALL.
 *
 * Modal has no motion, decided rather than omitted (D0094): a centred dialog has no spatial origin,
 * and shipping the reduced-motion treatment as the only treatment means Clara can add motion later
 * but never take it away from somebody relying on its absence. The stylesheet said "the absence is
 * asserted, not assumed" while nothing asserted it - adding both a `transition` and an `animation`
 * left the full suite and every guard green.
 */
// `.clara-skeleton` joins the list by ruling, not by omission: D0100 decided a skeleton has no
// motion in EITHER preference, because its information is its shape and a shimmer adds nothing
// the shape has not said. Without this, the next author 'improves' it back in.
const NO_MOTION = ['.clara-modal', '.clara-modal__scrim', '.clara-modal__body', '.clara-modal__header', '.clara-modal__footer',
  '.clara-skeleton', '.clara-skeleton-group']

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
/**
 * A selector is in scope when the component owns its BASE class - stripping the modifier, and any
 * attribute or pseudo qualifiers. `.clara-input[readonly]:not([aria-disabled="true"])` reduces to
 * `.clara-input`, which Input owns; comparing the whole selector string left it outside every
 * scoped run, so the criterion asserting readonly contrast could not fail on its own component.
 */
const baseClass = (selector) => (/^\.[\w-]+/.exec(selector)?.[0] ?? selector).split('--')[0]
const inScope = owned ? (selector) => owned.has(baseClass(selector)) : () => true

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

// Declared values, for the selectors where the value IS the criterion.
//
// Two asymmetries, both learned the hard way in review:
//
// 1. SATISFYING a contract needs the element's OWN unconditional rule (that is SHAPE_CONTRACT's
//    rule and it is right). VIOLATING one must consider EVERY rule that paints the element -
//    `.clara-modal .clara-modal__body { overflow-y: visible }` and
//    `.clara-modal[data-state="open"] { z-index: ... }` both defeat a string-identical match, and
//    `[data-state]` is the selector form the z-index rule's own comment says every overlay writes.
// 2. A property has a FAMILY. Checking `background` alone let `background-color` repaint the panel
//    50%-black in both themes with every gate green.
/**
 * The contract is stated as a FAMILY that fails CLOSED, and the selector is PARSED.
 *
 * Both are corrections of the same mistake. The first three versions of this check were lists of
 * literal strings, and a review walked through them one name at a time:
 * `background` -> `background-color` -> `background-image: linear-gradient(scrim, scrim)`;
 * `overflow-y` -> the `overflow` shorthand; `flex-shrink: 0` -> `flex: 1`. And the selector was
 * matched by splitting on combinators and testing the last token, which `:is(.clara-modal, .x)`
 * and `[class~="clara-modal"]` both walk past.
 *
 * A whitelist of names cannot be complete over CSS - each round supplies the next name. So the
 * rule is inverted: ANY declaration whose property matches the family prefix must satisfy the
 * contract, so an unenumerated property is a failure rather than a gap. And the selector is parsed
 * with the same parser Vite already ships rather than a split-and-pop.
 *
 * This is a floor, not a proof. The complete answer is asserting COMPUTED values on a rendered
 * panel in a real browser, which reads the cascade's output and is immune to every defeat above -
 * that is gate 9 (`pnpm check:geometry`), WIRED at ffd1319, and this review was the evidence for
 * wiring it. It is not gate 7: gate 7 is Chromatic, which diffs screenshots and so catches CHANGE
 * rather than WRONG (D0099).
 */
const familyMatches = (prop, family) => new RegExp(`^${family}(-|$)`).test(prop.toLowerCase())

/** Does this selector target the element? Parsed, not string-sliced. */
const targetsElement = (sel, base) => {
  // A contract selector may be COMPOUND - `.clara-modal__body > *` names the children of an
  // element. Comparing that whole string against class node values can never match, so that row
  // was protected only by the exact-string branch and `.clara-modal .clara-modal__body > *` walked
  // straight through, re-entering a CRITICAL at 18px one round after it was fixed. Match the
  // compound by its own shape: the class part must target, and the trailing combinator must agree.
  const compound = /^(\.[\w-]+)\s*(>|\s)\s*(\*|[.\w-]+)$/.exec(base)
  if (compound) {
    const [, parentClass, , child] = compound
    const parts = sel.trim().split(/\s*>\s*|\s+/)
    if (parts.length < 2) return false
    const last = parts[parts.length - 1]
    const childMatches = child === '*' ? true : last === child || last.includes(child.replace(/^\./, ''))
    return childMatches && parts.slice(0, -1).some((p) => targetsElement(p, parentClass))
  }
  const wanted = base.replace(/^\./, '')
  let hit = false
  try {
    selectorParser((root) => {
      root.walkClasses((node) => {
        // The base class itself, or a `--modifier` of it. NOT a `__element` of it: BEM modifier and
        // BEM element look alike to a substring test and are opposites - `.clara-modal--sm` is the
        // same element and inherits the contract, `.clara-modal__scrim` is a different one.
        if (node.value === wanted || node.value.startsWith(`${wanted}--`)) hit = true
      })
      // `[class~="clara-modal"]` selects by class without ever writing a class selector.
      root.walkAttributes((node) => {
        const v = (node.value ?? '').replace(/^["']|["']$/g, '')
        if (node.attribute === 'class' && (v === wanted || v.startsWith(`${wanted}--`))) hit = true
      })
    }).processSync(sel)
  } catch { return sel.includes(base) }
  return hit
}

for (const [selector, family, ok, why] of VALUE_CONTRACT.filter(([sel]) => inScope(sel))) {
  let satisfied = false
  for (const file of files) {
    postcss.parse(readFileSync(file, 'utf8'), { from: file }).walkRules((rule) => {
      for (const sel of rule.selectors ?? []) {
        const own = sel.trim() === selector
        if (!own && !targetsElement(sel, selector)) continue
        rule.walkDecls((decl) => {
          if (!familyMatches(decl.prop, family)) return
          const value = decl.value.trim().toLowerCase()
          if (ok(decl.prop.toLowerCase(), value)) { if (own && unconditional(rule)) satisfied = true; return }
          problems.push(`${sel.trim()} declares \`${decl.prop}: ${decl.value.trim()}\`, which does not satisfy ${selector}'s \`${family}\` contract - ${why}`)
        })
        // A blanket reset removes the whole box with nothing to point at.
        rule.walkDecls((decl) => {
          if (!/^(all)$/i.test(decl.prop)) return
          problems.push(`${sel.trim()} declares \`${decl.prop}: ${decl.value.trim()}\`, which discards every declaration the contracts rely on`)
        })
      }
    })
  }
  if (!satisfied) problems.push(`${selector} declares no \`${family}\` that satisfies its contract - ${why}`)
}

// Properties that must be absent entirely.
for (const selector of NO_MOTION.filter((sel) => inScope(sel))) {
  for (const file of files) {
    postcss.parse(readFileSync(file, 'utf8'), { from: file }).walkRules((rule) => {
      for (const sel of rule.selectors ?? []) {
        // Parsed, like every other contract. This rule was left out of that conversion and stayed
        // an exact-string match over five literals, so `.clara-modal--sm { transition: ... }` - a
        // selector Modal already ships - and `:is(.clara-modal) { animation: ... }` both passed,
        // and D0094's "the absence is asserted, not assumed" was true of five strings only.
        if (sel.trim() !== selector && !targetsElement(sel, selector)) continue
        rule.walkDecls((decl) => {
          if (!/^(transition|animation)(-|$)/.test(decl.prop.toLowerCase())) return
          // The decision differs per component, and naming the wrong one sends the reader to the
          // wrong record: a skeleton's stillness is D0100's ruling, not Modal's D0094.
          const why = selector.startsWith('.clara-skeleton')
            ? 'a skeleton has no motion in EITHER preference by decision (D0100) - its information is its SHAPE, and a shimmer adds nothing the shape has not said'
            : 'Modal has no motion by decision (D0094)'
          problems.push(`${sel.trim()} declares \`${decl.prop}\` - ${why}, not by omission. Adding one is a decision to revisit, not a stylesheet edit.`)
        })
      }
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
 * result - jsdom computes no layout. Gate 9 now reads the cascade's output in a real browser
 * (D0099); at the time this was written nothing could. A commit adding a focus ring appended a
 * second `.clara-text--truncate` whose `display: block` overrode the original `inline-block`, so a
 * truncating Text used inline became full width. That is a visual regression delivered as a
 * side-effect of an unrelated edit, which is exactly what a stylesheet makes easy.
 */
const declaredBy = new Map()
for (const file of files) {
  postcss.parse(readFileSync(file, 'utf8'), { from: file }).walkRules((rule) => {
    if (!unconditional(rule)) return
    // A keyframe selector is scoped to its own `@keyframes` block, so `to` in `clara-spin` and `to`
    // in `clara-traverse` are different rules that happen to share a name. Keying them together
    // reported the second animation in the file as overriding the first - a false positive that
    // would arrive for every component that ever adds a second keyframe.
    const keyframes = rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)
      ? `@${rule.parent.params}|`
      : ''
    for (const sel of rule.selectors ?? []) {
      if (!keyframes && !inScope(sel.split(':')[0])) continue
      rule.walkDecls((decl) => {
        const key = `${keyframes}${sel}|${decl.prop}`
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

for (const file of files) {
  postcss.parse(readFileSync(file, 'utf8'), { from: file }).walkDecls((decl) => {
    const sel = decl.parent?.selector ?? ''
    if (!inScope(sel.split(',')[0].trim().split(':')[0])) return
    problems.push(...zIndexProblems(decl, `${file.slice(root.length + 1)} (${sel})`))
  })
}

/**
 * A `z-index` on a `position: static` element is inert - the browser ignores it entirely, so a
 * portalled surface can take `var(--clara-layer-overlay)`, pass every gate, and have no stacking at
 * all. jsdom computes no layout, so no test in this repo can see it; this is the same class as
 * SHAPE_CONTRACT above, and the same cheapest check that can see it: the companion declaration must
 * exist somewhere for that selector.
 */
const positionsBySelector = new Map()
for (const file of files) {
  postcss.parse(readFileSync(file, 'utf8'), { from: file }).walkRules((rule) => {
    // Only an UNCONDITIONAL position counts. `position: fixed` inside `@media (min-width: 3000px)`
    // applies only sometimes, so it does not satisfy an obligation that holds always - the same
    // escape SHAPE_CONTRACT's docblock calls out, not carried across when this rule was written.
    if (!unconditional(rule)) return
    for (const sel of rule.selectors ?? []) {
      rule.walkDecls((decl) => {
        if (decl.prop.toLowerCase() !== 'position') return
        if (decl.value.trim().toLowerCase() === 'static') return
        // Recorded against the BASE class, because that is where a component declares its box.
        // `.clara-modal[data-state="open"] { z-index }` is satisfied by `position` on
        // `.clara-modal` - and `[data-state]` is what Radix stamps, so every overlay writes it.
        positionsBySelector.set(baseClass(sel.trim()), true)
      })
    }
  })
}
for (const file of files) {
  postcss.parse(readFileSync(file, 'utf8'), { from: file }).walkRules((rule) => {
    if (!rule.some?.((n) => n.type === 'decl' && n.prop.toLowerCase() === 'z-index')) return
    for (const sel of rule.selectors ?? []) {
      const base = baseClass(sel.trim())
      if (!inScope(base)) continue
      if (positionsBySelector.get(base)) continue
      problems.push(`${relative(root, file)}: ${sel.trim()} declares z-index but ${base} has no unconditional non-static \`position\` - z-index is inert on a statically positioned element, so the layer token has no effect`)
    }
  })
}

// The same rule over the JSX, where a Radix-positioned overlay is most likely to type one.
// Every workspace package's source, not just clara-react. `packages/icons/src` was outside both
// walks, so an inline z-index there was unchecked - and the reason to read the workspace file
// rather than hardcode a list is the one `lib/workspace.mjs` already records.
const sourceFiles = readWorkspace(root)
  .flatMap(({ dir }) => walk(join(root, dir, 'src')))
  .filter((f) => (f.endsWith('.tsx') || f.endsWith('.ts')) && !f.includes('__tests__'))
for (const file of sourceFiles) {
  problems.push(...inlineZIndexProblems(file, relative(root, file)))
}

/**
 * A spacing token may not set a size (BG-01M0WR22).
 *
 * `.clara-input--sm` floored its height on `var(--clara-space-section)` - "the gap between
 * sections". Density re-tunes that gap, correctly, as a gap: compact overrides it to 16px. So a
 * small Input in a compact scope declared a 16px floor under the 24x24 target minimum PRD:311
 * requires in every density, and nothing said so.
 *
 * The rendered gate cannot catch this. It was measured: with the 16px floor restored, the control
 * still rendered 27px because its text and padding happened to add up, and gate 9 stayed green.
 * The floor was wrong and the paint was accidentally right - which is precisely the case a
 * deterministic guard exists for, and precisely why D0096 calls text guards a FLOOR rather than a
 * lesser version of the rendered one. Here the text guard is the only one that can see it.
 *
 * `space.none` is exempt: it is this repo's idiom for a literal zero, not a spacing value.
 *
 * When Spacer arrives (PRD F06) it will legitimately set its own size from a spacing token, since
 * being a gap is the whole component. Add its selector to `SPACE_AS_SIZE_ALLOWED` rather than
 * weakening the rule.
 */
const SPACE_AS_SIZE_ALLOWED = []
const SIZE_PROPS = /^(min-|max-)?(height|width|block-size|inline-size)$/

/**
 * Resolve an alias chain to the token families it ultimately reads.
 *
 * The first version of this rule matched the literal name `--clara-space-*`, which is one hop
 * deep. `--clara-box-padding-lg` is tier 3 for `{space.section}`, so
 * `min-height: var(--clara-box-padding-lg)` restored BG-01M0WR22 verbatim - the same 16px floor in
 * compact - and passed. A rule with a documented way around it is a formality.
 */
const emitted = join(root, 'packages/tokens/dist/tokens.css')
if (!existsSync(emitted)) fail(RULE, ['packages/tokens/dist/tokens.css missing - build the tokens first'])
const definitions = new Map()
for (const line of readFileSync(emitted, 'utf8').split('\n')) {
  const m = line.match(/^\s*(--clara-[a-z0-9-]+)\s*:\s*([^;]+);/)
  if (m && !definitions.has(m[1])) definitions.set(m[1], m[2])
}
const tier2 = new Set(tiers.tier2.map((t) => `--clara-${t.name}`))
/**
 * Resolution STOPS at tier 2, which is where meaning lives. Tier 1 is a raw scale with no
 * semantics: `size.target-min` is a SIZE that happens to alias `{space.6}`, and following the
 * chain to tier 1 made the rule flag its own recommended replacement. `space.none` likewise
 * bottoms out at `space.0` and would defeat its own exemption.
 */
const semanticOf = (name, seen = new Set()) => {
  if (seen.has(name) || tier2.has(name)) return new Set([name])
  seen.add(name)
  const value = definitions.get(name)
  const refs = value ? [...value.matchAll(/var\(\s*(--clara-[a-z0-9-]+)/g)].map((m) => m[1]) : []
  if (!refs.length) return new Set([name])
  return new Set(refs.flatMap((r) => [...semanticOf(r, seen)]))
}
for (const file of files) {
  postcss.parse(readFileSync(file, 'utf8'), { from: file }).walkDecls((decl) => {
    const sel = decl.parent?.selector ?? ''
    if (!SIZE_PROPS.test(decl.prop)) return
    if (SPACE_AS_SIZE_ALLOWED.includes(sel.trim())) return
    // Inside `calc()` a spacing token is an ADJUSTMENT to a size that something else determines -
    // `calc(100% - var(--clara-space-stack))`, or the modal's viewport-max minus its padding. The
    // defect is a spacing token standing alone AS the size. Flagging the calc form was a false
    // positive on a pattern this repo already uses correctly.
    if (/calc\(/.test(decl.value)) return
    for (const ref of [...decl.value.matchAll(/var\(\s*(--clara-[a-z0-9-]+)/g)].map((m) => m[1])) {
      const roots = [...semanticOf(ref)].filter((n) => n.startsWith('--clara-space-') && n !== '--clara-space-none')
      if (!roots.length) continue
      const via = ref === roots[0] ? '' : ` (via ${ref})`
      problems.push(`${relative(root, file)}: ${sel.trim()} sets \`${decl.prop}\` from \`${roots[0]}\`${via} - ` +
        'a spacing token is re-tuned by density AS A GAP, so using it as a size silently re-tunes ' +
        'a height or a target floor. Use `--clara-size-*` (target-min, control-height)')
    }
  })
}

if (problems.length) fail(RULE, problems)
pass(RULE, `${scope ? `${scope}: ` : ''}${files.length} component stylesheet(s), ${declarations} token reference(s), all tier 2 or 3, no literals`)
