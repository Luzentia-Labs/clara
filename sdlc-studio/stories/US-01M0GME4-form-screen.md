# US-01M0GME4: Form screen

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKV1
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** apps/reference-app/src/screens/Form.tsx
> **Points:** 8

## User Story

**As a** Grace Adeyemi
**I want** a real ERP form screen built entirely from Clara
**So that** the Field framework and every input are proved in a dense, realistic form

## Acceptance Criteria

### AC1: Composed only from Clara

- **Given** the form screen
- **When** I inspect its source
- **Then** it uses only Clara components, with no ad-hoc CSS beyond page layout
- **Verify:** shell ! grep -q "style=" apps/reference-app/src/screens/Form.tsx
- **Verification target:** functional

### AC2: Exercises the intended set

- **Given** the screen
- **When** it renders
- **Then** Field end to end with Input, NumberInput, Textarea, Select, Combobox, Checkbox, Radio, Switch and DatePicker, plus validation, a Modal confirmation and a Toast on save
- **Verify:** file apps/reference-app/src/screens/Form.tsx
- **Verification target:** functional

### AC3: Keyboard end to end

- **Given** the screen
- **When** I use only the keyboard
- **Then** the form can be completed and submitted
- **Verify:** manual keyboard-only walkthrough of the form screen
- **Verification target:** conversational

### AC4: Axe clean

- **Given** the screen
- **When** the suite runs
- **Then** zero serious or critical violations
- **Verify:** vitest "form screen axe clean"
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Form screen

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 8 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
