# Ringzzle Web v013 Color Burst Effect And Progression Tune

Date: 2026-06-09

## Context

v012 Color Burst works functionally, but owner playtest feedback found the visual explanation too weak. Players need a clearer cue that the completed same-color cell is the source and that matching-color rings across the board are being cleared.

Color Burst also made the v004/v012 score-based color progression feel too fast, because a single Color Burst can add enough score to unlock colors earlier than intended.

## v013 Changes

- Improve Color Burst readability with short same-color source-to-target cue links.
- Keep the cue board-contained, brief, and lightweight.
- Show the completed cell as the burst source.
- Briefly connect the source cell to other same-color rings that are being cleared.
- Clean all burst cue graphics after the short effect.
- Slow score-based color progression.

## v013 Color Progression

- Score `0+`: 3 colors.
- Score `250+`: 4 colors.
- Score `800+`: 5 colors.
- Score `1600+`: 6 colors.

Existing board and tray rings are not retroactively recolored when a new color count unlocks. Future tray generation continues to respect the current unlocked color count.

## Non-Changes

- No normal line-clear rule changes.
- No Color Burst rule changes.
- No tray generation logic changes beyond the new progression thresholds.
- No scoring changes.
- No v011 line match indicator changes.
- No v010 drag ghost cleanup changes.
- No backend, leaderboard, ads, analytics, login, IAP, Daily Challenge, fake ranking, Cloudflare Functions, CNAME, config, or production setting changes.
