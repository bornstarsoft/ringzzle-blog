# Ringzzle Web v010 Drag Ghost And Spacing Hotfix

Date: 2026-06-09

## Goal

v009 is much improved on real iPhone Safari, especially compared with the earlier layout problem where the tray could be pushed behind Safari chrome.

v010 keeps the v009 visual style and fixes two remaining real-device issues:

- The board starts a little too close to the score panels.
- During fast play, a dragged ring can appear stuck between the board border and tray border, likely from stale drag ghost or return tween cleanup.

## Approach

v010 is a focused layout and visual-cleanup hotfix:

- Move the mobile board/tray group slightly downward to create more score-to-board breathing room.
- Preserve the existing compact header behavior so the subtitle and score panels do not overlap.
- Preserve the reduced-height Safari layout fit and keep the tray above the bottom toolbar reserve.
- Make drag ghost cleanup explicit and defensive.
- Clear existing drag ghosts and return tweens before starting a new drag.
- Destroy the drag ghost promptly after valid placement resolution.
- Destroy or complete-return invalid-drop ghosts without leaving orphan visuals.
- Cancel active drag visuals on restart, relayout, orientation/viewport changes, and document visibility changes.

## Non-Goals

No gameplay rules, scoring, color progression, tray generation, Color Burst, line clear beams/effects, backend, leaderboard, ads, analytics, IAP, Daily Challenge, or Cloudflare settings are changed.
