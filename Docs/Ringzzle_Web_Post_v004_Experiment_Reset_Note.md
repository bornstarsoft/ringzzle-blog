# Ringzzle Web Post-v004 Experiment Reset Note

Date: 2026-06-08

## Decision

Ringzzle Web should return to v004 as the active `/play/` baseline.

v004 felt good in owner playtesting and should be treated as the stable play-feel reference while the game continues to iterate.

## What Happened

v005 and v006 explored several changes together:

- Stronger board/tray visual separation.
- Same-cell Color Burst behavior.
- Line-clear beam effects.
- Faster effect cleanup after the v006 hotfix.

The combined experiment changed too much at once. Even after the v006 line-effect hotfix, the overall play feel became strange compared with v004.

## Preservation

v005 and v006 are preserved as experiment history and backup reference.

Do not delete those versioned assets or docs unless a later cleanup task explicitly asks for it. They remain useful for reviewing what was tried and for selectively reintroducing improvements.

## Active Baseline

The active `/play/` page should reference:

- `ringzzle.v004.css`
- `ringzzle-phaser.v004.js`

The logic tests should also validate the v004 rules and behavior.

## Future Improvement Order

Reintroduce improvements one at a time:

1. Board/tray separation only.
2. Color Burst only.
3. Short board-contained line clear effect only.

Each item should get its own plan, implementation, browser smoke test, mobile check, and owner playtest before combining with the next item.

## Non-Goals

No backend, leaderboard, login, ads, analytics, IAP, Daily Challenge, fake ranking, Cloudflare Functions, or production setting changes are part of this reset.
