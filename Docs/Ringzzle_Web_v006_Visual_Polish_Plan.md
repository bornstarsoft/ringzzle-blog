# Ringzzle Web v006 Visual Polish Plan

Date: 2026-06-09

## Goal

v006 is a visual-only presentation polish pass on top of the active v005-new board/tray separation work.

The gameplay baseline remains the restored v004 behavior:

- Color-only line clears.
- Local-only same-cell full color bonus.
- Same score constants.
- Same color progression.
- Same tray generation.
- No Color Burst.
- No line clear beam or line clear effect.

## Reference Direction

Owner-provided Color Rings Puzzle screenshots should be used only as style inspiration. Do not copy branding, logo, exact layout, or assets.

Target qualities:

- Cleaner and sharper premium puzzle UI.
- Darker, less muddy board and tray surfaces.
- Stronger but tasteful separation between the play board and tray rack.
- Tray holders that comfortably contain the largest ring.
- Slightly more vivid, readable ring rendering.
- Mobile-first clarity.

## Tray Holder Redesign

The v005-new tray pills made the tray distinct, but the holder shape felt awkward and too small relative to the largest ring.

v006 direction:

- Replace the pill/oval slot look with stable circular wells inside a rack.
- Size each well around the largest tray ring with comfortable margin.
- Keep the full existing interactive drag area unchanged.
- Keep used/empty tray slots clearly disabled without looking like board cells.
- Keep the tray visible above Safari toolbars on target iPhone-like viewports.

## Board Frame Cleanup

v006 should make the board feel like the primary play area without adding visual noise.

Direction:

- Use a cleaner dark navy/teal panel rather than muddy green.
- Use subtle border and glow accents.
- Keep cells readable with restrained fill and border contrast.
- Keep existing preview, invalid, and clear flash feedback.

## Ring Rendering Polish

Ring colors should feel a bit more vivid and polished while staying readable on mobile.

Direction:

- Slightly adjust the palette toward clearer red, green, blue, gold, purple, and orange.
- Add controlled shadow/highlight strokes.
- Avoid heavy glow, particles, or animation changes.
- Keep ring sizes and placement behavior unchanged.

## Palette Cleanup

Reduce green-on-green monotony:

- Use a dark navy/teal page background.
- Let the board and tray share the same dark premium family while using different fills and accent borders.
- Keep text high contrast.
- Avoid a one-note palette dominated by only green.

## Mild HUD Cleanup

HUD cleanup is allowed only if it supports the visual polish:

- Make score metric chips cleaner and more consistent.
- Make the restart button feel integrated.
- Do not redesign the whole page.
- Do not add new HUD systems.

## Non-Goals

This pass does not add backend, D1, leaderboard, login, ads, analytics, IAP, Daily Challenge, fake ranking, Cloudflare Functions, production setting changes, Color Burst, line clear beams, new scoring, new color progression, or new tray generation logic.

## Validation

Validation should confirm:

- Active `/play/` references `ringzzle.v006.css` and `ringzzle-phaser.v006.js`.
- Logic tests still pass with v004 gameplay expectations.
- Same-cell full color bonus remains local-only.
- No Color Burst behavior or line clear beam/effect is active.
- Browser smoke passes valid placement, invalid drop, restart, and console checks.
- Mobile viewports `390x844`, `393x852`, and `430x932` fit without overflow.
- The tray well comfortably contains the largest tray ring.
