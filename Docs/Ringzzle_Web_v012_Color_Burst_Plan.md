# Ringzzle Web v012 Color Burst Plan

Date: 2026-06-09

## Goal

v012 adds Color Burst only.

The stable v011 baseline remains in place:

- Normal line clears remain color-only row, column, and diagonal clears.
- The v011 short board-contained line indicator remains unchanged.
- Score-based color progression remains unchanged.
- Tray generation remains unchanged.
- v010 drag ghost cleanup remains unchanged.

## Color Burst Rule

Color Burst triggers when one board cell contains small, medium, and large rings of the same color after a valid placement.

When triggered:

- All rings of that color are cleared from the board.
- Other colors remain on the board.
- Rings already included in a simultaneous line clear are not double-counted.
- A conservative Color Burst bonus is awarded.
- The result is deterministic and covered by tests.

## Visual Cue

Color Burst uses a simple, brief board-contained cue. It does not add long screen-wide effects, does not delay input, and cleans itself up after the short feedback.

## Non-Goals

No backend, leaderboard, ads, analytics, login, IAP, Daily Challenge, fake ranking, Cloudflare Functions, production setting changes, CNAME changes, or repo rename are included.
