# PCR Trainer — Golden Baselines

**Project:** Personal Chess Repertoire Trainer
**Constitution:** V3.0.0 FINAL + LOCKED
**Workflow:** v1.0 FINAL + LOCKED
**Repository:** github.com/TTwinO8/pcr-trainer

---

# Golden Baseline: M1

**Tag:** baseline/m1-pass
**Date:** 2026-09-17
**App Version:** 0.1.0
**Commit:** 36f0627 (GitHub main)
**Local Reference:** c4f976a (SPCK, reference only)

---

## M1 Scope

Asset & Dependency License Verification

---

## Dependency

| Field | Value |
|-------|-------|
| Name | chess.js |
| Version | v1.4.0 (exact, locked) |
| Source | github.com/jhlywa/chess.js |
| License | BSD 2-Clause "Simplified" |
| Copyright | (c) 2025, Jeff Hlywa |
| ESM URL | unpkg.com/chess.js@1.4.0/dist/esm/chess.js |
| File Size | 107,052 B / 105 KB (3368 lines) |
| Inclusion | Download → local (lib/chess.js) |
| Notice | /LICENSES/chess.js.txt |

---

## Verification Evidence

- **REQUIREMENT:** M1 dependency license — VERIFIED
- **CODE:** SPCK local review — VERIFIED
- **RUNTIME:** Local server + Chrome Android — PASS
- **REGRESSION:** N/A (initial baseline)
- **NOT VERIFIED:** Board, Burmese font, PGN, Stockfish (M2/M4)

---

## Test Output (Evidence)

---

---

# Golden Baseline: M2

**Tag:** baseline/m2-pass
**Date:** 2026-09-17
**App Version:** 0.2.0
**Manifest:** v1.2 (APPROVED)
**Entry Baseline:** baseline/m1-pass (36f0627)

---

## M2 Scope

Chess Board Display — Foundation

---

## Architecture

index.html → main.js → board.js → chess.js (M1)

- index.html loads ONLY main.js (ES module)
- main.js imports board.js + chess.js
- board.js = pure render module (ES exports)

---

## M2 Deliverables

| File | Action | Status |
|------|--------|--------|
| css/style.css | NEW | Uploaded |
| js/board.js | NEW | Uploaded |
| index.html | UPDATED | Verified |
| js/main.js | UPDATED | Verified |

---

## M2 Exit Criteria Results (E1-E11)

- E1  Board 8x8 grid — PASS
- E2  Initial position correct — PASS
- E3  Unicode pieces — PASS
- E4  White at bottom — PASS
- E5  Coordinates a-h, 1-8 — PASS
- E6  FEN to Board state match — PASS
- E7  Chrome Android runtime — PASS
- E8  No console errors — DEFERRED to M3
- E9  M1 regression PASS — PASS
- E10 ES Module chain — PASS
- E11 Evidence package — Complete

**Outcome: 10 PASS | 1 DEFERRED | 0 FAIL**

---

## Carry-Over to M3

- E8: Verify console errors on desktop Chrome DevTools
  (mobile environment has no direct console access)

---

## M2 Constraints Compliance

- M1 Golden Baseline untouched (baseline/m1-pass / 36f0627)
- chess.js v1.4.0 exact — no version change
- No new dependencies
- No M3+ feature implemented
- Architecture: index.html → main.js → board.js
- No implementation without manifest approval
- STOP + ASK at every STOP

---

# Golden Baseline Rules

The following are LOCKED:

- **M1:** baseline/m1-pass (commit 36f0627)
- **M2:** baseline/m2-pass (App v0.2.0)

Future work MUST begin from the latest verified baseline.

DO NOT:
- rewrite any prior baseline
- silently change dependencies
- change chess.js version
- add unapproved dependencies
- start next milestone without PO approval
- treat UNKNOWN as VERIFIED

If any uncertainty, conflict, missing evidence, or scope
ambiguity exists — STOP + ASK THE PRODUCT OWNER.

---

# Sign-off

**M1:** Product Owner — 2026-09-17
**M2:** Product Owner — 2026-09-17

**Constitution Ref:** V3.0.0 FINAL
**Workflow Ref:** v1.0 FINAL

---

# END OF BASELINE.md
