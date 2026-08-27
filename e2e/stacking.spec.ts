import { expect, test } from '@playwright/test'
import { createServer, type Server } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'

/**
 * The overlay behaviours that only exist in a browser.
 *
 * Two of them so far, and both are here for the same reason: jsdom lays nothing out. It computes no
 * geometry, resolves no `var()`, and has no pointer. Any verdict it reached about a grace-area
 * polygon or about which of two overlapping surfaces the user's click lands on would be a false
 * green by construction - which is the failure this project has now found in its own gates several
 * times, so these assertions are made where the mechanism actually runs.
 *
 * Storybook is the vehicle rather than a server-rendered fixture, because a portalled overlay does
 * not exist in a static render at all (BG-01M0XVXS): it is mounted by an effect, on the client,
 * after hydration. Driving a real Storybook build is the only way to get a live one on screen.
 *
 * ONE TRAP, recorded because it produced a false negative here first. Storybook imports
 * `@luzentialabs/clara-react/styles.css` - the BUILT package, not `packages/react/src/styles.css`.
 * So a mutation probe against this suite must `pnpm build` before `pnpm check:storybook`, or the
 * mutation never reaches the browser and every test passes, which reads as "the assertion is
 * insensitive" when in fact the assertion was never challenged. Proved after rebuilding: dropping
 * the toast viewport to `--clara-layer-overlay` turns the arrival test red.
 */

const STATIC = join(process.cwd(), 'apps/storybook/storybook-static')
const TYPES: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.png': 'image/png',
}

let server: Server
let origin: string

test.beforeAll(async () => {
  if (!existsSync(join(STATIC, 'iframe.html'))) {
    // Loud, not skipped, for the reason storybook.spec.ts records: a suite that quietly passes
    // when the thing it tests was never built is exactly the defect this project keeps finding.
    throw new Error(
      `no Storybook build at ${STATIC} - run \`pnpm check:storybook\`, which builds it first`,
    )
  }
  server = createServer((req, res) => {
    const path = (req.url ?? '/').split('?')[0] ?? '/'
    const file = join(STATIC, path === '/' ? 'index.html' : decodeURIComponent(path))
    if (!file.startsWith(STATIC) || !existsSync(file)) { res.writeHead(404); res.end(); return }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
    res.end(readFileSync(file))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  origin = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`
})

test.afterAll(async () => {
  // Guarded, because `beforeAll` can throw BEFORE `server` is assigned - and it does so
  // deliberately, with a loud "no Storybook build" message. Dereferencing `server` unconditionally
  // replaced that message with `TypeError: Cannot read properties of undefined (reading 'close')`,
  // so the one error written to be unmissable was the one thing the operator never saw. Measured: it
  // appeared zero times in the run output.
  if (!server) return
  await new Promise<void>((resolve) => server.close(() => resolve()))
})

/**
 * WCAG 1.4.13, "hoverable": content shown on hover must remain visible while the pointer travels to
 * it, so a person can actually read it - or reach a link inside it - without it vanishing underneath
 * them. Radix implements it as a grace-area polygon over the trigger's and the content's real
 * bounding rectangles.
 *
 * The pointer is moved in STEPS through the gap rather than teleported. A single jump from trigger
 * to content lands inside the tooltip in one event and passes even with the bridge disabled, since
 * there is never a moment where the pointer is over neither element. The failure this asserts
 * against is the tooltip closing DURING the journey, so the journey has to happen.
 */
test('a tooltip stays open while the pointer travels from the trigger to it', async ({ page }) => {
  await page.goto(`${origin}/iframe.html?id=overlays-tooltip--hover-bridge&viewMode=story`)

  const trigger = page.getByRole('button', { name: 'Hover me' })
  await trigger.waitFor({ state: 'visible' })
  await trigger.hover()

  const tip = page.locator('.clara-tooltip')
  await tip.waitFor({ state: 'visible' })

  const from = await trigger.boundingBox()
  const to = await tip.boundingBox()
  expect(from, 'the trigger has no geometry').not.toBeNull()
  expect(to, 'the tooltip has no geometry').not.toBeNull()

  // It is placed BELOW the trigger, which is what makes the downward journey the real one.
  expect(to!.y, 'the tooltip is not below its trigger, so this walk tests nothing')
    .toBeGreaterThan(from!.y)

  const startX = from!.x + from!.width / 2
  const startY = from!.y + from!.height
  const endX = to!.x + to!.width / 2
  const endY = to!.y + 4
  const STEPS = 12
  for (let i = 1; i <= STEPS; i++) {
    await page.mouse.move(
      startX + ((endX - startX) * i) / STEPS,
      startY + ((endY - startY) * i) / STEPS,
    )
    // Asserted at EVERY step, not only on arrival. Checking once at the end cannot tell a bridge
    // that held from one that dropped the tooltip halfway and reopened it when the pointer landed
    // on the trigger's own grace area.
    await expect(tip, `the tooltip vanished at step ${i} of ${STEPS} on the way to it`)
      .toBeVisible()
  }
})

/**
 * The same journey with the pointer leaving in the OPPOSITE direction must close it.
 *
 * Without this, the test above passes on a tooltip that never closes at all - which is not a bridge,
 * it is a leak, and it would leave a stale explanation sitting over the page.
 */
test('a tooltip closes when the pointer leaves without reaching it', async ({ page }) => {
  await page.goto(`${origin}/iframe.html?id=overlays-tooltip--hover-bridge&viewMode=story`)

  const trigger = page.getByRole('button', { name: 'Hover me' })
  await trigger.waitFor({ state: 'visible' })
  await trigger.hover()

  const tip = page.locator('.clara-tooltip')
  await tip.waitFor({ state: 'visible' })

  const from = await trigger.boundingBox()
  const viewport = page.viewportSize()!
  // Sideways and away, in steps, staying ON SCREEN the whole time.
  //
  // The first version of this walked UPWARD to `from.y - 240`, which is a negative coordinate on
  // this story - the trigger sits 96px from the top - and a move to a point outside the viewport
  // does not deliver the `pointerleave` the close depends on. It failed while the tooltip was
  // behaving correctly, which is the same false verdict in the opposite direction.
  for (let i = 1; i <= 6; i++) {
    await page.mouse.move(
      from!.x + ((viewport.width - 8 - from!.x) * i) / 6,
      Math.max(4, from!.y - (i * 8)),
    )
  }

  await expect(tip, 'the tooltip never closes, so the bridge above proves nothing')
    .toBeHidden()
})

/**
 * D0102 - Tooltip AC7 and Toast AC7, the two directions of ONE mechanism.
 *
 * `--clara-layer-tooltip` and `--clara-layer-toast` resolve to the SAME layer deliberately, because
 * the relationship is bidirectional: a tooltip opened on a toast's action must paint above the
 * toast, and a toast arriving over an open tooltip must paint above the tooltip. No constant
 * satisfies both, so open order decides - which is what the browser already does with DOM order.
 *
 * Asserted with `document.elementFromPoint` INSIDE the overlap, never by comparing computed
 * `z-index` values. D0065 records what asserting a proxy for the property cost last time, and here
 * the proxy is worse than usual: the two elements have the same z-index BY DESIGN, so a comparison
 * would report "equal" in both directions and prove nothing either way. What a user experiences is
 * which element is hit at a point, so that is what is measured.
 */

/** The topmost element at a point, walked back up to whichever overlay owns it. */
const ownerAt = async (page: import('@playwright/test').Page, x: number, y: number) =>
  page.evaluate(([px, py]) => {
    const hit = document.elementFromPoint(px as number, py as number)
    if (!hit) return null
    const owner = hit.closest('.clara-toast, .clara-tooltip')
    return owner ? (owner.classList.contains('clara-tooltip') ? 'tooltip' : 'toast') : null
  }, [x, y])

test('a tooltip on a toast action paints above it', async ({ page }) => {
  await page.goto(`${origin}/iframe.html?id=overlays-toast--tooltip-on-a-toast-action&viewMode=story`)

  const toast = page.locator('.clara-toast')
  await toast.waitFor({ state: 'visible' })

  // Hover rather than a programmatic `.focus()`, and the ORIGINAL reason given here was wrong.
  //
  // It claimed Radix gates focus-opening on `:focus-visible`. It does not - `focus-visible` appears
  // zero times in the primitive, and the gate is `isPointerDownRef`. A scripted `.focus()` on this
  // story's Retry button DOES open the tooltip, with a real 288x52 box. Hover is used because it is
  // the route this test is about, not because focus fails.
  await page.getByRole('button', { name: 'Retry' }).hover()
  const tip = page.locator('.clara-tooltip')
  await tip.waitFor({ state: 'visible' })

  const tipBox = (await tip.boundingBox())!
  const toastBox = (await toast.boundingBox())!

  // The overlap has to be REAL, or the probe below reads a point only one of them occupies and
  // passes no matter which paints on top.
  const overlapX = Math.max(tipBox.x, toastBox.x)
  const overlapY = Math.max(tipBox.y, toastBox.y)
  const overlapRight = Math.min(tipBox.x + tipBox.width, toastBox.x + toastBox.width)
  const overlapBottom = Math.min(tipBox.y + tipBox.height, toastBox.y + toastBox.height)
  expect(overlapRight - overlapX, 'the tooltip and the toast do not overlap horizontally')
    .toBeGreaterThan(2)
  expect(overlapBottom - overlapY, 'the tooltip and the toast do not overlap vertically')
    .toBeGreaterThan(2)

  const owner = await ownerAt(page, (overlapX + overlapRight) / 2, (overlapY + overlapBottom) / 2)
  expect(owner, 'the toast covers the tooltip that explains its own action').toBe('tooltip')
})

test('a toast arriving over an open tooltip paints above it', async ({ page }) => {
  await page.goto(`${origin}/iframe.html?id=overlays-toast--toast-arriving-over-a-tooltip&viewMode=story`)

  // The tooltip goes up FIRST. That ordering is the entire subject of this test.
  await page.getByRole('button', { name: 'Explain' }).hover()
  const tip = page.locator('.clara-tooltip')
  await tip.waitFor({ state: 'visible' })

  // `dispatchEvent`, not `.click()`. A real click MOVES THE POINTER to the Notify button, which
  // takes it off Explain and closes the very tooltip this test needs open - the toast then arrives
  // over nothing and the probe reads a null box. Measured: that is exactly how this failed first.
  // Dispatching the event leaves the pointer where it is, so the tooltip is still up when the toast
  // lands, which is the situation the criterion describes.
  await page.getByRole('button', { name: 'Notify' }).dispatchEvent('click')
  const toast = page.locator('.clara-toast')
  await toast.waitFor({ state: 'visible' })
  // The entrance animation moves it, so measure once it has settled.
  await expect.poll(async () => {
    const a = await toast.boundingBox()
    await page.waitForTimeout(60)
    const b = await toast.boundingBox()
    return a && b && Math.abs(a.x - b.x) < 0.5
  }).toBe(true)

  const tipBox = (await tip.boundingBox())!
  const toastBox = (await toast.boundingBox())!

  const overlapX = Math.max(tipBox.x, toastBox.x)
  const overlapY = Math.max(tipBox.y, toastBox.y)
  const overlapRight = Math.min(tipBox.x + tipBox.width, toastBox.x + toastBox.width)
  const overlapBottom = Math.min(tipBox.y + tipBox.height, toastBox.y + toastBox.height)
  expect(overlapRight - overlapX, 'the toast and the tooltip do not overlap horizontally')
    .toBeGreaterThan(2)
  expect(overlapBottom - overlapY, 'the toast and the tooltip do not overlap vertically')
    .toBeGreaterThan(2)

  const owner = await ownerAt(page, (overlapX + overlapRight) / 2, (overlapY + overlapBottom) / 2)
  expect(owner, 'the newly arrived toast is hidden behind a stale tooltip').toBe('toast')
})

/**
 * The direction that DISTINGUISHES open order from mount order.
 *
 * The two assertions above are each satisfied by mount order as well, because in both the tooltip's
 * host happens to be created before the toast's. A defect that froze stacking at mount order - a
 * literal `open` passed to `ClaraPortal`, so the host was appended when the component MOUNTED
 * rather than when its surface opened - passed both of them, and shipped. A review caught it by
 * hand, in this exact configuration.
 *
 * So: the toast arrives FIRST, and the tooltip opens over it afterwards. Only open order gets this
 * right. Mount order cannot, because the tooltip's trigger is on the page from the start.
 */
test('a tooltip opened over a live toast paints above it', async ({ page }) => {
  await page.goto(`${origin}/iframe.html?id=overlays-toast--tooltip-opened-over-a-live-toast&viewMode=story`)

  // The toast goes up FIRST this time. `dispatchEvent` keeps the pointer where it is.
  await page.getByRole('button', { name: 'Notify' }).dispatchEvent('click')
  const toast = page.locator('.clara-toast')
  await toast.waitFor({ state: 'visible' })
  await expect.poll(async () => {
    const a = await toast.boundingBox()
    await page.waitForTimeout(60)
    const b = await toast.boundingBox()
    return a && b && Math.abs(a.x - b.x) < 0.5
  }).toBe(true)

  // Only now does the tooltip open.
  await page.getByRole('button', { name: 'Explain' }).hover()
  const tip = page.locator('.clara-tooltip')
  await tip.waitFor({ state: 'visible' })

  const tipBox = (await tip.boundingBox())!
  const toastBox = (await toast.boundingBox())!
  const overlapX = Math.max(tipBox.x, toastBox.x)
  const overlapY = Math.max(tipBox.y, toastBox.y)
  const overlapRight = Math.min(tipBox.x + tipBox.width, toastBox.x + toastBox.width)
  const overlapBottom = Math.min(tipBox.y + tipBox.height, toastBox.y + toastBox.height)
  expect(overlapRight - overlapX, 'the tooltip and the toast do not overlap horizontally')
    .toBeGreaterThan(2)
  expect(overlapBottom - overlapY, 'the tooltip and the toast do not overlap vertically')
    .toBeGreaterThan(2)

  const owner = await ownerAt(page, (overlapX + overlapRight) / 2, (overlapY + overlapBottom) / 2)
  expect(owner, 'the tooltip opened last but the toast paints above it - stacking is frozen at mount order')
    .toBe('tooltip')
})

/**
 * Toast's motion is Class B (D0100), so reduced motion must REPLACE it rather than remove it.
 *
 * The ruling was asserted in four places - the stylesheet, the verification record, the story's
 * spec delta and the commit message - and exercised by nothing. A review deleted the ENTIRE
 * `@media (prefers-reduced-motion: reduce)` block and measured every gate still green: 1140 tests,
 * `pnpm check`, `check:geometry`. Deleting the entrance animation itself was equally invisible.
 *
 * That matters more here than the usual "unverified claim", because reduced motion is an
 * accessibility mechanism for vestibular disorders and Class B is the ruling that KEEPS motion.
 * Something has to prove the substitution actually happens.
 *
 * Both directions, on the pattern `e2e/geometry.spec.ts` already uses for ProgressBar's identical
 * Class B claim: the reduced treatment must NOT translate, and it must still say "this is new".
 */
test('a toast replaces its slide with a fade under reduced motion, rather than losing it', async ({ page }) => {
  const read = async () => page.evaluate(() => {
    const el = document.querySelector('.clara-toast')
    if (!el) return null
    const s = getComputedStyle(el)
    return { name: s.animationName, transform: s.transform, duration: s.animationDuration }
  })

  // 1. No preference: it TRAVELS. That is the spatial-origin half - the toast comes from the edge.
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto(`${origin}/iframe.html?id=overlays-toast--success&viewMode=story`)
  await page.locator('.clara-toast').waitFor({ state: 'visible' })
  const moving = await read()
  expect(moving!.name, 'the toast has no entrance animation at all').not.toBe('none')

  // 2. Reduced: a DIFFERENT animation, and no translation.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`${origin}/iframe.html?id=overlays-toast--success&viewMode=story`)
  await page.locator('.clara-toast').waitFor({ state: 'visible' })
  const reduced = await read()

  expect(reduced!.name, 'reduced motion did not change the animation at all').not.toBe(moving!.name)
  // REPLACED, not removed - this is the whole Class B ruling. `none` here would mean a toast
  // arriving behind the reader's gaze is indistinguishable from one that was always there, which
  // is the information D0100 says motion is carrying.
  expect(reduced!.name, 'the motion was REMOVED under reduced motion, not replaced - Class B says replace')
    .not.toBe('none')
  // And it must not travel: a translation is exactly what a vestibular trigger is.
  expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(reduced!.transform)
})

/**
 * A tooltip's text is Clara's size, not the consumer's.
 *
 * A tooltip PORTALS to `document.body`, so it does not inherit from where its trigger lives. With
 * no `font-size` declared it took the consumer's `body` size - measured at 13px on a page whose
 * body was 13px, against `font.body` = 14px, which is under the legibility floor D0104 sets for
 * text that carries meaning. This string is what `aria-describedby` points at, so it is the
 * description of a control and D0104's implementer test stops at the first question.
 *
 * It can only be asserted in a browser: jsdom resolves no `var()` and computes no styles, and the
 * static geometry fixture cannot contain a portalled overlay at all (BG-01M0XVXS).
 */
test('a tooltip renders at Clara\'s font size, not the page\'s', async ({ page }) => {
  await page.goto(`${origin}/iframe.html?id=overlays-tooltip--hover-bridge&viewMode=story`)
  // A hostile page: smaller than Clara's floor, which is what the tooltip used to inherit.
  await page.addStyleTag({ content: 'html, body { font-size: 13px; }' })

  await page.getByRole('button', { name: 'Hover me' }).hover()
  const tip = page.locator('.clara-tooltip')
  await tip.waitFor({ state: 'visible' })

  const px = await tip.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
  expect(px, 'the tooltip inherited the page font size instead of declaring its own')
    .toBeGreaterThanOrEqual(14)
})

/**
 * BG-01M0Y2H2, in the only place the original evidence could be gathered.
 *
 * The defect was measured geometrically: three toasts at the IDENTICAL rect, with
 * `elementFromPoint` on the first one's close button returning the third one's, so the covered
 * toasts' controls were unreachable rather than merely hidden. jsdom computes no layout, so the
 * unit tests can only assert the cause (one viewport, three children). This asserts the effect.
 */
test('three toasts stack instead of covering each other, and each close button is hittable', async ({ page }) => {
  await page.goto(`${origin}/iframe.html?id=overlays-toast--a-stack-of-three&viewMode=story`)

  const toasts = page.locator('.clara-toast')
  await expect(toasts).toHaveCount(3)
  expect(await page.locator('.clara-toast__viewport').count(),
    'each toast brought its own fixed viewport again').toBe(1)

  // Wait for the entrance animation to finish before measuring ANYTHING. The toast slides in from
  // the viewport edge, so mid-flight it is still translated off-screen and every hit test at its
  // resting position returns something else - which reads as "unreachable" when it is simply not
  // there yet. Measured: without this the three close buttons all report false.
  await page.evaluate(() => Promise.all(
    [...document.querySelectorAll('.clara-toast')]
      .flatMap((el) => el.getAnimations())
      .map((a) => a.finished.catch(() => undefined)),
  ))

  const boxes = await toasts.evaluateAll((els) =>
    els.map((el) => { const r = el.getBoundingClientRect(); return { y: Math.round(r.y), h: Math.round(r.height) } }))

  // Distinct vertical positions. Identical `y` values are the defect itself.
  expect(new Set(boxes.map((b) => b.y)).size, 'two or more toasts occupy the same row').toBe(3)

  // And every close button is the topmost element at its own centre - which is what "reachable"
  // means to a pointer, and precisely what the covered toasts failed.
  const reachable = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('.clara-toast__close')]
    return buttons.map((b) => {
      const r = b.getBoundingClientRect()
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
      return b.contains(hit) || b === hit
    })
  })
  expect(reachable, 'a covered toast\'s close button is not hittable').toEqual([true, true, true])
})

/*
 * ============================================================================
 * BG-01M0XVXS - the rendered assertions gate 9's fixture structurally cannot hold.
 *
 * `build-geometry-fixture.mjs` renders with `renderToStaticMarkup`, and `ClaraPortal` returns null
 * on the server BY DESIGN (US-01M0GM61 AC4). So no portalled surface appears in gate 9's fixture at
 * all, and gate 9 is where every rendered-behaviour assertion in this project lives. That is not a
 * gap in any one component; it is a gap in the GATE's reach, and it was costing Drawer and Popover
 * their most important claims.
 *
 * The fix is not to make the static fixture hold portals - it cannot, and forcing it would mean
 * server-rendering something the architecture deliberately refuses to. It is to assert portalled
 * behaviour where a portal actually exists: a live Storybook build, which is what this file already
 * drives for the tooltip bridge, the D0102 layering and the toast stack.
 * ============================================================================
 */

test('a drawer slides in from the edge it is anchored to', async ({ page }) => {
  // Drawer's headline behaviour, and nothing observed it. jsdom returns no animation, and the
  // static fixture cannot contain the panel.
  for (const [story, axis] of [['left', 'X'], ['right', 'X'], ['bottom', 'Y']] as const) {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto(`${origin}/iframe.html?id=overlays-drawer--${story}&viewMode=story`)
    await page.getByRole('button', { name: `Open ${story} drawer` }).click()
    const panel = page.locator('.clara-drawer')
    await panel.waitFor({ state: 'visible' })

    const seen = await panel.evaluate((el) => {
      const s = getComputedStyle(el)
      return { name: s.animationName, duration: s.animationDuration }
    })
    expect(seen.name, `the ${story} drawer has no entrance animation`).not.toBe('none')
    // The animation NAMES its axis, so a drawer anchored left cannot silently reuse the right-hand
    // keyframe - which would slide it in from the wrong side of the screen.
    expect(seen.name, `the ${story} drawer animates on the wrong axis`)
      .toMatch(axis === 'Y' ? /bottom/i : new RegExp(story === 'left' ? 'start' : 'end', 'i'))
    expect(seen.duration, `the ${story} drawer's animation has no duration`).not.toBe('0s')
  }
})

/**
 * WHERE the panel ends up, which is a different claim from which keyframe it uses.
 *
 * AC1 said "left, right and bottom all render correctly" and was verified by a class-name
 * assertion. A class name is a proxy for a position (D0065), and the slide test above reads the
 * ANIMATION NAME - also a proxy. Measured: swapping `inset-inline-start: 0` and
 * `inset-inline-end: 0` between `.clara-drawer--left` and `.clara-drawer--right`, leaving the
 * keyframe names untouched, put every left drawer on the right edge and left ALL of it green -
 * 1191 unit tests, both drawer e2e tests, and `check-component-css`. This test is the property
 * itself.
 *
 * Reduced motion is emulated deliberately: with the slide removed there is no transform to wait
 * out, so the box read here is the panel's resting position and not a frame of its entrance.
 */
test('a drawer rests against the edge it names, and spans the other axis', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const viewport = page.viewportSize()
  if (!viewport) throw new Error('no viewport to measure against')
  // Sub-pixel layout is real; an exact equality here would be flaky for a reason that is not a defect.
  const EDGE = 1

  for (const placement of ['left', 'right', 'bottom'] as const) {
    await page.goto(`${origin}/iframe.html?id=overlays-drawer--${placement}&viewMode=story`)
    await page.getByRole('button', { name: `Open ${placement} drawer` }).click()
    const panel = page.locator('.clara-drawer')
    await panel.waitFor({ state: 'visible' })
    const box = await panel.boundingBox()
    if (!box) throw new Error(`the ${placement} drawer has no box`)

    if (placement === 'bottom') {
      expect(box.y + box.height, 'the bottom drawer does not reach the bottom edge')
        .toBeGreaterThan(viewport.height - EDGE)
      expect(box.width, 'the bottom drawer does not span the viewport').toBeGreaterThan(viewport.width - EDGE)
      // Not the whole screen: a bottom drawer that filled the viewport would be a modal.
      expect(box.y, 'the bottom drawer covers the whole viewport').toBeGreaterThan(EDGE)
      continue
    }

    // Both halves matter. "Touches the left edge" alone passes on a panel spanning the whole
    // viewport, and "does not touch the right edge" alone passes on a panel floating in the middle.
    const near = placement === 'left' ? box.x : viewport.width - (box.x + box.width)
    const far = placement === 'left' ? viewport.width - (box.x + box.width) : box.x
    expect(near, `the ${placement} drawer does not reach the ${placement} edge`).toBeLessThan(EDGE)
    expect(far, `the ${placement} drawer spans the whole viewport`).toBeGreaterThan(EDGE)
    expect(box.height, `the ${placement} drawer does not run the full height`)
      .toBeGreaterThan(viewport.height - EDGE)
  }
})

/**
 * WHERE the entrance starts, which is a different claim from which keyframe is attached.
 *
 * The test above reads `animationName`. A review proved that is a proxy too (D0065): swapping only
 * the keyframe BODIES - `translateX(-100%)` and `translateX(100%)` at `styles.css:407-408`, both
 * names left alone - made the left drawer enter from the middle of the screen (paused first frame
 * `startX` went -448 to +448 at a 1280 viewport) while `animationName` still read
 * `clara-drawer-in-start`. 32 browser tests, 1191 unit tests and 26 guards stayed green. That is the
 * AC1 -> AC7 defect reproduced one layer down, inside the criterion written to fix it.
 *
 * AC7 cannot cover this: it emulates `reducedMotion: 'reduce'` so that the box it reads is the
 * resting position, which means nothing there ever observes the panel while it is ENTERING. This
 * test is the entering half, and the two are deliberately separate for that reason.
 *
 * The animation is PAUSED at `currentTime = 0` rather than raced against - sampling a running
 * animation is how a test becomes flaky for a reason that is not a defect.
 */
test('a drawer enters from outside the edge it is anchored to', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const viewport = page.viewportSize()
  if (!viewport) throw new Error('no viewport to measure against')
  const EDGE = 1

  for (const placement of ['left', 'right', 'bottom'] as const) {
    await page.goto(`${origin}/iframe.html?id=overlays-drawer--${placement}&viewMode=story`)
    await page.getByRole('button', { name: `Open ${placement} drawer` }).click()
    const panel = page.locator('.clara-drawer')
    await panel.waitFor({ state: 'visible' })

    const first = await panel.evaluate((el) => {
      const running = el.getAnimations()
      if (running.length === 0) return null
      for (const animation of running) {
        animation.pause()
        animation.currentTime = 0
      }
      const rect = el.getBoundingClientRect()
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
    })
    // `null` means no animation at all, which is a different defect and must not read as a pass.
    expect(first, `the ${placement} drawer has no entrance animation to sample`).not.toBeNull()
    const box = first!

    if (placement === 'left') {
      // Entirely past the left edge at t=0: it travels rightward INTO view.
      expect(box.x + box.width, 'the left drawer does not start off the left edge')
        .toBeLessThanOrEqual(EDGE)
    } else if (placement === 'right') {
      expect(box.x, 'the right drawer does not start off the right edge')
        .toBeGreaterThanOrEqual(viewport.width - EDGE)
    } else {
      expect(box.y, 'the bottom drawer does not start below the bottom edge')
        .toBeGreaterThanOrEqual(viewport.height - EDGE)
    }
  }
})

test('a drawer removes its slide entirely under reduced motion', async ({ page }) => {
  // Class A, unlike Toast: the slide is spatial-origin decoration here, and the panel's presence is
  // already the information. D0100 says remove it rather than substitute something.
  //
  // ALL THREE placements, not just `right`. This visited one story while its sibling above iterated
  // three, and a review measured the consequence: narrowing the reduced-motion rule from
  // `.clara-drawer--left, .clara-drawer--right, .clara-drawer--bottom` to `.clara-drawer--right`
  // alone left the whole e2e gate green while a left or bottom drawer kept sliding for a
  // `prefers-reduced-motion: reduce` user - which is the D0100 violation this test exists to
  // prevent, surviving inside the test written to prevent it.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const placement of ['left', 'right', 'bottom'] as const) {
    await page.goto(`${origin}/iframe.html?id=overlays-drawer--${placement}&viewMode=story`)
    await page.getByRole('button', { name: `Open ${placement} drawer` }).click()
    const panel = page.locator('.clara-drawer')
    await panel.waitFor({ state: 'visible' })

    const name = await panel.evaluate((el) => getComputedStyle(el).animationName)
    expect(name, `the ${placement} drawer still animates under reduced motion`).toBe('none')
  }
})

test('a popover pinned against an edge stays on screen', async ({ page }) => {
  // US-01M0GMQJ AC2's RENDERED half. The unit tests assert the collision behaviour is CONFIGURED,
  // which is a much weaker claim than that it happens; this is the claim itself.
  //
  // On probing it: DELETING `avoidCollisions` does not turn this red, and that is correct rather
  // than a hole - Radix defaults it to `true`, so the deletion changes nothing about the rendered
  // result. The mutation that matters is `avoidCollisions={false}`, and it fails here with "the
  // popover is clipped off the left edge". Worth stating, because the deletion probe looks like the
  // obvious one and would wrongly suggest this assertion is insensitive.
  await page.goto(`${origin}/iframe.html?id=overlays-popover--against-the-edge&viewMode=story`)
  await page.getByRole('button', { name: 'Options' }).click()

  const panel = page.locator('.clara-popover')
  await panel.waitFor({ state: 'visible' })
  const box = (await panel.boundingBox())!
  const viewport = page.viewportSize()!

  // The story asks for `placement="left"` against the left edge, so honouring the request literally
  // would put the panel off screen. Collision handling is exactly the thing that must not.
  expect(box.x, 'the popover is clipped off the left edge').toBeGreaterThanOrEqual(0)
  expect(box.y, 'the popover is clipped off the top edge').toBeGreaterThanOrEqual(0)
  expect(box.x + box.width, 'the popover overflows the right edge')
    .toBeLessThanOrEqual(viewport.width + 1)
  expect(box.y + box.height, 'the popover overflows the bottom edge')
    .toBeLessThanOrEqual(viewport.height + 1)

  // And it actually MOVED off the requested side rather than being clamped on top of its trigger:
  // `data-side` is Radix's own report of where it ended up.
  const side = await panel.getAttribute('data-side')
  expect(side, 'the popover stayed on its requested side, so nothing flipped').not.toBe('left')
})

/**
 * Every portalled panel is READABLE, in both themes.
 *
 * `.clara-popover` and `.clara-drawer` declared a background and no `color`. A portalled panel does
 * not inherit text colour from where it was written, and `[data-clara-theme]` redefines custom
 * properties without declaring `color` - so the text colour came from the PAGE while the background
 * came from the portal's scope. Measured in Chromium at 1.26:1 in dark theme, against 16.64:1 for
 * the panels that declare it. Three review rounds walked past it.
 *
 * Four gates were blind BY CONSTRUCTION, which is why: `test/axe.ts` disables `color-contrast`,
 * jsdom resolves no `var()`, `check-contrast` measures only DECLARED pairings (and with no fg token
 * there was no pairing to declare), and the shape contract enrolled Modal alone. The first three
 * cannot be fixed by enrolment; only a browser can answer this.
 */
const CONTRAST_MIN = 4.5

const relativeLuminance = ([r, g, b]: number[]) => {
  const f = (v: number) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!)
}
const contrast = (fg: number[], bg: number[]) => {
  const [a, b] = [relativeLuminance(fg), relativeLuminance(bg)].sort((x, y) => y - x)
  return (a! + 0.05) / (b! + 0.05)
}
const parseRgb = (value: string) => (value.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number)

test('every portalled panel is readable in BOTH themes', async ({ page }) => {
  /*
   * Driven from a STATIC fixture built out of the shipped stylesheets, not from Storybook.
   *
   * The first version of this test drove `?globals=theme:dark` and passed with Popover's `color`
   * DELETED - vacuous. Storybook's theme toolbar cannot reach a portalled surface at all: its
   * `preview.tsx` imports ClaraProvider from the BUILT package while stories import components from
   * source, so there are two `ClaraSettingsContext` module instances and the portal root renders
   * `light` while the page reads `dark`. A test that cannot make the panel dark cannot find a
   * dark-theme contrast defect.
   *
   * What is under test is a CSS contract - "this class declares a colour that resolves against the
   * same scope as its background" - so the honest fixture is the shipped CSS plus the exact DOM
   * `ClaraPortal` emits. No React, nothing to go wrong between the assertion and the thing asserted.
   */
  const css = ['packages/tokens/dist/tokens.css', 'packages/tokens/dist/themes/dark.css',
    'packages/react/dist/styles.css']
    .map((f) => readFileSync(join(process.cwd(), f), 'utf8')).join('\n')

  const panels = ['clara-popover', 'clara-drawer', 'clara-tooltip', 'clara-toast',
    'clara-dropdown-menu', 'clara-modal']

  /*
   * BOTH themes, and light is expressed by the ABSENCE of a dark ancestor - never by writing
   * `data-clara-theme="light"`.
   *
   * That attribute is inert: light lives on `:root`, and only `[data-clara-theme="dark"]` scopes
   * anything, so a "light" wrapper inside a dark page still renders dark. A loop that flipped the
   * value would produce a light row that was actually dark - vacuous in exactly the way the first
   * version of this test was, and the way BG-01M0Z6R3 describes.
   *
   * Light matters on its own: repointing a panel's fg token to a different tier 2 alias measured
   * 3.10:1 in LIGHT and 5.37:1 in dark, so a dark-only assertion would have passed it.
   */
  const wrap = (inner: string, dark: boolean) =>
    dark ? `<div data-clara-theme="dark">${inner}</div>` : inner

  for (const dark of [true, false]) {
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>
<body>
  ${panels.map((c) => wrap(`<div class="${c}" id="p-${c}">Sample</div>`, dark)).join('\n')}
</body></html>`)

    for (const cls of panels) {
      const seen = await page.locator(`#p-${cls}`).evaluate((el) => {
        const s = getComputedStyle(el)
        return { color: s.color, background: s.backgroundColor }
      })
      const ratio = contrast(parseRgb(seen.color), parseRgb(seen.background))
      expect(ratio, `.${cls} renders ${seen.color} on ${seen.background} - ${ratio.toFixed(2)}:1 in ${dark ? 'dark' : 'light'} theme`)
        .toBeGreaterThanOrEqual(CONTRAST_MIN)
    }
  }
})

/**
 * A positioned panel with long content must stay INSIDE the viewport and scroll.
 *
 * `.clara-popover` had no `max-block-size` and no `overflow`, so it grew to 656px at every viewport
 * - which made the existing "stays on screen" assertion a property of its fixture rather than of
 * the component: true at 1280x720, false at 1280x600, with nothing about the code changing.
 *
 * The overflow was also UNREACHABLE, which is the part that makes it a WCAG failure rather than an
 * aesthetic one. The popper wrapper is `position: fixed`, so a panel taller than the screen does
 * not extend the document: measured a panel bottom of 784 against a 400px viewport with
 * `document.scrollHeight` at 432, and focusing the last row left it at `top: 750` with `scrollY: 0`.
 * Neither the browser nor the user could reach it. WCAG 2.4.7 and 1.4.10.
 */
test('a popover with long content stays in the viewport and scrolls', async ({ page }) => {
  for (const height of [720, 600, 400]) {
    await page.setViewportSize({ width: 1280, height })
    await page.goto(`${origin}/iframe.html?id=overlays-popover--long-content&viewMode=story`)
    const panel = page.locator('.clara-popover')
    await panel.waitFor({ state: 'visible' })

    const seen = await panel.evaluate((el) => {
      const r = el.getBoundingClientRect()
      return { bottom: r.bottom, scrollable: el.scrollHeight > el.clientHeight + 1,
        overflowY: getComputedStyle(el).overflowY }
    })
    expect(seen.bottom, `at ${height}px the panel runs past the viewport edge`)
      .toBeLessThanOrEqual(height + 1)
    expect(seen.overflowY, `at ${height}px the panel does not scroll its overflow`)
      .toMatch(/auto|scroll/)
    expect(seen.scrollable, `at ${height}px the content fits, so this viewport tests nothing`)
      .toBe(true)
  }
  await page.setViewportSize({ width: 1280, height: 720 })
})

/**
 * An intent class must render ITS OWN intent's colours.
 *
 * Alert, Badge and Tag each map four intent classes onto four tier 3 token pairs, and every one of
 * those pairs is correct in the token build - `Alert intent contrast both themes` proves the PAIRS
 * meet AA, and `check:contrast` measures all 106 declared pairings. Neither asserts that
 * `.clara-alert--danger` uses the DANGER pair.
 *
 * Measured: repointing `.clara-alert--danger`, `.clara-badge--danger` and `.clara-tag--danger` at
 * their info tokens left everything green - 1200 unit tests, `check-component-css` and
 * `check-contrast` - and a contrast assertion could never catch it, because info-on-info is a
 * perfectly good AA pair. The failure is not a contrast failure. It is a danger alert that renders
 * as an information alert, with the colour saying one thing and the visually-hidden word saying
 * another.
 *
 * So this reads the COMPUTED colours off the shipped stylesheets and compares each intent class
 * against a probe carrying that intent's tier 2 pair directly. Both halves are asserted: every class
 * matches its own probe, AND the four intents are mutually distinct - without the second half, a
 * build that collapsed all four tier 2 aliases to one colour would satisfy the first.
 */
test('every intent class renders its own intent colours, in both themes', async ({ page }) => {
  const css = ['packages/tokens/dist/tokens.css', 'packages/tokens/dist/themes/dark.css',
    'packages/react/dist/styles.css']
    .map((f) => readFileSync(join(process.cwd(), f), 'utf8')).join('\n')

  const COMPONENTS = ['alert', 'badge', 'tag'] as const
  const INTENTS = ['info', 'success', 'warning', 'danger'] as const
  // Light is the ABSENCE of a dark ancestor, never `data-clara-theme="light"` - that attribute is
  // inert, because light lives on `:root` and only the dark selector scopes anything. The panel
  // contrast test above records what a value-flipping loop costs.
  const wrap = (inner: string, dark: boolean) =>
    dark ? `<div data-clara-theme="dark">${inner}</div>` : inner

  for (const dark of [true, false]) {
    const theme = dark ? 'dark' : 'light'
    const subjects = COMPONENTS.flatMap((c) =>
      INTENTS.map((i) => `<div class="clara-${c} clara-${c}--${i}" id="s-${c}-${i}">Sample</div>`))
    // The probe carries the tier 2 pair the intent is SUPPOSED to resolve to, read through the same
    // cascade the components are read through, so a theme override moves both together.
    const probes = INTENTS.map((i) =>
      `<div id="probe-${i}" style="color: var(--clara-color-fg-${i}); background: var(--clara-color-bg-${i}-subtle)">Sample</div>`)

    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>
<body>
  ${wrap([...subjects, ...probes].join('\n'), dark)}
</body></html>`)

    const read = (id: string) => page.locator(`#${id}`).evaluate((el) => {
      const s = getComputedStyle(el)
      return { color: s.color, background: s.backgroundColor }
    })

    const expected: Record<string, { color: string, background: string }> = {}
    for (const intent of INTENTS) expected[intent] = await read(`probe-${intent}`)

    // Mutually distinct FIRST: if the four probes collapsed to one colour, every comparison below
    // would pass and prove nothing at all.
    const seenPairs = INTENTS.map((i) => `${expected[i]!.color}|${expected[i]!.background}`)
    expect(new Set(seenPairs).size, `the four intents are not visually distinct in ${theme}: ${seenPairs.join(' / ')}`)
      .toBe(INTENTS.length)

    for (const component of COMPONENTS) {
      for (const intent of INTENTS) {
        const seen = await read(`s-${component}-${intent}`)
        expect(seen, `.clara-${component}--${intent} does not render the ${intent} pair in ${theme} theme`)
          .toEqual(expected[intent])
      }
    }
  }
})

