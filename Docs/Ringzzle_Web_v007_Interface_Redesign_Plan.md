# Ringzzle Web v007 Interface Redesign Plan

Date: 2026-06-09

## Goal

v007 is a stronger visual-only interface redesign for the active `/play/` game.

Owner feedback on v006:

- v006 was too subtle and still looked close to the earlier UI.
- The board/tray were technically distinct, but the interface still felt muddy and amateur.
- Tray wells still read as awkward soft holders rather than polished ring slots.
- CSS-only polish is insufficient because the board, tray, rings, and HUD are mostly drawn inside the Phaser canvas.

## Scope

v007 changes presentation only:

- Phaser canvas rendering constants and drawing code.
- CSS shell palette for the page around the canvas.
- Active asset version references.
- Test asset-version guard.

v007 does not change:

- Gameplay rules.
- Color-only line clear logic.
- Local-only same-cell bonus behavior.
- Scoring.
- Color progression.
- Tray generation.
- Game over logic.
- Storage keys.
- Backend, leaderboard, login, ads, analytics, IAP, Daily Challenge, or Cloudflare Functions.

## Tray Redesign

The tray should feel like a polished bottom rack, not a row of stretched pill holders.

Direction:

- Use rounded-square wells inside a dark rack instead of elongated ovals.
- Size each well visibly larger than the largest ring.
- Keep the largest ring comfortably inside its holder with clear margin.
- Use stronger contrast between the well face and the rack body.
- Keep the existing touch/drag hit area unchanged.
- Keep the tray visible above Safari toolbars on target mobile viewports.

## Board Redesign

The board should read as the main puzzle stage.

Direction:

- Use a cleaner dark navy/blue/teal panel rather than muddy green-on-green.
- Use a restrained but clearer outer frame.
- Make the 3x3 cells read as crisp puzzle tiles.
- Reduce low-contrast ghost-ring noise in empty cells.
- Keep preview, invalid, and clear-flash feedback readable.

## Ring Rendering

Rings should look brighter, cleaner, and more premium.

Direction:

- Use a more vivid red, green, blue, yellow, violet, and orange palette.
- Keep small, medium, and large sizes easy to distinguish.
- Add controlled dark shadow and light highlight strokes.
- Avoid heavy glow, particles, copied assets, or over-stylized effects.

## HUD Polish

The HUD should stop feeling like default web controls.

Direction:

- Use darker themed score chips with clearer borders.
- Make the restart control match the game palette.
- Preserve the simple compact layout and current text.

## Mobile Checks

v007 must continue to support:

- `390x844`
- `393x852`
- `430x932`

Required checks:

- No scroll overflow.
- Tray remains visible.
- Board and tray remain centered and balanced.
- Largest tray ring fits inside the redesigned tray well.
