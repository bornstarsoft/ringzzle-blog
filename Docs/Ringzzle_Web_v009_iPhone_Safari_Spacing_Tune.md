# Ringzzle Web v009 iPhone Safari Spacing Tune

Date: 2026-06-09

## Goal

v008 fixed the major real iPhone Safari fit issue: the board and tray now fit within the visible Safari viewport, and the tray remains usable.

v009 keeps that direction and fixes two remaining real-device spacing issues:

- The top subtitle can be partially covered by the score panels on narrow iPhone Safari.
- The tray border sits too close to, or visually overlaps with, the board border.

## Approach

v009 is a layout-only micro-tune:

- Keep the v008 visual style.
- Use the existing `visualViewport`-driven layout.
- Shorten the subtitle on compact mobile so it stays one clean line.
- Add explicit subtitle-to-score clearance metrics.
- Increase the drawn board/tray gap.
- Slightly reduce compact tray height while preserving ring-holder usability.
- Keep the tray above the Safari bottom reserve in full and reduced-height iPhone cases.

## Non-Goals

No gameplay rules, scoring, color progression, tray generation, Color Burst, line clear beams/effects, backend, leaderboard, ads, analytics, IAP, Daily Challenge, or Cloudflare settings are changed.
