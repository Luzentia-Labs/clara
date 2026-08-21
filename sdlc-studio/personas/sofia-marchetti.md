<!--
Source: Generated from PRD v0.4.0 §2
Generated: 2026-08-21
Confidence: INFERRED
Last Review: 2026-08-21
-->
# Sofia Marchetti

> A specific person, not a type. The Primary is the one the product is designed *for*.

## Quick Reference

| Attribute | Value |
| --- | --- |
| **Cast role** | primary |
| **Interface** | The Clara public API and token layer (`@luzentialabs/clara-*`) |
| **Role** | Full-stack developer building internal ERP applications |
| **Context** | Two-monitor desk, deep in a component file, with a half-built screen open beside the editor |

## Who They Are

Sofia builds internal systems for a mid-size distributor: purchasing, stock, supplier payments.
She has assembled the same twenty-five components four times now, in three different libraries,
and each time she has lost a week to the same fights - a Select that will not open inside a Modal,
a date field that silently reinterprets a timezone, a disabled button whose reason nobody can read.
She is not looking for a library with more components. She is looking for one where the twenty-five
she needs are finished, and where she can predict the twenty-sixth from the twenty-fifth.

## End Goals

*What they are trying to accomplish, most important first. The design is judged against these.*

1. Assemble a working, accessible ERP screen without writing component-level CSS or accessibility code
2. Guess a component's API correctly on the first attempt, from having used another Clara component
3. Upgrade Clara without discovering a breaking change in production
4. Hand a screen to an auditor without preparing for it first

## Experience Goals

*How they want to feel while using it.*

- Confident that the component handles the case she has not thought of yet
- Unsurprised - the same prop means the same thing everywhere
- Trusting the version number, so an upgrade is a routine act rather than a risk

## Behaviours & Context

- **Environment:** VS Code with TypeScript strict on, a dev server running, and the docs open in a
  second tab. She reads types in autocomplete far more often than she reads documentation.
- **Frequency:** Daily, in long sessions. She touches the component library dozens of times a day
  and notices friction that a weekly user would tolerate.
- **Proficiency:** Strong React and TypeScript. Competent but not expert on WAI-ARIA - she knows
  the rules exist and knows she should not be implementing a combobox herself. She reads the props
  table, not the source, and treats a library whose source she must read as a library that failed.

## Frustrations

- Libraries where the escape hatch is the API: every real screen ends up overriding internals, and
  the next upgrade breaks all of it
- Accessibility that is a prop rather than a default, so the correct thing is the thing she has to
  remember
- A component that works in isolation and falls apart at composition - the Select inside the Modal,
  the Popover inside the scrolling table
- Documentation that lists props without saying when *not* to use the component
- Discovering on install that a minor version renamed something

## Scenario

Sofia needs a supplier form: eighteen fields, four of them conditional, with a confirmation before
save. She reaches for `Field` and finds that label, description, error and required state are wired
without her doing anything. She guesses that `Select` takes `onValueChange` because `Tabs` did, and
she is right. She spends her afternoon on the conditional-field logic that is actually her problem,
not on `aria-describedby`. When she tabs through the finished form to check it, focus behaves - and
she did not write a line of code to make that true.
