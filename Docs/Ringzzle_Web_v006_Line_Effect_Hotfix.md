# Ringzzle Web v006 Line Effect Hotfix

Date: 2026-06-08

## Goal

v006 is a client-only visual and play-feel hotfix for the v005 clear feedback. It does not change Ringzzle gameplay rules, scoring rules, color progression, tray generation, localStorage stats, or any production hosting settings.

## v005 Issue

Owner playtesting found that the v005 line-clear beam felt too long and disruptive. Instead of reading as a quick clear confirmation, it looked like a persistent guide or crosshair line across the play screen.

Observed problems:

- Clear beams could visually extend beyond the matched 3 board cells.
- The line effect could read as screen-wide, crossing the board, tray, and background.
- Long fade timing made moves feel delayed and harder to read.
- Repeated clears risked making the board feel cluttered instead of satisfying.

## v006 Fix

Line-clear beams should be short, board-contained, and fast.

Implementation direction:

- Draw each beam only across the matched 3 board cells.
- Keep the effect inside, or very close to, the 3x3 board panel.
- Clip the beam to the board panel bounds so it cannot cross into the tray rack.
- Use the matched clear color.
- Fade and destroy the beam quickly, with a target duration around 180ms to 250ms.
- Clear previous move effects before drawing new ones to prevent leftover lines.

## Input And Timing

v006 should keep move resolution prompt:

- Placement logic applies immediately on valid drop.
- The line animation plays as feedback, not as a long input-blocking sequence.
- Clear flash timing is shortened so the board returns to a normal readable state quickly.
- Restart remains responsive.

## Color Burst

The v005 Color Burst gameplay rule remains:

- Completing small, medium, and large rings of one color in the same cell clears all rings of that color on the board.
- Other colors are preserved.
- Overlaps with line clears are de-duplicated.

Visual guidance:

- Color Burst can keep a short contained pulse around the source cell.
- It must not create long screen-wide lines.
- It should fade quickly enough that the next move still feels responsive.

## Board And Tray

The v005 board/tray separation should remain:

- The board reads as the main play area.
- The tray reads as a separate bottom rack.
- Effects must not cross into the tray rack.
- The tray remains visible and easy to drag from on iPhone Safari-like portrait viewports.

## Non-Goals

v006 does not add backend, D1, leaderboard, login, ads, analytics, IAP, Daily Challenge, fake ranking, Cloudflare Functions, or production setting changes.
