<!-- provenance: generated provisional-unverified hash=sha256:c7da40367f2f3d2e -->
<!--
Source: Generated from PRD v0.4.0 §2 (the reviewing stakeholder)
Generated: 2026-08-21
Confidence: INFERRED
Last Review: 2026-08-21
-->
<!-- stakeholder: buyer -->
# Daniel Achebe - Operations Director, and the person who signs off the build

> **Cast:** Customer (Cooper designation - a Customer buys or mandates but does not use.)
>
> **Arbitration:** this stakeholder's goals never override the Primary persona's interface.
> When Daniel's wants conflict with what Sofia needs from the API, or what Grace needs from
> the screen, the Primary wins the interface and Daniel's needs are met elsewhere - in
> reporting, in the demo narrative, in documentation. This is the
> buyer-never-overrides-the-Primary rule, stated here so every consult that loads this card
> loads the rule with it.

## Who They Are

Daniel runs operations for a distribution business and approves the internal systems his teams
depend on. He does not write code and will never install Clara. What he does is sit through a
demo, decide whether what he is looking at is credible enough to put in front of eighty staff and
an auditor, and then own that decision.

Two years ago he approved an internal tool that worked correctly and looked like a prototype.
His team's confidence in it never recovered, adoption stalled, and he ended up paying for a
rebuild he had already paid for once. He is not interested in beauty. He is interested in never
again approving something that makes his organisation look like it does not take itself seriously.

## What They Want

*End Goals for THIS project - what must be true for him to call it a success.*

1. Screens built on Clara read as professional enterprise software, not a hobby project or a
   template, to someone seeing them for the first time
2. His staff can actually use the result all day - including the ones with accessibility needs
   he does not know about and should not have to ask about
3. The system does not become a liability: no accessibility complaint he cannot answer, no
   dependency that turns out to be abandoned
4. The investment compounds - the second application costs less than the first

## Veto Lines

*What makes him block. Each is testable against an artefact.*

- A demo where a screen looks visibly unfinished or inconsistent between pages - inconsistency
  reads to him as carelessness everywhere else
- Any accessibility question he cannot answer with a document. He does not need a VPAT; he needs
  to not be caught without an answer
- A core dependency with no maintenance signal, since he has been burned by an abandoned library
- A component set so incomplete that his developers are visibly building around it rather than
  with it

## Evidence They Read

*What he actually looks at before signing off - a consult cites these, never vibes.*

- A real screen with real data volumes, not a component gallery. The reference application (F31),
  never Storybook
- The accessibility statement, including its named gaps - a stated gap reassures him far more than
  a blanket claim
- Whether the second application was faster to build than the first
- How his own staff behave in the first week: whether they ask for training or just get on with it

## Consultation Stance

*How he behaves in a review.*

- **Always asks:** "Would I be comfortable if a customer, or an auditor, saw this screen over
  someone's shoulder?"
- **Reassured by:** a real working screen at realistic density, and a written statement of what is
  and is not covered. He trusts a named limitation more than a confident generality, because the
  tool he regretted approving had no limitations listed anywhere.
