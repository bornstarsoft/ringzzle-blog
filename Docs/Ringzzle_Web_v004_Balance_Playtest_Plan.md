# Ringzzle Web v004 Balance Playtest Plan

Date: 2026-06-08

## Goal

v004 is a first-session balance pass for Ringzzle Web. The goal is to improve early-game feel without expanding scope, adding services, or overfitting before owner playtest evidence exists.

This phase treats color unlock pacing, tray fairness, scoring readability, and same-cell bonus behavior as balance topics. It does not add backend, D1, leaderboard, login, ads, analytics, IAP, Daily Challenge, fake ranking, or mobile app CTA.

## Current v003 Baseline

- Board: 3x3.
- Tray: 3 single-ring pieces.
- Tray sizes cycle one `small`, one `medium`, and one `large` per refill.
- Line clears are color-only across rows, columns, and diagonals.
- Ring size affects placement occupancy only.
- Web palette has 6 authored colors.
- v003 color thresholds:
  - 3 colors at score `0`.
  - 4 colors at score `300`.
  - 5 colors at score `900`.
  - 6 colors at score `1800`.
- Score:
  - Placement: `+10`.
  - Line clear: `+100`.
  - Same-cell bonus: `+150`.
  - Multi-clear bonus: `+50` for each extra clear event after the first.
- Same-cell full color bonus is local-only.

## Color Cap Decision

Recommendation for v004: keep the web MVP capped at 6 colors.

Why:

- The current web palette has 6 intentional colors.
- Moving to Unity's 8-color cap would require selecting and visually validating two more colors.
- A wider palette makes early mobile readability and random-feel tuning harder.
- v004 is a first-session balance pass, not a visual palette expansion.

Unity's 8-color cap should remain a later option after owner playtest confirms that advanced sessions need more difficulty and the palette can support two additional distinct colors.

## Threshold Evaluation

### v003 Thresholds

v003 uses `300 / 900 / 1800` for 4, 5, and 6 colors.

Risk:

- The first unlock may feel slow in early sessions because a player needs roughly 30 placements with no clears to see color 4.
- Because line clears remove rings, early successful play can slow board filling and delay difficulty ramp.
- First-session players may see too much of the same 3-color space before the game reveals its full identity.

### Unity Thresholds

Unity thresholds decode to `25 / 50 / 150 / 250 / 500`.

Risk for web:

- Web scoring includes `+10` per placement, `+100` per line clear, `+150` for same-cell bonus, and `+50` multi-clear bonuses.
- With web scoring, Unity's `25` and `50` thresholds can unlock colors after only a few placements.
- A single early line clear can jump through multiple Unity-style thresholds, making the difficulty ramp feel abrupt.

## v004 Threshold Decision

Use the conservative 6-color cap candidate:

- 3 colors: score `0`.
- 4 colors: score `150`.
- 5 colors: score `500`.
- 6 colors: score `1200`.

Why this is the best v004 candidate:

- It keeps the first session simple at 3 colors.
- It reveals color 4 earlier than v003, after about 15 placements or one clear plus a few placements.
- It delays color 6 enough that the game can breathe before reaching max randomness.
- It avoids Unity's too-fast thresholds under the current web scoring model.
- It changes only constants, so it is easy to test and easy to tune again.

The extended 8-color candidate should stay deferred:

- 3 colors: score `0`.
- 4 colors: score `150`.
- 5 colors: score `450`.
- 6 colors: score `900`.
- 7 colors: score `1600`.
- 8 colors: score `2500`.

That path needs new color selection, visual QA, and longer playtest data.

## Tray Generation Fairness

Current tray generation is acceptable for v004 with no code change beyond color thresholds.

What it already does well:

- Each 3-piece tray contains one small, one medium, and one large ring because sizes cycle by sequence.
- This avoids the most frustrating same-size blocked tray pattern.
- Generated colors respect the currently unlocked color count.
- Game over is checked after placement/refill against active tray pieces.

Known limitations to watch in playtest:

- The generator does not intentionally choose fit-guaranteed rings.
- It does not intentionally avoid blocked sizes late in a board.
- It does not intentionally create or avoid clear opportunities.

Do not add a heavier fairness generator in v004. A fit-aware or opportunity-aware generator could accidentally make the game too easy, hide the real difficulty curve, or introduce subtle bias before the owner has first-session playtest data.

## Score Tuning

Recommendation for v004: keep score values unchanged.

- Placement `+10` is readable and makes every valid move feel acknowledged.
- Line clear `+100` is clear enough to feel important without requiring a multiplier model.
- Multi-clear bonus `+50` rewards combos while keeping the math understandable.
- Same-cell bonus `+150` is slightly above a line clear and fits its rarity.

Do not tune score values in the same phase as color thresholds. Changing both at once makes playtest feedback harder to interpret.

## Same-Cell Full Color Bonus

Recommendation for v004: keep same-cell bonus local-only and defer Unity-style broader color clear.

Why:

- Local-only behavior is simple to understand and already tested.
- A global color clear would be a large balance change because it can remove many rings outside the completed cell.
- The Unity behavior may be fun later, but it needs UI messaging and separate score tuning.
- v004 should isolate the color progression experiment.

Owner playtest should specifically record whether the same-cell bonus is noticed, understood, and satisfying.

## v004 Implementation Scope

Low-risk implementation is justified:

- Create `ringzzle.v004.css` and `ringzzle-phaser.v004.js` from v003.
- Update `/play/` to reference v004 assets.
- Change `CLIENT_VERSION` to `v004`.
- Change only `COLOR_PROGRESSION` thresholds to `0 / 150 / 500 / 1200` under the same 6-color cap.
- Update tests for v004 version and thresholds.
- Preserve v001/v002/v003 files for rollback history.

Do not add new gameplay systems in v004.

## Playtest Questions

Owner playtest should answer:

- Did color 4 appear too early, too late, or at the right moment?
- Did color 5 make the board feel meaningfully harder?
- Did color 6 arrive before the player understood line clears?
- Did game over feel fair?
- Did tray pieces feel blocked because of size, color, or both?
- Were line clears understandable as color-only?
- Was the same-cell bonus noticed and understood?
- Did scoring feel readable?

## Recommended Next Phase

After owner playtest, run a v005 tuning pass based on recorded sessions. Good candidates:

- Adjust color thresholds if v004 is too fast or too slow.
- Add fit-aware tray generation only if repeated early unfair trays are observed.
- Consider clearer same-cell bonus feedback before changing its power.
- Revisit 7-8 colors only after the 6-color curve is stable.
