# Ringzzle Web v003 Rule Correction And Color Progression

Date: 2026-06-08

## Purpose

This note documents the v003 core gameplay correction for Ringzzle Web. v001/v002 implemented line clears as same color plus same size. Owner clarification confirmed that this was incorrect for Ringzzle / Color Rings gameplay.

v003 treats color-only line clears and score-based color-count progression as core gameplay rules, not polish.

## Unity Template Findings

Read-only reference:

`/Users/seongjinkim/dev_assets/9998 Puzzle Kit - Mobile Game Template/Assets/PuzzleGame`

Relevant inspected behavior:

- `GameControllerRings.CheckLines` checks all rows, columns, and diagonals.
- `CheckLine` evaluates colors present in the first cell of a line.
- A color line is detected when that same color appears somewhere in every cell of the line.
- `RingsController.Clear(int color)` removes that color from each affected cell regardless of which ring size slot contains it.
- Nonmatching colors in the same cells are preserved.
- `OnScoreUpdate` increases `currentColorsCount` as score crosses thresholds.
- The Rings prefab sets `startColorsCount: 3`, `colorsCount: 8`, and serialized score thresholds that decode to `25`, `50`, `150`, `250`, and `500`.
- Color probabilities in the prefab are `[100, 100, 100, 90, 80, 70, 60, 50]`.

The Unity template uses an 8-color cap. Ringzzle Web v003 currently has a 6-color palette, so the web cap is 6.

## Correct v003 Line Clear Rule

- Check each row, column, and diagonal after a valid placement.
- A line clears when the same color appears in all 3 cells of that line.
- Ring size must not be required for the line match.
- Ring sizes affect only placement occupancy: each cell can hold one small, one medium, and one large ring.
- When a color line clears, remove matching-color rings in that line regardless of ring size.
- Preserve nonmatching-color rings in the same involved cells.
- Support simultaneous row, column, and diagonal clears.
- If the same ring belongs to overlapping clears, clear it once and count it once.
- Award line clear score for every detected color line.

## Same-Cell Full Color Bonus

The web same-cell full color bonus remains allowed:

- If one cell has small, medium, and large rings all in the same color, award the local same-cell bonus.
- The current web behavior clears those three rings locally.
- This does not replace the line clear rule.
- The stronger Unity-style global color clear should stay deferred until playtesting explicitly chooses it.

## Web v003 Color Progression

Color-count progression is now core balance.

Ringzzle Web v003 starts with fewer colors and unlocks more colors by score:

- `score < 300`: 3 colors.
- `score < 900`: 4 colors.
- `score < 1800`: 5 colors.
- `score >= 1800`: 6 colors.

The thresholds are intentionally wider than the Unity template thresholds because the web scoring model includes visible placement points, line-clear points, combo points, and optional same-cell bonus points.

Tray generation uses only the currently unlocked color range. Existing board and tray rings are not retroactively changed when the score crosses a threshold.

## Implementation Notes

- v003 assets are versioned as `ringzzle.v003.css` and `ringzzle-phaser.v003.js`.
- The v003 page references only v003 assets.
- v001 and v002 assets remain in the repo for rollback history.
- No backend, D1, leaderboard, login, ads, analytics, IAP, Daily Challenge, or fake ranking is part of this phase.
- No Cloudflare Pages settings, `CNAME`, repo name, or existing blog content should be changed for this correction.
