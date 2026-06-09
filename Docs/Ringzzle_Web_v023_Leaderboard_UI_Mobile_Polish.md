# Ringzzle Web v023 Leaderboard UI Mobile Polish

Status: implemented.

## Context

v22 added explicit game-over score submission and the live D1 submit flow works. Real iPhone Safari testing found UI/UX issues:

- `View Leaderboard` and `Restart` could overlap on the game-over overlay.
- Today / All-Time leaderboard controls were not visible from the game-over leaderboard flow.
- iOS keyboard focus could push the nickname panel into an awkward position.
- There was no in-game leaderboard/rank button during play.

## Blockzzle Reference

Blockzzle Web was inspected as read-only reference. The useful patterns were:

- a small Rank / leaderboard button placed near the Restart control during play
- compact Today and All-Time controls
- anonymous leaderboard copy
- keeping leaderboard viewing separate from normal gameplay state

Ringzzle v23 follows those patterns without copying Blockzzle gameplay or assets.

## v23 Changes

- Adds a small `Rank` button during play, positioned under Restart and linking to `/leaderboard/`.
- Repositions the game-over submit DOM panel so `Submit Score`, Today / All-Time links, `View leaderboard`, and `Restart` do not overlap on mobile.
- Adds Today and All-Time links in the game-over submit flow:
  - `/leaderboard/?scope=today`
  - `/leaderboard/?scope=alltime`
- Updates the leaderboard page script to honor the `scope` query parameter.
- Adds visualViewport-aware nickname focus handling so the submit panel stays above the iOS keyboard as much as practical.
- Keeps the submit button explicit and user-triggered.

## Non-Goals

v23 does not change:

- gameplay rules
- scoring
- color progression
- tray generation
- sound policy
- submit API schema
- D1 schema
- backend behavior
- login, email, ads, analytics, IAP, Daily Challenge, or fake rankings

## Real Device Note

Automated desktop viewport checks can verify bounds and overflow, but final keyboard behavior still needs real iPhone Safari validation because iOS keyboard behavior is controlled by browser chrome and cannot be fully simulated in desktop automation.
