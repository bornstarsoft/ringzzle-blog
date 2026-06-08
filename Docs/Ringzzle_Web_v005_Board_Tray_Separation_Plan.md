# Ringzzle Web v005 Board Tray Separation Plan

Date: 2026-06-09

## Goal

v005-new is a small visual clarity pass on top of the restored v004 baseline.

v004 remains the gameplay baseline. This pass changes only how the 3x3 board and bottom tray are visually framed.

## Scope

Allowed:

- Make the board read clearly as the main 3x3 play area.
- Give the board a stronger panel, border, and shadow.
- Make the tray read clearly as a separate bottom rack or holding area.
- Make tray slots look different from board cells.
- Preserve tap and drag target size.
- Preserve mobile Safari-safe portrait fit.

Not allowed:

- No Color Burst.
- No line clear beam or line clear visual effect.
- No gameplay rule changes.
- No scoring changes.
- No color progression changes.
- No tray generation changes.
- No backend, leaderboard, login, ads, analytics, IAP, Daily Challenge, fake ranking, or Cloudflare Functions.

## Visual Direction

Board:

- Use a darker framed board panel behind the 3x3 cells.
- Add a subtle border and shadow so the board reads as one play surface.
- Keep individual cells visible and easy to target.
- Keep existing placement, preview, invalid, and clear flash feedback.

Tray:

- Use a separate rack-style background below the board.
- Draw tray slots as smaller pill-like holders inside the rack rather than board-cell clones.
- Keep the interactive drop/drag area unchanged so tray pieces remain easy to grab.
- Keep the tray above the mobile Safari bottom toolbar.

## Preservation

The earlier broad v005/v006 experiment remains preserved as history and backup reference. The active `ringzzle.v005.*` files for this pass should be based on v004 behavior, not the previous Color Burst / line-effect experiment.

The previous broad v005 experiment assets are archived as:

- `static/play/css/ringzzle.v005-experiment-clear-burst.css`
- `static/play/js/ringzzle-phaser.v005-experiment-clear-burst.js`

Those archive files are not active `/play/` assets.

## Validation

Validation should confirm:

- `/play/` references `ringzzle.v005.css` and `ringzzle-phaser.v005.js`.
- Logic tests still confirm v004 gameplay behavior under the v005 asset.
- Same-cell bonus remains local-only.
- No Color Burst behavior is present.
- No line-clear beam is present.
- Browser smoke passes valid placement, invalid drop, and restart.
- Mobile viewports `390x844`, `393x852`, and `430x932` still fit with tray visible and no scroll overflow.
