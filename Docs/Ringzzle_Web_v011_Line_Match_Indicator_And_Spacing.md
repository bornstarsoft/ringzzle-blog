# Ringzzle Web v011 Line Match Indicator And Spacing

Date: 2026-06-09

## Goal

v010 is stable and much improved on real iPhone Safari. It fixed the stale drag ghost issue and improved the compact mobile layout.

v011 keeps the v010 direction and makes two small visual improvements:

- Add a little more spacing between the score panels and the board.
- Add a short matched-color line indicator when a row, column, or diagonal clears.

## Line Match Indicator

The indicator is visual-only. It uses the matched ring color and appears only across the three matched board cells.

It should:

- Stay inside or very close to the board panel.
- Avoid crossing into the tray or full viewport.
- Appear and fade quickly.
- Clean up existing indicators before drawing new ones.
- Support simultaneous row, column, and diagonal line clears.

## Non-Goals

No Color Burst, gameplay rule changes, scoring changes, color progression changes, tray generation changes, backend, leaderboard, ads, analytics, IAP, Daily Challenge, or Cloudflare settings are changed.
