# BG-01M109XY: check-story-verifiers silently skips a story with no Test Plan, so 133 Verified stamps across 31 Done stories are outside the gate

> **Status:** inbox
> **Created:** 2026-08-27
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** scripts/check-story-verifiers.mjs, sdlc-studio/stories/_index.md, AGENTS.md
> **Severity:** Medium
> **Points:** 8

## Summary

`scripts/check-story-verifiers.mjs` is the gate AGENTS.md mandates to stop a criterion being stamped `Verified: yes` by tests that cannot see the code its own Test Plan says they must fail on. Both of its checks - the row-alignment check and the `Touches` reachability check - begin `if (!text.includes('## Test Plan')) continue`.

So a story with no Test Plan is not failed by the gate. It is SKIPPED by it, silently, and the gate reports PASS.

**31 stories are Done with no `## Test Plan`, carrying 133 `Verified: yes` stamps between them.** Every one of those stamps sits outside the check. The guard's own summary line reads as reassurance while saying so: `89 story verifier(s) ... and 72 reach the file its own mutant changes` - the gap between 89 and 72 is the stories it could not check, and nothing names it as a gap.

The skip is defensible as written (a story that has not been groomed has no Test Plan to check) but its CONSEQUENCE is not reported, and that is what makes it a defect rather than a design choice. A gate that quietly covers half the corpus is worse than one that covers none, because the PASS is read as coverage.

Found while closing US-01M0GMWW: DropdownMenu (US-01M0GM9W) had reached Done in the same session with six stamps and no Test Plan, and nothing anywhere objected. Its plan has since been filled from six mutants that were actually run, all killed. The other 31 have not.

This is the same shape as BG-01M107ND - a criterion or a gate claiming more than it checks - and the two should probably be fixed together.

## Steps to Reproduce

```text
python3 - <<'PY'
import glob, re
n=0; stamps=0
for f in sorted(glob.glob('sdlc-studio/stories/US-*.md')):
    t=open(f).read()
    st=(re.search(r'^> \*\*Status:\*\* *(.+)$', t, re.M) or [None,''])[1].strip()
    acs=len(re.findall(r'^### AC', t, re.M))
    if st=='Done' and acs and '## Test Plan' not in t:
        n+=1; stamps+=len(re.findall(r'\*\*Verified:\*\* yes', t))
print(n, stamps)
PY
```

-> `31 133`

Then `node scripts/check-story-verifiers.mjs` -> `PASS [story-verifiers] 89 story verifier(s) across 868 declared test name(s); every one selects a real test, and 72 reach the file its own mutant changes`.

Exit 0, with 133 stamps never examined. Confirm the mechanism directly: `grep -n "includes('## Test Plan')" scripts/check-story-verifiers.mjs` shows the two early-continues.

## Proposed Fix

**Report the skip. Then close it.**

**Step 1 - make the gap visible, which is the actual defect.** The PASS line must name what it could not check:

```text
PASS [story-verifiers] 89 verifier(s) ... 72 reach the file its own mutant changes;
  31 Done story/stories SKIPPED for having no Test Plan (133 stamps unchecked)
```

AGENTS.md already states the principle this violates - **no silent caps**. A gate that bounds its own coverage must say so, or its PASS is read as coverage it does not have. This alone is cheap and turns an invisible hole into a tracked number.

**Step 2 - refuse a DONE story with no Test Plan.** A Draft story legitimately has none; a Done one does not. Gate on status rather than on presence, so the skip keeps applying where it is correct and stops applying where it is not. Expect this to fail on all 31 the day it lands, which is the point, and is why step 1 comes first: the number has to be visible before it can be worked down.

**Step 3 - backfill.** 31 stories, each needing one measured mutant per criterion. The two filled this session (US-01M0GMQJ, US-01M0GM9W) are the worked examples and took roughly an hour each including running every mutant. This is the expensive part and it is real work, not paperwork: filling DropdownMenu's confirmed all six of its verifiers can fail, and filling Drawer's found a criterion verified entirely by a proxy.

**Do not backfill by inspection.** A Test Plan row asserts that a specific edit reddens a specific verifier. A row written from reading the test rather than from running the mutant is exactly the unverified claim this gate exists to catch, one level up.

\*\*Related:\*\* BG-01M107ND, the same class in the criteria themselves.

## Acceptance Criteria

### AC1: The gate reports what it could not check

- **Given** that both checks begin `if (!text.includes('## Test Plan')) continue`
- **When** `check-story-verifiers` runs
- **Then** its PASS line names how many Done stories were SKIPPED for having no Test Plan, and how
  many stamps that leaves unchecked
- **And** AGENTS.md's no-silent-caps rule is the principle: a gate that bounds its own coverage must
  say so, or its PASS is read as coverage it does not have
- **Verify:** shell node scripts/check-story-verifiers.mjs
- **Verification target:** functional

### AC2: A DONE story with no Test Plan is refused

- **Given** that a Draft story legitimately has no Test Plan and a Done one does not
- **When** a Done story carries none
- **Then** the gate FAILS rather than skipping
- **Verify:** shell node scripts/prove-guards-fail.mjs --only "Done story with no Test Plan"
- **Verification target:** functional

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-27 | sdlc-studio | Created via `new` (deterministic) |
