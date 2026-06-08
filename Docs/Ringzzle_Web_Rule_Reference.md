# Ringzzle Web Rule Reference

Date: 2026-06-08

## Source Scope

Read-only Unity gameplay-rule reference:

`/Users/seongjinkim/dev_assets/9998 Puzzle Kit - Mobile Game Template/Assets/PuzzleGame`

Files inspected:

- `Scripts/Gameplay/Rings/GameControllerRings.cs`
- `Scripts/Gameplay/Rings/GameStateRings.cs`
- `Scripts/Gameplay/Rings/NextRingController.cs`
- `Scripts/Gameplay/Rings/Probabilities.cs`
- `Scripts/Gameplay/Rings/Ring.cs`
- `Scripts/Gameplay/Rings/RingsController.cs`
- `Prefabs/GameControllers/Rings.prefab`

This document extracts gameplay behavior only. Do not copy Unity C# directly into JavaScript.

## Unity Template Rules Extracted

### Board

- The Rings prefab sets `bricksCount` to `{x: 3, y: 3}`.
- The gameplay board is a 3x3 grid of `RingsController` cells.

### Ring Sizes

- Each cell has three ring slots.
- Unity source order is `bigRing`, `middleRing`, `smallRing`.
- `ringStates` stores those three slots as integers.
- Empty is represented by `-1`.
- Web naming should use `large`, `medium`, `small`.

### Ring Colors

- Colors are stored as integer color indexes into the active Unity theme.
- The Rings prefab sets:
  - `startColorsCount: 3`
  - `colorsCount: 8`
  - `colorsProbabilities: [100, 100, 100, 90, 80, 70, 60, 50]`
- Color count increases with score using `scoresForUpgrade`.
- The serialized thresholds decode to `25`, `50`, `150`, `250`, and `500`.
- The C# files do not define fixed color names; visual colors come from theme data.

### Next Ring / Tray

- Unity has one active `NextRingController`, not a 3-piece tray.
- The next piece can contain one or two rings.
- `maxRingsToSpawn` is `2`.
- The generated piece uses free ring-size slots sampled from an existing board cell pattern, which helps ensure the next piece can fit somewhere.
- Colors are selected from the current color pool by weighted probability.
- Colors are removed from the temporary generation pool after selection, so one generated piece should not duplicate the same color in multiple slots.

### Placement

- A next piece is dragged and dropped onto the 3x3 board.
- Placement is rejected if the drop is outside the board.
- Placement is rejected if the target cell already has a ring in any size slot occupied by the next piece.
- Different ring sizes can coexist in the same cell.
- The same ring size cannot be overwritten.
- On a valid placement, the piece's occupied slots merge into the target cell.

### Line Clears

- After placement, Unity checks:
  - 3 vertical lines
  - 3 horizontal lines
  - 2 diagonals
- For each line, Unity checks colors present in the first cell of that line.
- A color clears if every cell in the line contains that color in any ring size.
- Unity's line rule is color-based across the line, not size-specific.
- When a color line clears, Unity clears that color from each cell in the line.
- Multiple colors and multiple lines can clear from one placement.

Important v003 correction: Ringzzle Web v001/v002 incorrectly used same color plus same size for line clears. The correct Ringzzle / Color Rings rule is color-only across the line. Ring size affects placement occupancy only; it must not be part of the line-match requirement.

### Same-Cell Full Color Behavior

- After merging into a cell, Unity checks whether all three ring slots are occupied.
- If all three occupied slots have the same color, the cell invokes `MergeColor`.
- `GameControllerRings.OnColorMerge` then finds every board cell containing that color and clears that color from those cells.
- This is a global color clear, not only a local cell clear.
- No direct score increment was observed for this behavior in the inspected files.
- Unity plays merge feedback and may award a coin through the shared coin-chance flow.

Important web decision: Ringzzle Web may include a same-cell full-color bonus, but it should not automatically inherit the Unity global color clear unless that stronger behavior is explicitly selected after playtesting.

### Scoring

- Unity starts score at `0`.
- No placement score was observed in the Rings controller.
- Score is updated by `CountScore` when line clears happen.
- For each detected line and color, Unity counts matching rings in that line and clears them.
- Score increment is `ringsCount * lines.Count`.
- Because `lines.Count` is a multiplier, simultaneous detected lines can increase the value of cleared rings.
- Same-cell full-color global clears do not appear to add score directly in the inspected files.

Important web decision: Ringzzle Web should use a clearer browser-friendly scoring model with visible placement, line clear, combo, and optional same-cell bonus points.

### Game Over

- Unity game over checks whether every cell is full.
- It does not directly check whether the current next piece can fit.
- The generation flow tries to create next pieces from available free slot patterns, which reduces the chance of an unplaceable next piece before the board is full.

Important web decision: Ringzzle Web should use the user-specified web rule: game over when no remaining tray ring can fit anywhere.

### Refill / Generation

- Unity spawns a new next piece after a valid placement.
- If no line clears, the next piece is spawned immediately.
- If lines clear, the next piece is spawned after line clear feedback.
- Current color count updates after score changes.
- The web v001 plan should use 3 tray pieces and refill only after all 3 are used.

## Ringzzle Web Current Rule Decisions

Use these rules for Ringzzle Web after the v003 core-rule correction:

- 3x3 board.
- 3 tray pieces.
- One ring per tray piece.
- Ring sizes: small, medium, large.
- 6-color palette cap in the current web build.
- Available color count starts at 3 and increases by score progression.
- One ring per size per cell.
- Different sizes can coexist in one cell.
- Same-color line clear across row, column, or diagonal.
- Ring size is not part of line matching.
- When a color line clears, remove matching-color rings in that line regardless of ring size.
- Preserve nonmatching-color rings in the same involved cells.
- Optional same-cell full-color bonus when small, medium, and large in one cell are the same color.
- Score and high score.
- High score saved in localStorage.
- Restart.
- Game over when no tray ring can fit.
- Refill tray after all 3 tray pieces are used.

## Open Tuning Notes

- The same-cell full-color bonus is currently local-only in web; decide later whether to test the stronger Unity-style global color clear.
- Tune web color progression thresholds after playtesting. The Unity template thresholds are `25`, `50`, `150`, `250`, and `500`, but web v003 uses a wider score scale for its placement and clear scoring.
- Keep Unity template behavior as a rules reference, not a direct code source.
