# Ringzzle Web MVP Plan

Date: 2026-06-08

## Product Direction

Ringzzle Web is a lightweight Phaser HTML5 color rings puzzle game that will later run at `/play/`.

Core copy:

- `Ringzzle`
- `Free color rings puzzle game.`
- `No install. Just play.`

SEO title:

`Ringzzle — Free Color Rings Puzzle Game Online`

Game description:

`Place colorful rings, clear lines, complete cells, and chase your best score.`

## v001 Goal

Ship a polished, browser-playable Classic mode at `/play/` with local score motivation and mobile portrait stability. v001 should be static, fast, and self-contained.

Historical note: v001/v002 shipped with same color plus same size line clears. Owner clarification after v002 corrected this for v003: line clears are color-only across rows, columns, and diagonals; ring size affects placement occupancy only.

## v001 Gameplay Target

- Board: 3x3.
- Tray: 3 tray pieces.
- Tray piece shape: one ring per tray piece.
- Ring sizes: small, medium, large.
- Colors: use 6 colors initially; keep the palette small enough to reduce random dead boards. A 5-color variant can be tested if the game feels too random.
- Cell occupancy: one ring per size per board cell.
- Coexistence: different sizes can coexist in the same cell.
- Placement: a tray ring can be placed only if the target cell does not already contain that ring size.
- Line clear: historical v001 target used same color plus same size; v003 supersedes this with color-only line clears.
- Same-cell bonus: optional v001 bonus when small, medium, and large in one cell are the same color.
- Score: show current score during play.
- High score: save best score in localStorage.
- Restart: reset the board and tray while preserving high score.
- Game over: when no remaining tray ring can fit anywhere on the board.
- Refill: refill the tray only after all 3 tray pieces are used.
- Layout: mobile portrait-first.
- Backend: none.
- Leaderboard: none.

## Recommended v001 Rule Details

Cell model:

- Store each board cell as three size slots: `small`, `medium`, `large`.
- Each slot is either empty or stores a color id.
- A tray piece has exactly `{ size, color }`.

Placement:

- A placement is valid if the board coordinate is inside the 3x3 board and the target size slot is empty.
- Invalid drops should return the piece to the tray and should not change score, board state, or tray state.

Line clearing:

- Check 8 lines after each valid placement: 3 rows, 3 columns, and 2 diagonals.
- Historical v001/v002 behavior checked each size independently.
- Current v003 behavior clears a line when all 3 cells in that line contain the same color in any ring size.
- Multiple lines may clear from one placement.
- If two clear rules touch the same ring, clear it once.

Same-cell bonus:

- If enabled, trigger when one cell has all three size slots filled with the same color.
- Recommended v001 behavior: clear those three rings and award a bonus. Do not clear the same color globally in v001 unless playtesting explicitly calls for the stronger Unity-style behavior.

Scoring recommendation:

- Placement: `+10`.
- Each size-line clear: `+100`.
- Each same-cell bonus: `+150`.
- Simultaneous clear bonus: `+50` for each additional clear event after the first in one move.

The exact numbers can be tuned later, but v001 should keep scoring readable and deterministic.

Game over:

- After each valid placement and any clears, inspect the remaining tray pieces.
- If at least one tray ring can fit in any cell, continue.
- If no tray ring can fit, show game over.
- If all tray slots are empty, refill first, then check game over.

## Proposed File Structure For v001

The first implementation should stay static and Hugo-friendly:

- `static/play/index.html`
  - Full-screen game shell.
  - Phaser CDN or pinned local Phaser asset.
  - Versioned Ringzzle CSS and JS.
- `static/play/css/ringzzle.v001.css`
  - Mobile-safe page and canvas layout.
  - `visualViewport` and safe-area-compatible CSS variables.
- `static/play/js/ringzzle-phaser.v001.js`
  - Exported logic core for tests.
  - Phaser scene and rendering.
  - Drag/drop, score, restart, game-over UI, localStorage.
- `tests/ringzzle_logic.test.cjs`
  - Node tests for all deterministic rule behavior.
- `README.md`
  - Later update from `Ringzzle Blog` to `Ringzzle Web`.

Do not create backend, D1, login, leaderboard, ads, analytics, IAP, Daily Challenge, mobile app CTA, or fake ranking features in v001.

## Mobile Layout Requirements

v001 must be designed around mobile Safari from the start:

- Portrait-first canvas layout.
- Tested viewport targets: 390x844, 393x852, 430x932.
- Use `visualViewport.height` for real available height.
- Account for `env(safe-area-inset-bottom)`.
- Keep the bottom tray above the Safari toolbar.
- Use fixed, full-viewport play shell behavior.
- Show rotate-to-portrait overlay for cramped landscape viewports.
- On orientation or viewport changes, run relayout at 0ms, 100ms, 300ms, and 600ms.

## Interaction Requirements

- Drag ghost follows the pointer immediately on pointer move.
- Drag ghost should use board-scale ring size while being dragged.
- Valid drop preview should be visually clear.
- Invalid drops animate back to their tray slot.
- Restart should be reachable but should not crowd the board or tray on small phones.
- Text must fit on small mobile viewports.

## Sound Policy

- Sound Off by default.
- WebAudio only after a direct user gesture.
- Saved sound preference must not pretend audio is unlocked on page load.
- Sound must remain optional; WebAudio errors must never block gameplay.

## Storage Policy

Allowed v001 localStorage:

- High score.
- Optional sound preference after a user-triggered sound enable.

Deferred:

- Daily stats.
- Anonymous player id.
- Nickname.
- Leaderboard submission data.

## Validation Plan

Before calling v001 ready:

- Run JS unit tests for rule behavior.
- Run `git diff --check`.
- Build or serve Hugo locally if the implementation touches Hugo templates.
- Use browser checks for `/play/` on desktop and mobile widths.
- Verify no backend or leaderboard URLs are introduced.
- Verify no existing blog/content files are deleted.

## Next Implementation Phase

Start with test-driven logic only:

1. Add `tests/ringzzle_logic.test.cjs` with failing tests for board, placement, clear, refill, score, high score, and game over.
2. Add a minimal exported Ringzzle core in `static/play/js/ringzzle-phaser.v001.js`.
3. Make the logic tests pass.
4. Add the Phaser scene and mobile layout.
5. Verify `/play/` in browser viewports before adding polish.
