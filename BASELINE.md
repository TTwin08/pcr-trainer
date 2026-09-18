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
| Inclusion | Download to local (lib/chess.js) |
| Notice | /LICENSES/chess.js.txt |

---

## Verification Evidence

- REQUIREMENT: M1 dependency license - VERIFIED
- CODE: SPCK local review - VERIFIED
- RUNTIME: Local server + Chrome Android - PASS
- REGRESSION: N/A (initial baseline)
- NOT VERIFIED: Board, Burmese font, PGN, Stockfish (M2/M4)

---

## Test Output (Evidence)

=== M1 SMOKE TEST: PASS ===

---

## M1 File Manifest

- index.html (M1 smoke test page)
- js/main.js (M1 smoke test script)
- lib/chess.js (chess.js v1.4.0 ESM)
- LICENSES/chess.js.txt (BSD 2-Clause notice)
- BASELINE.md (this file)

---

# Golden Baseline: M2

**Tag:** baseline/m2-pass
**Date:** 2026-09-17
**App Version:** 0.2.0
**Manifest:** v1.2 (APPROVED)
**Entry Baseline:** baseline/m1-pass (36f0627)

---

## M2 Scope

Chess Board Display - Foundation

---

## Architecture

index.html -> main.js -> board.js -> chess.js (M1)

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

- E1  Board 8x8 grid - PASS
- E2  Initial position correct - PASS
- E3  Unicode pieces - PASS
- E4  White at bottom - PASS
- E5  Coordinates a-h, 1-8 - PASS
- E6  FEN to Board state match - PASS
- E7  Chrome Android runtime - PASS
- E8  No console errors - DEFERRED to M3
- E9  M1 regression PASS - PASS
- E10 ES Module chain - PASS
- E11 Evidence package - Complete

Outcome: 10 PASS | 1 DEFERRED | 0 FAIL

---

## Carry-Over to M3

- E8: Verify console errors on desktop Chrome DevTools
  (mobile environment has no direct console access)

---

## M2 Constraints Compliance

- M1 Golden Baseline untouched (baseline/m1-pass / 36f0627)
- chess.js v1.4.0 exact - no version change
- No new dependencies
- No M3+ feature implemented
- Architecture: index.html -> main.js -> board.js
- No implementation without manifest approval
- STOP + ASK at every gate

---

# Golden Baseline Rules

The following are LOCKED:

- M1: baseline/m1-pass (commit 36f0627)
- M2: baseline/m2-pass (App v0.2.0)

Future work MUST begin from the latest verified baseline.

DO NOT:
- rewrite any prior baseline
- silently change dependencies
- change chess.js version
- add unapproved dependencies
- start next milestone without PO approval
- treat UNKNOWN as VERIFIED

If any uncertainty, conflict, missing evidence, or scope
ambiguity exists - STOP + ASK THE PRODUCT OWNER.

---

# Sign-off

M1: Product Owner - 2026-09-17
M2: Product Owner - 2026-09-17

Constitution Ref: V3.0.0 FINAL
Workflow Ref: v1.0 FINAL

---

# END OF BASELINE.md
---

# Golden Baseline: M3

**Tag:** baseline/m3-pass
**Date:** 2026-09-17
**App Version:** 0.3.0
**Manifest:** v1.1 (APPROVED)
**Entry Baseline:** baseline/m2-pass (7ed0c8b)

---

## M3 Scope

Burmese Font + UI Labels (Localization Foundation)

---

## Entry-Gates (BLOCKING)

ENTRY-GATE 1 — E8 Console Error Verification
  Method: Firefox Android + Eruda Console (bookmarklet)
  URL: localhost:7700
  Result: PASS — Error panel empty

ENTRY-GATE 2 — Font Source / Version / License Verification
  Font: Noto Sans Myanmar
  Version: v2.107 (tag NotoSansMyanmar-v2.107)
  Source: github.com/notofonts/myanmar
  License: SIL OFL 1.1 (OFL.txt at repo root)
  File: NotoSansMyanmar-Regular.ttf
  Format: TTF
  Size: 235.52 KB
  Inclusion: Local / fonts/
  Notice: LICENSES/NotoSansMyanmar-OFL.txt
  Result: PASS

---

## Architecture

index.html → main.js → board.js → chess.js (M1)
                   ↘
                    i18n.js (M3 NEW)

- index.html loads ONLY main.js (ES module)
- main.js imports board.js, i18n.js, chess.js
- i18n.js = hand-written EN/MY dictionary
- No external i18n library
- board.js unchanged from M2

---

## Deliverables

| File | Action | Status |
|------|--------|--------|
| fonts/NotoSansMyanmar-Regular.ttf | NEW | Uploaded (235.52 KB) |
| LICENSES/NotoSansMyanmar-OFL.txt | NEW | Uploaded |
| js/i18n.js | NEW | Uploaded |
| css/style.css | UPDATED | @font-face + Burmese class |
| index.html | UPDATED | lang=my + i18n hooks |
| js/main.js | UPDATED | i18n import + label apply |

---

## Exit Criteria Results (E1-E14)

- E1  Font file included locally — PASS
- E2  Font license notice — PASS
- E3  @font-face applied — PASS
- E4  Title renders — PASS
- E5  Subtitle renders in Burmese — PASS
- E6  Other static labels — N/A (M3 scope)
- E7  Font fallback chain works — PASS
- E8  Console errors (ENTRY-GATE 1) — PASS
- E9  Board (M2) regression — PASS
- E10 M1 smoke test regression — PASS
- E11 Chrome Android runtime — PASS
- E12 No new JS library — PASS
- E13 Evidence package — Complete
- E14 Architecture unchanged — PASS

Outcome: 13 PASS | 1 N/A | 0 FAIL

---

## Runtime Evidence

- Local: localhost:7700 → PASS (Firefox, Eruda console clean)
- GitHub Pages: ttwinO8.github.io/pcr-trainer → PASS
- M1 regression: === M1 SMOKE TEST: PASS ===
- M2 regression: [M2] Board rendered: 64 squares, 32 pieces
- Burmese render: subtitle displays correctly

---

## Deployment Note

- Primary: Local HTTP Server (dev)
- Secondary: GitHub Pages (documentation/demo)
- Font remains local (no CDN)

---

## M3 Constraints Compliance

- M1 Golden Baseline untouched (baseline/m1-pass / 36f0627)
- M2 Golden Baseline untouched (baseline/m2-pass / 7ed0c8b)
- chess.js v1.4.0 exact — no version change
- Only approved font added (Noto Sans Myanmar)
- No other new dependencies
- No M4+ feature implemented
- Architecture: index.html → main.js → board.js + i18n.js
- STOP + ASK enforced at every gate

---

## Carry-Over to M4

- None (E8 was resolved in Entry-Gate 1)

---

## Sign-off

- M3: Product Owner — 2026-09-17
- Constitution Ref: V3.0.0 FINAL
- Workflow Ref: v1.0 FINAL

---
---

## M4 — PGN Import/Export + Privacy

**App Version:** 0.4.0
**Tag:** baseline/m4-pass
**Entry Baseline:** baseline/m3-pass (0dd08a1)
**Date:** 2026-09-18

### Deliverables

| File | Type | Size | License |
|---|---|---|---|
| `lib/pgn-parser.umd.js` | NEW | 454,005 B | Apache-2.0 |
| `LICENSES/pgn-parser-LICENSE.txt` | NEW | 11.1 KB | — |
| `js/pgn-model.js` | NEW | ~103 lines | PCR-owned |
| `js/pgn-ui.js` | NEW | ~166 lines | PCR-owned |
| `js/main.js` | UPDATE (+2 imports, +M4 block) | — | — |
| `index.html` | UPDATE (+UMD script line) | — | — |

### Architecture

index.html → [UMD parser] → [main.js module]
  main.js → board.js + i18n.js + chess.js
  main.js → pgn-model.js (parse/serialize)
  main.js → pgn-ui.js (DOM handlers)

### Dependency Lock

- @mliebelt/pgn-parser v1.4.19 (pinned)
- window.PgnParser interface (parse, parseGame, parseGames, split)
- No package.json change · No npm install · No CDN at runtime
- No @mliebelt/pgn-types runtime reference (verified)

### Regression Status

| Test | Result |
|---|---|
| M1 smoke test | PASS |
| M2 board render (64 sq / 32 pc) | PASS |
| M3 Burmese i18n labels | PASS |
| M4 UI (Import/Export buttons) | PASS |

### Verification Status

**Step 8 test suite: 23/24 PASS** (initial run)

- ❌ 1 FAIL — `M4 nags array (first move $1) → []`
- **Root cause:** parser emits `m.nag` (singular), code read `m.nags` (plural)
- **Fix applied:** `js/pgn-model.js` line 49 → `normalizeNags(m.nag)`

**Fix verification (evidence):**
- ✅ E1 — `pgn-model.js` line 49 = `m.nag` (screenshot)
- ✅ Diag — parser emits `m.nag = ["$1"]` (screenshot)
- ✅ Input/output match — logic proven

⚠️ **Runtime re-run of Step 8 — DEFERRED**
- Browser/server issue prevented clean re-run (attempted 4×)
- Deferred to next session (fresh browser)
- Governance note: M4 = **implementation complete, runtime re-verify partial**

### Constraints Preserved

- 🔒 M1/M2/M3 baselines IMMUTABLE
- 🔒 chess.js v1.4.0 exact
- 🔒 No M4 scope creep (no RAV rendering, no drag-drop, no engine)
- 🔒 Local-only processing (no network, no telemetry, no analytics)

### Known Limitation (M4 v1)

- Board does **NOT** update from imported PGN (deferred to M5)
- UI shows Import/Export buttons only

### Deferred to Next Session

1. Runtime re-run of `test-m4-step8.html` → expect 24/24 PASS
2. Clean up test files (`test-m4-step8-diag.html`)
3. Update BASELINE.md with runtime PASS

---

---

## M5 — Board Update from Imported PGN

**App Version:** 0.5.0
**Tag:** baseline/m5-pass
**Entry Baseline:** baseline/m4-pass (0742814)
**Date:** 2026-09-18

### Deliverables

| File | Type | Size | Notes |
|---|---|---|---|
| `js/pgn-viewer.js` | NEW | 314 lines | Navigation + board driver |
| `js/main.js` | UPDATE | +1 import, +M5 block, +1 M4 line change | See "M4 Block Change" |
| `index.html` | UPDATE | +#pgn-viewer div, duplicate fix | See "index.html Fix" |

### Architecture (M5)

index.html → [UMD parser] → [main.js module]
  main.js → M1 (chess.js) + M2 (board.js) + M3 (i18n.js)
  main.js → M4 (pgn-model.js + pgn-ui.js)
  main.js → M5 (pgn-viewer.js) ← NEW

### Capability Ownership

- `js/pgn-model.js` (M4) — authoritative PCR game model — UNCHANGED
- `chess.js v1.4.0` (M1) — legality + FEN — UNCHANGED
- `js/board.js` (M2) — renderBoard(container, fen) — UNCHANGED
- `js/pgn-ui.js` (M4) — Import/Export — UNCHANGED
- `js/pgn-viewer.js` (M5) — NEW — navigation + board driver
- `js/main.js` (M5) — wires viewer (additive)
- `index.html` (M5) — viewer container (additive)

### Test Results — T1–T7 + T9: 9/9 PASS

| Test | Result | Detail |
|---|---|---|
| T1 | ✅ PASS | Game list renders |
| T2 | ✅ PASS | Initial position (moveIdx=0) |
| T3 | ✅ PASS | Next → moveIdx 0→1 |
| T4 | ✅ PASS | Prev → moveIdx 3→2 |
| T5 | ✅ PASS | Final → moveIdx=6 |
| T6 | ✅ PASS | FEN/SetUp starts from FEN |
| T7 | ✅ PASS | Invalid move → graceful error |
| T9a | ✅ PASS | REF-1 per-ply FEN (7/7) |
| T9b | ✅ PASS | REF-2 per-ply FEN (3/3) |

**Evidence:** Screenshots + console output captured.

### T9 — Independent FEN Verification

Expected FENs from **PO-run chess.js v1.4.0** (Step 5 generator).
Not AI-generated. Independent reference source.

- REF-1: mainline (Ruy Lopez, 6 plies) — 7 FENs
- REF-2: FEN/SetUp start (e4 position, 2 plies) — 3 FENs

### Fixes During Implementation

**Fix A — `js/pgn-viewer.js` moveIdx semantics**
- Bug: moveIdx range `-1..N` caused off-by-one (state `-1` and `0` duplicate)
- Fix: moveIdx range `0..N` (0 = initial, N = final)
- Verified: T3 (Next) + T9 (per-ply) now PASS

**Fix B — `test-m5-verify.html` expected values**
- Issue: PGN tag FEN (`... e3 0 1`) differs from chess.js normalized output (`... - 0 1`)
- Cause: chess.js v1.4.0 normalizes en passant square when not capturable
- Fix: expected value updated to match chess.js output

### M4 Block Change (Honest Note)

**`js/main.js` M4 block — 1 line change:**
```diff
- initPgnUI({
+ const uiHandle = initPgnUI({
    parseAndMap: (text) => parseAndMap(Parser, text),
    toPGN,
  });

---

## M6 — Post-Import Viewer Refresh

**App Version:** 0.6.0
**Tag:** baseline/m6-pass
**Entry Baseline:** baseline/m5-pass (4faed3b)
**Date:** 2026-09-18

### Goal

M5 viewer ကို M4 import flow နဲ့ ချိတ်ဆက်။ PGN import
ပြီးရင် viewer auto-refresh ဖြစ်ရမယ်။

Core objective:
"Import PGN → viewer dropdown updates → board
 shows first game's initial position → navigation
 buttons enable"

### Deliverables

| File | Type | Change | Notes |
|---|---|---|---|
| `js/pgn-ui.js` | UPDATE | +4 lines | onImport callback param |
| `js/main.js` | UPDATE | +7 lines | pre-declare viewerHandle (TDZ) + onImport wiring |

**Net additions:** ~11 lines · logic preserved

### Architecture (M6)

index.html → [UMD parser] → [main.js module]
  main.js → M4 (pgn-ui.js) with onImport callback
  onImport → M5 (pgn-viewer.js) refresh()
  viewer → M2 (board.js) renderBoard()

### Changes Summary

**js/pgn-ui.js (+4 lines):**
- Signature: `initPgnUI({ parseAndMap, toPGN, onImport })`
- Success path: callback invocation with try/catch swallow
- Error path: untouched (onImport NOT called on error)

**js/main.js (+7 lines):**
- Pre-declare `let viewerHandle = null;` before M4 block (TDZ safety)
- M4 block: `onImport: () => { viewerHandle.refresh(); }` callback
- M5 block: `const viewerHandle` → `viewerHandle =` (assign to pre-declared)
- M1/M2/M3 blocks: untouched

### Test Results — T1–T6, T8

| Test | Result | Detail |
|---|---|---|
| T1 | ✅ PASS | Valid import → 1 game, options=1 |
| T2 | ✅ PASS | First game auto-selected (selectedIdx=0, moveIdx=0) |
| T3 | ✅ PASS | Board shows initial FEN (match) |
| T4 | ✅ PASS | Nav buttons: init/prev disabled, next/final enabled |
| T5 | ✅ PASS | Invalid import → viewer preserved (state=same, board=same) |
| T6 | ✅ PASS | M5 regression inline (9/9 sub-tests) |
| T8 | ✅ PASS | Network heuristic + static review (zero fetch/XHR/CDN) |

**Grand Total: 7/7 PASS · T6 sub-tests: 9/9 PASS**

### T6 — M5 Regression Detail (Inline 9 sub-tests)

| Sub-test | Covers | Result |
|---|---|---|
| T6.1 | M5-T1 game list renders | ✅ options=1 |
| T6.2 | M5-T2 initial position | ✅ moveIdx=0, fenMatch=true |
| T6.3 | M5-T3 Next updates board | ✅ moveIdx 0→1 |
| T6.4 | M5-T4 Prev updates back | ✅ moveIdx 3→2 |
| T6.5 | M5-T5 Final shows last FEN | ✅ moveIdx=6 |
| T6.6 | M5-T6 FEN/SetUp starts from FEN | ✅ fen match |
| T6.7 | M5-T7 invalid SAN → graceful error | ✅ viewerAlive=true |
| T6.8 | M5-T9a REF-1 per-ply FEN | ✅ 7/7 match |
| T6.9 | M5-T9b REF-2 per-ply FEN | ✅ 3/3 match |

**→ M5 functionality fully preserved through M6 changes.**

### T5 — Invalid Import Behavior (Documented)

**Test setup:**
- Precondition: valid PGN already imported (T1 state)
- Invalid import: `'[Event "M6-BAD'` (unclosed bracket —
  parser-level error)

**Actual M4 flow (verified at runtime):**
1. `parseAndMap` throws (parser error)
2. M4 catch block executes: state.games=[], status=error
3. `onImport` NOT called (success path only)
4. Viewer internal state unchanged (state=same, board=same)

**PASS criterion:** viewer state + board DOM identical
before/after invalid import. ✅ Verified.

### T8 — Static Network Review

| File | fetch/XHR/CDN/dynamic import |
|---|---|
| `js/pgn-ui.js` | none |
| `js/main.js` | none |
| `js/pgn-viewer.js` | none |

**Local APIs used:** File API · Blob · Clipboard ·
DOM · chess.js (local) · pgn-parser (local UMD)

### Constraints Preserved

- 🔒 M1/M2/M3 baselines IMMUTABLE
- 🔒 M4/M5 baselines preserved (tags not moved)
- 🔒 chess.js v1.4.0 exact
- 🔒 @mliebelt/pgn-parser v1.4.19 only
- 🔒 No new dependency
- 🔒 No package.json change
- 🔒 No npm install
- 🔒 No CDN at runtime
- 🔒 Local-only processing (no network/telemetry/analytics)

### M4 Status (Honest Note — Law 1)

- **M4 = CONDITIONAL CLOSE** (unchanged)
- M4 file `pgn-ui.js` touched: +4 lines
- This is an M6-scoped addition (onImport callback)
- M4 runtime 24/24 remains a **separate deferred
  sequence** — NOT claimed as verified in M6
- M6 test T6.7 confirms M4's error path behavior
  remained intact

### M5 Status

- **M5 = CLOSE** (baseline/m5-pass, 4faed3b)
- `js/pgn-viewer.js` UNCHANGED
- `index.html` UNCHANGED
- M5 baseline tag NOT moved

### Known Limitations (M6 v1)

1. **onImport success-only** — invalid import does
   NOT trigger onError callback.
   Viewer preserves prior state (intentional v1 design).
   Future milestone may add onError if needed.
2. **Board position after failed nav** — invalid SAN in
   valid-parsed game → board shows last valid FEN
   (unchanged behavior from M5).
3. **No re-import of same file** — fileInput.value reset
   works (M4 behavior preserved).

### Deferred to Next Session

1. M4 runtime re-verify (24/24) — separate sequence
   from M6, still pending
2. M5 UX deferred: title (M3→M5) stale, viewer
   position
3. Cleanup: test-m6-verify.html, test-m4-step8-diag.html
4. M7 planning

---

