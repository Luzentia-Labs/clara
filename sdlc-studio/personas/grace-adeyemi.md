<!--
Source: Generated from PRD v0.4.0 §2
Generated: 2026-08-21
Confidence: INFERRED
Last Review: 2026-08-21
-->
# Grace Adeyemi

> A specific person, not a type. A Served group is affected by the system without ever
> choosing it or touching its interface.

## Quick Reference

| Attribute | Value |
| --- | --- |
| **Cast role** | served |
| **Interface** | None. Grace never touches Clara's API - she touches screens built with it |
| **Role** | Accounts payable clerk at a distribution company |
| **Context** | One screen, eight hours, a fixed 1920x1080 monitor, and a queue that does not shorten |

## Who They Are

Grace reconciles supplier invoices against goods-received notes. She did not choose this software,
cannot leave it, and will still be using it in three years. She processes somewhere between two and
four hundred lines a day, and by four in the afternoon she is working from muscle memory and
peripheral vision rather than from reading. She has a mild red-green colour vision deficiency she
has never mentioned at work, because in most systems she has learned to work around it.

She is the reason Clara's floors exist. She will never file an issue against it.

## End Goals

*What the affected party needs to be true. The design is judged against these even though she
never touches the interface.*

1. Get through the day's queue without a transposition error she has to unwind tomorrow
2. Read a status at a glance, from the shape of the row rather than by stopping to decode a colour
3. Keep her place in a long table while scrolling, so she is not re-finding the same row twice
4. Finish the day without the accumulated eye strain of a screen designed for a five-minute demo

## Behaviours & Context

- **Environment:** A single fixed desktop monitor, no zoom, in an open office with frequent
  interruptions. She keeps twelve columns visible because scrolling horizontally loses her the
  row context she is working from.
- **Frequency:** Continuous, seven-plus hours a day, five days a week. She sees each screen more
  times in a month than its designer will in a career.
- **Proficiency:** Expert in the domain and in this software's quirks; indifferent to the software
  itself. Keyboard-heavy out of speed rather than preference - she tabs through forms because
  reaching for the mouse costs her seconds she does not have.

## Frustrations

- Status conveyed by a row tint she cannot reliably distinguish, so she opens each record to check
- Sticky headers that cover the row she has just tabbed to, so she loses her position
- A value truncated with an ellipsis and a tooltip she cannot reach without a mouse
- Compact modes that shrink the text rather than the padding, making a long day longer
- A control that is disabled with no reachable explanation, so she cannot tell whether the problem
  is the record, her permissions, or a bug
- 12px type used for something that turns out to matter

## Scenario

It is 4pm and Grace is working a queue of two hundred invoices. She tabs down the table checking
which are posted, which reversed, which in error. She does not read the rows; she scans the status
column and looks for the shape that is wrong. The header stays put and never hides the line she is
on. When she finds a reversed invoice she tabs into it, and the reason the approve button is
unavailable is text she can read rather than a grey button she has to guess about. She clears the
queue by half past five and does not have to redo anything in the morning.
