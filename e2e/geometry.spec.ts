import { expect, test } from '@playwright/test'
import { join } from 'node:path'
// @ts-expect-error - a plain .mjs helper, deliberately not part of the typed package surface
import { buildGeometryFixture } from '../scripts/build-geometry-fixture.mjs'

/**
 * Gate 9 - computed geometry (TSD Section 7).
 *
 * Every assertion here reads a box the browser laid out. That is the whole point of the file:
 * the gate this replaces resolved `{space.3}` references in Node and compared the resulting
 * numbers to each other, which cannot see a control whose token says 40px and whose rendered box
 * is 36px because of a `box-sizing`, padding or flex bug. Modal's review found both of those
 * shapes (BG-01M0WQ0X).
 *
 * TSD Section 6 states the rule this file exists to honour: a correctness claim needs a computed
 * assertion, and "this control is 40px tall" is a correctness claim about rendered output.
 */

const FIXTURE = join(process.cwd(), 'e2e/fixtures/geometry.html')

/** TSD Section 7 rows 1-2, and PRD:308. `md` is the density-driven size (PRD:399). */
const CONTROL_HEIGHT = { comfortable: 40, compact: 32 } as const

/** TSD Section 7 row 5, decided in D0037 and recorded in design/foundations.md:233. */
const ADJACENT_TARGET_GAP = { comfortable: 8, compact: 4 } as const

/** WCAG 2.2 SC 2.5.5 / 2.5.8 floor, held in BOTH densities (PRD:311). */
const TARGET_MIN = 24

/** PRD:333 - body never below 14px; 12px is reserved for non-essential metadata. */
const BODY_MIN = 14
const ABSOLUTE_TEXT_MIN = 12

/** The element whose box IS the control, per case. Named rather than guessed. */
const CONTROL_SELECTOR: Record<string, string> = {
  'button-md': 'button',
  'iconbutton-md': 'button',
  'input-md': 'input',
  'numberinput-md': 'input',
  'passwordinput-md': 'input',
  'searchinput-md': 'input',
}

type Measurement = {
  density: 'comfortable' | 'compact'
  id: string
  kind: string
  controls: { selector: string; height: number; width: number }[]
  targets: { label: string; width: number; height: number; hitCovers24: boolean; selfActivating: boolean }[]
  texts: { text: string; fontSize: number; caption: boolean }[]
  gaps: number[]
}

test.beforeAll(() => {
  // Built from `packages/react/dist`, so the gate measures the artifact a consumer installs.
  // A missing build throws here with an actionable message rather than producing an empty page
  // that would make every assertion below pass vacuously.
  buildGeometryFixture({ out: FIXTURE })
})

test.describe('computed geometry (TSD 7)', () => {
  let measured: Measurement[]

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await page.goto(`file://${FIXTURE}`)
    measured = (await page.evaluate(({ controlSelector, targetMin }) => {
      const rect = (el: Element) => el.getBoundingClientRect()

      /**
       * Does a `targetMin` square centred on the control resolve to something that activates it?
       *
       * The border box alone is the wrong subject: a checkbox's visual box is deliberately smaller
       * than its hit area, and PRD:486 requires the HIT AREA to clear the floor. So probe the four
       * corners of the square and accept the control itself, a descendant, or an enclosing
       * `<label>`/`<button>`/`<a>` - all of which activate the control when clicked.
       */
      const hitCovers = (control: Element) => {
        // `elementFromPoint` takes VIEWPORT coordinates and returns null outside them, so every
        // case below the fold reported its hit area as unreachable - a 58x36 button "failing" a
        // 24x24 probe. Scroll it into view first, then measure, in that order.
        control.scrollIntoView({ block: 'center' })
        const r = rect(control)
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        // Just inside the square. This was `- 0.5`, which probes 23x23 and accepts a 23px box
        // while the comment claimed it tested 24.
        const half = targetMin / 2 - 0.01
        // A styled checkbox hides its real <input> and paints a sibling <span>, so "is the hit the
        // control or a descendant?" reports a 24x24 box as unreachable when a click on it works
        // perfectly. The activating region is the whole label, wrapping or `for`-linked.
        // The activating region is the UNION of the control and its label, not one or the other.
        // Clara renders a choice control as `<input id><label for=id>` - siblings, not nested - so
        // resolving the region to "the label" made it a region that does not contain the input,
        // and every checkbox failed while all four corners were landing on the input itself.
        const id = control.getAttribute('id')
        const labelled = control.closest('label')
          ?? (id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null)
        const regions = [control, labelled].filter((el): el is Element => !!el)
        // This predicate used to also accept `hit.contains(control)`, which is true of EVERY
        // ancestor - the case wrapper, `<body>`, `<html>`. So when a corner probe missed a control
        // that was too small and landed on the page behind it, the ancestor it hit was accepted as
        // proof that the hit area covered the square. A 6x6 button passed. The gate could not fail
        // on size at any rendered size, which also makes the "27px paint" explanation recorded in
        // BG-01M0WR22 wrong: nothing about the paint was doing the hiding.
        const activates = (hit: Element | null) => !!hit && regions.some((r) => r.contains(hit))

        // Two ways to satisfy the floor, because WCAG 2.5.8 allows both and a corner probe alone
        // fails one of them wrongly:
        //
        //   1. The element's own box is at least 24x24 AND its centre is not overlaid. A ROUNDED
        //      target satisfies the floor and fails a corner probe, because the literal corner of
        //      a rounded box is not hit-testable - `elementFromPoint` there returns whatever is
        //      behind it. Tag's 24x24 remove control failed exactly this way.
        //   2. Otherwise, all four corners of the square resolve to something that activates the
        //      control. This is the case that matters for a checkbox, whose visual box is
        //      deliberately smaller than the label extending its hit area (PRD:486).
        const centreHits = activates(document.elementFromPoint(cx, cy))
        if (r.width >= targetMin && r.height >= targetMin && centreHits) return true

        return ([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).every(([dx, dy]) =>
          activates(document.elementFromPoint(cx + dx * half, cy + dy * half)))
      }

      /** Elements holding their own visible text, so a wrapper is not counted as its child's text. */
      const textNodes = (root: Element) =>
        [...root.querySelectorAll<HTMLElement>('*')].filter((el) =>
          [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim().length > 0))

      const out: unknown[] = []
      for (const scope of document.querySelectorAll<HTMLElement>('[data-density-scope]')) {
        const density = scope.dataset.densityScope
        for (const c of scope.querySelectorAll<HTMLElement>('[data-case]')) {
          const id = c.dataset.case as string
          const kind = c.dataset.kind as string

          const controls: unknown[] = []
          const sel = controlSelector[id]
          if (kind === 'control' && sel) {
            for (const el of c.querySelectorAll(sel)) {
              const r = rect(el)
              controls.push({ selector: sel, height: r.height, width: r.width })
            }
          }

          const targets: unknown[] = []
          if (kind === 'target') {
            for (const el of c.querySelectorAll('button, input:not([type="hidden"]), textarea, select, a[href]')) {
              const r = rect(el)
              targets.push({
                label: `${el.tagName.toLowerCase()}${el.getAttribute('type') ? `[${el.getAttribute('type')}]` : ''}`,
                width: r.width, height: r.height, hitCovers24: hitCovers(el),
                // Whether anything other than the control itself can activate it. A checkbox is
                // deliberately smaller than its label's hit area (PRD:486); a button is not, so a
                // button's own box has to clear the floor.
                selfActivating: !(el.closest('label')
                  ?? (el.getAttribute('id')
                    ? document.querySelector(`label[for="${CSS.escape(el.getAttribute('id')!)}"]`)
                    : null)),
              })
            }
          }

          // A caption is a deliberate 12px role (`--clara-font-caption`), so it is held to the
          // absolute floor rather than the body floor. Whether a Field DESCRIPTION should be a
          // caption at all is a design question, not a geometry one - it is raised in
          // BG-01M0WQ0X's notes for the Idris seat rather than settled by this gate.
          // A "caption" is the 12px role the type scale defines, identified by the TOKEN rather
          // than by a list of class names - a list goes stale the moment a component uses the role
          // without being added to it, and this gate then reports a design decision as a defect.
          //
          // Which text may hold that role is a design question and NOT settled: Field's
          // description and the PasswordInput/SearchInput affix labels all take it today, and an
          // interactive control's own label is hard to call "non-essential metadata" (PRD:333).
          // Raised for the Idris seat in CR-01M0WSFZ rather than decided here. This gate asserts
          // what IS settled: nothing below 12px anywhere, and body text at 14px or more.
          const captionSize = parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue('--clara-font-caption'))
          const CAPTION = '.clara-field__description, .clara-choice__description'
          // Screen-reader-only text is clipped to about a pixel and painted nowhere, so its
          // font-size is not a legibility claim. An affix button's "Show password" label is the
          // case here; holding it to the body floor measures a box the eye never sees.
          const painted = (el: Element) => {
            const r = el.getBoundingClientRect()
            return r.width > 2 && r.height > 2
          }
          const texts = textNodes(c).filter(painted).map((el) => ({
            text: (el.textContent ?? '').trim().slice(0, 40),
            fontSize: parseFloat(getComputedStyle(el).fontSize),
            caption: el.matches(CAPTION) || parseFloat(getComputedStyle(el).fontSize) === captionSize,
          }))
          // An input's value is text too, and it is the text a user reads most in an ERP form -
          // but only where the value is actually RENDERED. A checkbox's value is the string "on",
          // which is never painted, so reading it measured the UA's default control font instead
          // of any Clara text and reported 13.33px as a body-text violation.
          const VALUE_SHOWN = ['text', 'search', 'password', 'email', 'number', 'tel', 'url']
          for (const el of c.querySelectorAll('input, textarea')) {
            const type = el.getAttribute('type') ?? (el.tagName === 'TEXTAREA' ? 'text' : 'text')
            if (!VALUE_SHOWN.includes(type)) continue
            texts.push({ text: `«${(el as HTMLInputElement).value}»`, fontSize: parseFloat(getComputedStyle(el).fontSize), caption: false })
          }

          const gaps: number[] = []
          if (kind === 'spacing') {
            const boxes = [...c.querySelectorAll('button')].map(rect).sort((a, b) => a.left - b.left)
            for (let i = 1; i < boxes.length; i++) {
              const prev = boxes[i - 1]
              const cur = boxes[i]
              if (prev && cur) gaps.push(cur.left - prev.right)
            }
          }

          out.push({ density, id, kind, controls, targets, texts, gaps })
        }
      }
      return out
    }, { controlSelector: CONTROL_SELECTOR, targetMin: TARGET_MIN })) as Measurement[]
    await page.close()
  })

  test('the fixture rendered something to measure', () => {
    // Without this, every assertion below is a loop over an empty array reporting success.
    expect(measured.length).toBeGreaterThan(0)
    expect(new Set(measured.map((m) => m.density))).toEqual(new Set(['comfortable', 'compact']))
    expect(measured.filter((m) => m.kind === 'control').length).toBeGreaterThanOrEqual(6)
  })

  test('control height matches the density it is rendered in', () => {
    const wrong: string[] = []
    for (const m of measured.filter((x) => x.kind === 'control')) {
      const want = CONTROL_HEIGHT[m.density]
      for (const c of m.controls) {
        if (Math.abs(c.height - want) > 0.5) {
          wrong.push(`${m.density}/${m.id} (${c.selector}): ${c.height}px, want ${want}px`)
        }
      }
      expect(m.controls.length, `${m.density}/${m.id} matched no element`).toBeGreaterThan(0)
    }
    expect(wrong, `control heights disagree with the density scale:\n  ${wrong.join('\n  ')}`).toEqual([])
  })

  test('every interactive target clears 24x24 in both densities', () => {
    const wrong: string[] = []
    for (const m of measured.filter((x) => x.kind === 'target')) {
      expect(m.targets.length, `${m.density}/${m.id} matched no target`).toBeGreaterThan(0)
      for (const t of m.targets) {
        if (!t.hitCovers24) {
          wrong.push(`${m.density}/${m.id} ${t.label}: box ${t.width}x${t.height}, hit area does not cover ${TARGET_MIN}x${TARGET_MIN}`)
        }
        if (t.selfActivating && (t.width < TARGET_MIN || t.height < TARGET_MIN)) {
          wrong.push(`${m.density}/${m.id} ${t.label}: box ${t.width}x${t.height}, and nothing else activates it`)
        }
      }
    }
    expect(wrong, `targets below the WCAG 2.2 floor:\n  ${wrong.join('\n  ')}`).toEqual([])
  })

  test('body text never falls below its floor in either density', () => {
    const belowAbsolute: string[] = []
    const belowBody: string[] = []
    for (const m of measured) {
      for (const t of m.texts) {
        if (t.fontSize < ABSOLUTE_TEXT_MIN) belowAbsolute.push(`${m.density}/${m.id} "${t.text}": ${t.fontSize}px`)
        else if (!t.caption && t.fontSize < BODY_MIN) belowBody.push(`${m.density}/${m.id} "${t.text}": ${t.fontSize}px`)
      }
    }
    expect(belowAbsolute, `text below the absolute ${ABSOLUTE_TEXT_MIN}px minimum:\n  ${belowAbsolute.join('\n  ')}`).toEqual([])
    expect(belowBody, `body text below ${BODY_MIN}px:\n  ${belowBody.join('\n  ')}`).toEqual([])
  })

  test('adjacent interactive targets keep their density gap', () => {
    const wrong: string[] = []
    for (const m of measured.filter((x) => x.kind === 'spacing')) {
      const want = ADJACENT_TARGET_GAP[m.density]
      expect(m.gaps.length, `${m.density}/${m.id} produced no adjacent pair`).toBeGreaterThan(0)
      for (const gap of m.gaps) {
        if (gap < want - 0.5) wrong.push(`${m.density}/${m.id}: gap ${gap}px, floor ${want}px`)
      }
    }
    expect(wrong, `adjacent targets closer than the density floor:\n  ${wrong.join('\n  ')}`).toEqual([])
  })
})

/**
 * Motion, where the motion IS the information (D0100, BG-01M0WZEM).
 *
 * Separate from the measurements above because each case needs its own page: reduced motion is a
 * media preference, and `emulateMedia` applies per page rather than per element.
 *
 * What this must NOT assert, and why, because the temptation is real:
 *   - an exact duration. Pinning 800ms moves ownership of a value out of the token layer into a
 *     test, and makes retuning `duration.base` a breaking test change. The bounds below are
 *     derived from rules instead - above 333ms because WCAG 2.3.1 caps three flashes per second,
 *     below 2000ms because past that a user reads the indicator as stopped.
 *   - a keyframe NAME, or the easing bezier. The reduced-motion assertion samples properties
 *     instead, so it survives any rename.
 */
test.describe('a busy indicator states liveness (D0100)', () => {
  // Both contexts, because D0100 requires ONE ring shared with Button and a structural class
  // assertion cannot see whether the shared class actually animates in each place.
  const RINGS = [
    '[data-case="motion-button-loading"] .clara-spinner__ring',
    '[data-case="motion-spinner"] .clara-spinner__ring',
  ]

  const animationOf = (page: import('@playwright/test').Page, sel: string) => page.evaluate((s) => {
    const st = getComputedStyle(document.querySelector(s)!)
    return {
      name: st.animationName,
      seconds: parseFloat(st.animationDuration),
      iterations: st.animationIterationCount,
    }
  }, sel)

  test('it animates, and it never stops', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto(`file://${FIXTURE}`)
    for (const sel of RINGS) {
      const animation = await animationOf(page, sel)

      expect(animation.name, `${sel} declares no animation - a frozen ring reads as a broken control`).not.toBe('none')
      expect(animation.seconds).toBeGreaterThan(0)
      // The assertion that GENERALISES the bug: an indicator that animates once and stops is the
      // frozen ring in a new costume, and it would satisfy every assertion above.
      expect(animation.iterations, `${sel} runs a finite number of times, so it stops being a busy indicator`).toBe('infinite')
      // Bounds, not a value.
      expect(animation.seconds).toBeGreaterThan(1 / 3)
      expect(animation.seconds).toBeLessThan(2)
    }
  })

  test('a loading button does not resize, so the layout around it does not jump', async ({ page }) => {
    // `.clara-button__spinner { position: absolute }` is what holds this, and its deletion left the
    // ENTIRE repo green: 1200 unit tests, check:geometry, test:e2e at 34 passed, component-css and
    // stylesheets all fine. The `motion-button-loading` fixture case is `kind: 'motion'`, so the
    // geometry suite measured its animation and never its box.
    //
    // Without the absolute position the ring joins the flex row instead of overlaying the reserved
    // label, and the button grows by the ring's width the moment it starts saving - which moves
    // every control after it, mid-click.
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto(`file://${FIXTURE}`)

    const box = (c: string) => page.evaluate((sel) => {
      const el = document.querySelector(sel)!
      const r = el.getBoundingClientRect()
      return { w: r.width, h: r.height }
    }, `[data-case="${c}"] .clara-button`)

    const loading = await box('motion-button-loading')
    const idle = await box('motion-button-idle')
    expect(idle.w, 'the idle button has no width to compare against').toBeGreaterThan(0)
    // Sub-pixel layout is real; a whole pixel of drift is not what this is looking for.
    expect(Math.abs(loading.w - idle.w),
      `a loading button is ${loading.w}px against an idle ${idle.w}px - it resizes when it starts working`)
      .toBeLessThan(1)
    expect(Math.abs(loading.h - idle.h), 'a loading button changes height').toBeLessThan(1)
  })

  test('under reduced motion it displaces nothing, and still changes over time', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`file://${FIXTURE}`)

    for (const sel of RINGS) {
      const animation = await animationOf(page, sel)
      expect(animation.name, `${sel}: the motion was removed rather than replaced - a spinner that stops is a broken spinner`).not.toBe('none')
      expect(animation.iterations).toBe('infinite')
      // THE PERIOD, under `reduce` as well as under `no-preference`.
      //
      // The bounds above were applied only to the no-preference branch - that is, only to the
      // branch a motion-sensitive user never sees. Measured: dropping the reduced pulse from
      // `--clara-spinner-cycle` (800ms) to `--clara-duration-state-change` (120ms) left this gate
      // at 10 passed. A 120ms alternate pulse is roughly 8.3 luminance changes per second,
      // delivered specifically to the users who asked for less motion, and WCAG 2.3.1 bounds
      // flashing at three per second.
      //
      // The substitution has to stay slow to be a substitution at all. It is the same bound, and it
      // matters MORE here, not less.
      expect(animation.seconds, `${sel}: the reduced treatment cycles faster than 3Hz, which is the flash hazard WCAG 2.3.1 bounds`)
        .toBeGreaterThan(1 / 3)
      expect(animation.seconds, `${sel}: the reduced treatment is so slow it no longer reads as live`)
        .toBeLessThan(2)
    }

    // Sampled on one ring: they share a class, and the assertions above already proved the shared
    // class animates in BOTH contexts, which is the part a structural test cannot see.
    const sample = () => page.evaluate((sel) => {
      const st = getComputedStyle(document.querySelector(sel)!)
      return { transform: st.transform, colour: st.borderTopColor + '|' + st.borderRightColor }
    }, RINGS[0]!)

    // Three samples across the cycle: two could land symmetrically about a peak and read equal.
    const samples = []
    for (let i = 0; i < 3; i++) {
      samples.push(await sample())
      await page.waitForTimeout(220)
    }

    // Condition 1 of the Class B rule: no displacement. This is the one the vestibular response
    // is triggered by, and it is the whole reason the treatment changes under `reduce`.
    const transforms = new Set(samples.map((s) => s.transform))
    expect([...transforms], 'the reduced treatment still moves the element').toHaveLength(1)

    // Condition 2: it still changes over time, or liveness has been destroyed rather than reduced.
    const colours = new Set(samples.map((s) => s.colour))
    expect(colours.size, 'the reduced treatment is static, so it no longer says the system is working')
      .toBeGreaterThan(1)
  })
})

/**
 * A determinate bar's width is DATA, not animation (D0100).
 *
 * A transitioned width shows a number that is not the current value for the length of the
 * transition, while `aria-valuenow` already reports the new one - so a sighted user and a
 * screen-reader user read different values off the same component. The exact-zero comparison is
 * deliberate: it is what catches the 1ms transition that looks like compliance.
 */
test.describe('progress states its value rather than animating toward it (D0100)', () => {
  const FILL = (kind: string) => `[data-case="motion-progress-${kind}"] .clara-progress__fill`

  test('determinate neither animates nor transitions', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto(`file://${FIXTURE}`)
    const seen = await page.evaluate((sel) => {
      const s = getComputedStyle(document.querySelector(sel)!)
      return { animation: s.animationName, transition: s.transitionDuration, width: s.inlineSize }
    }, FILL('determinate'))

    expect(seen.animation, 'a determinate bar animating means the bar and aria-valuenow disagree').toBe('none')
    expect(seen.transition, 'a transitioned width lies about the current value for its duration').toBe('0s')
    // And it is actually showing the datum, so the assertions above are not over an empty element.
    expect(parseFloat(seen.width)).toBeGreaterThan(0)
  })

  test('indeterminate traverses, forever, and never backwards', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto(`file://${FIXTURE}`)
    const seen = await page.evaluate((sel) => {
      const s = getComputedStyle(document.querySelector(sel)!)
      return { name: s.animationName, iterations: s.animationIterationCount, direction: s.animationDirection }
    }, FILL('indeterminate'))

    expect(seen.name).not.toBe('none')
    expect(seen.iterations).toBe('infinite')
    // A bar that bounces backwards reads as a failure or an undo, which is a different message
    // from "still working".
    expect(seen.direction, 'an indeterminate bar must not reverse').toBe('normal')
  })

  test('under reduced motion it stops traversing and cycles colour instead', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`file://${FIXTURE}`)

    const sample = () => page.evaluate((sel) => {
      const s = getComputedStyle(document.querySelector(sel)!)
      return { transform: s.transform, background: s.backgroundColor }
    }, FILL('indeterminate'))

    const samples = []
    for (let i = 0; i < 3; i++) {
      samples.push(await sample())
      await page.waitForTimeout(260)
    }

    // A traverse is a TRANSLATION, which is the case condition 1 of the Class B rule exists for.
    expect([...new Set(samples.map((s) => s.transform))],
      'the reduced treatment still translates the fill').toHaveLength(1)

    // THE FILL MUST SPAN THE TRACK under `reduce`, and this is not decoration.
    //
    // The indeterminate fill is a quarter-width segment that travels. Stop it travelling without
    // widening it and you have a quarter segment parked at the start of the track - which reads as
    // "25% complete", a percentage the component does not know and explicitly refuses to claim.
    // The stylesheet widens it to 100% for exactly that reason and says so in a comment; measured,
    // deleting that one line left this gate at 10 passed, because the samples read `transform` and
    // `backgroundColor` and never the width.
    const geometry = await page.evaluate((sel) => {
      const el = document.querySelector(sel)!
      const track = el.parentElement!
      return { fill: el.getBoundingClientRect().width, track: track.getBoundingClientRect().width }
    }, FILL('indeterminate'))
    expect(geometry.track, 'the indeterminate track has no width to measure against').toBeGreaterThan(0)
    expect(geometry.fill / geometry.track,
      'under reduced motion the fill is a parked segment, which reads as a percentage the bar does not know')
      .toBeGreaterThan(0.99)

    // The period, for the same reason it is bounded on the spinner: a fast colour cycle delivered
    // to a user who asked for less motion is a flash hazard, not a reduction.
    const cycle = await page.evaluate((sel) => parseFloat(getComputedStyle(document.querySelector(sel)!).animationDuration), FILL('indeterminate'))
    expect(cycle, 'the reduced colour cycle is faster than 3Hz, which is the flash hazard WCAG 2.3.1 bounds')
      .toBeGreaterThan(1 / 3)
    // And liveness survives, or the motion was destroyed rather than reduced.
    expect(new Set(samples.map((s) => s.background)).size,
      'the reduced treatment is static, so it no longer says the system is working').toBeGreaterThan(1)
  })
})
