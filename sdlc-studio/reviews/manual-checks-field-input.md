# Two manual checks: Field AC6 and Input AC4

> These are the only things standing between the form framework and a closed epic. Both need a
> human at a browser; neither is automatable from this repo. Roughly 15 minutes together.
>
> **Update 2026-08-24.** Automation was attempted properly before asking again. The built package
> was server-rendered into a real page and driven in Chromium under Playwright. That eliminated
> three of the five questions in Check 1 - the accessible description, its order and its
> de-duplication now come from Chromium's own AX engine, recorded in the Field verification record -
> and it produced the measured Clara baseline for Check 2. It could not do the two things that
> matter most: hear VoiceOver, and make a browser autofill. The dead ends are recorded in the Input
> verification record so nobody repeats them. What is below is what is genuinely left.
>
> **A fixture generator is ready.** `node scripts/make-manual-fixture.mjs` writes the pages this
> needs and prints the URL; you do not have to build a harness.
>
> Record what you actually observe, including anything surprising. A record that says something
> unexpected happened is worth more than one that says "as documented" - this epic already caught
> itself writing the second kind without doing the work.

## Setting up

There is no Storybook yet (that is US-01M0GMZW), so use the docs app or a scratch page:

```bash
pnpm build
pnpm --filter @luzentialabs/clara-react exec vite build --watch   # or your usual harness
```

Minimum fixture for both checks:

```tsx
import { Field, Input } from '@luzentialabs/clara-react'
import '@luzentialabs/clara-react/styles.css'

<Field label="Supplier reference" description="As it appears on the invoice" error="This supplier is not on the approved list">
  <Input name="supplier" autoComplete="organization" />
</Field>
```

---

## Check 1 — Field AC6: what VoiceOver actually says

**What is already proven, so you do not need to check it:** the DOM order of `aria-describedby`
(description then error), that both ids resolve, and that neither is listed twice. Tests cover all
of that. What no test can reach is what a screen reader *speaks*.

**Steps.** macOS, Safari, VoiceOver on (Cmd+F5). Tab into the field.

**Record, verbatim, the string VoiceOver speaks on focus.** Then answer:

1. Is the **label** announced? ("Supplier reference")
2. Is the **description** announced, and does it come **before** the error?
3. Is the **error** announced?
4. Is anything announced **twice**? The error is reachable by two routes (`aria-describedby` and
   `aria-errormessage`) and should still be spoken once.
5. Does the error announce **again** when it appears after interaction, rather than on page load?
   (Clear the error prop, focus the field, then set it.)

**Then tell me the verbatim string and your answers**, and I will record it against Field AC6 with
your name and the date. If something is announced twice or out of order, that is a defect and I will
open a bug rather than record a pass.

---

## Check 2 — Input AC4: autofill

**Know what you are looking for before you start: Clara does NOT style autofill.** No
`:-webkit-autofill` rule exists anywhere in the repo. The criterion is not "does our override work"
- there is no override. It is "is the field still usable and readable when the browser paints it".

**Steps.** Save an address/organization entry in Chrome, then in Safari. Load the fixture and let
the browser autofill the field.

Record, for **each** browser:

1. The **background colour** the browser applies, and whether the text on it is still readable.
2. Whether the **border** is still visible - i.e. does it still look like a Clara control, or like
   a browser-native one?
3. Whether the **focus ring** still shows when you tab to it while autofilled.
4. Whether the **error styling** is still distinguishable when the field is both autofilled and
   invalid.

**Then tell me what you saw.** Three outcomes and what each means:

- **It looks acceptable** - I record the pass and Input reaches Done.
- **It looks wrong** (unreadable text, the control stops looking like Clara) - that is a real
  finding. I open a bug for an autofill rule, and Input holds.
- **It is borderline** - tell me and we decide; "borderline" is a legitimate answer and better than
  forcing it into one of the other two.
