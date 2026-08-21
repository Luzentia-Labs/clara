<!--
Source: Generated from PRD v0.4.0 §2 and the design principles
Generated: 2026-08-21
Confidence: INFERRED
Last Review: 2026-08-21
-->
# Theo Lindgren

> The anti-persona. Their goals are real; serving them would pull Clara off its Primary.

## Quick Reference

| Attribute | Value |
| --- | --- |
| **Cast role** | negative |
| **Interface** | n/a - Clara is not designed for this use |
| **Role** | Product designer and front-end developer on consumer and marketing surfaces |
| **Context** | Landing pages, onboarding flows, campaign microsites, a brand book to honour |

## Who They Are

Theo builds the surfaces that sell the product: the marketing site, the onboarding flow, the
pricing page. His work is judged on whether it feels distinctive and on-brand, and he is good at it.
He finds Clara appealing because it is well-built and accessible, and he would like to use it as
the base for a landing page with a brand gradient, a hero animation, and rounder corners.

Everything he wants is legitimate. None of it is Clara's job.

## End Goals (stated to exclude)

*Real goals. Serving them would pull Clara off its Primary.*

1. Express a brand identity visually - gradients, illustration, motion, distinctive shape language
2. Vary the visual treatment per page or per campaign
3. Reach for decorative animation to create delight and momentum
4. Override component internals freely to match a comp exactly

## Why we are not designing for them

Clara's first principle is clarity over decoration, and its seventh is that colour is reserved for
meaning. Those are not stylistic preferences - they are what make a screen readable at 4pm on the
two-hundredth record. Every accommodation Theo needs pulls directly against them:

- **A brand gradient** breaks the rule that colour carries meaning. Once decoration uses colour,
  the status colours stop standing out, and Grace loses the scan she depends on.
- **Per-page visual variation** breaks predictability, which is principle 2. A system whose look
  varies by page is not a system.
- **Decorative motion** is exactly what principle 1 excludes: motion that communicates nothing.
- **Overriding component internals** breaks the token-layer theming boundary (D0007) and makes
  every future upgrade a negotiation.

Serving Theo would not make Clara worse at his job. It would make Clara worse at Sofia's and
Grace's, which is the only job it has.

## Behaviours & Context

- **Environment:** Figma beside the editor, working from a comp that is expected to be matched
  closely. Ships fast, iterates per campaign.
- **Frequency:** Bursty - intense work on a launch, then months on other surfaces.
- **Proficiency:** Strong visual design and CSS. Accustomed to systems that bend to the design
  rather than the other way round.

## Frustrations

- A restrained token palette that cannot express a brand
- Components that refuse the visual variation a campaign needs
- A theming layer that stops at semantic tokens, so a bespoke treatment means forking
- Documentation that answers "how do I make this look different" with "you do not"

## How to handle a request from them

**Decline, and redirect.** The answer is not "no" but "not this, and here is what is":

1. Point at the tokens. `@luzentialabs/clara-tokens` can be adopted alone, so a marketing surface
   can inherit Clara's type scale, spacing, and neutrals without its components or its restraint.
2. Name the boundary plainly: Clara themes at the tier 2 token layer and nowhere else. A request
   that needs component internals is a request for a different library.
3. Record it as a data point, not a defect. A recurring version of this request is evidence about
   scope, and belongs in Future Considerations rather than in a component.
4. Do not compromise halfway. A "slightly more expressive" Clara serves neither Theo nor Grace, and
   half-accommodations are how a system loses its reason to exist.
