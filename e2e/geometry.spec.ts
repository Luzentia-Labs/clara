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
  targets: { label: string; width: number; height: number; hitCovers24: boolean }[]
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
        const half = targetMin / 2 - 0.5 // just inside the square, so an exactly-24px box passes
        // A styled checkbox hides its real <input> and paints a sibling <span>, so "is the hit the
        // control or a descendant?" reports a 24x24 box as unreachable when a click on it works
        // perfectly. The activating region is the whole label, wrapping or `for`-linked.
        const id = control.getAttribute('id')
        const region = control.closest('label')
          ?? (id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null)
          ?? control
        const activates = (hit: Element | null) => !!hit && (region.contains(hit) || hit.contains(control))
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
              })
            }
          }

          // A caption is a deliberate 12px role (`--clara-font-caption`), so it is held to the
          // absolute floor rather than the body floor. Whether a Field DESCRIPTION should be a
          // caption at all is a design question, not a geometry one - it is raised in
          // BG-01M0WQ0X's notes for the Idris seat rather than settled by this gate.
          const CAPTION = '.clara-field__description, .clara-choice__description'
          const texts = textNodes(c).map((el) => ({
            text: (el.textContent ?? '').trim().slice(0, 40),
            fontSize: parseFloat(getComputedStyle(el).fontSize),
            caption: el.matches(CAPTION),
          }))
          // An input's value is text too, and it is the text a user reads most in an ERP form.
          for (const el of c.querySelectorAll('input, textarea')) {
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
        else if (m.kind === 'text' && !t.caption && t.fontSize < BODY_MIN) belowBody.push(`${m.density}/${m.id} "${t.text}": ${t.fontSize}px`)
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
