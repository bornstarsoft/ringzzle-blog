# Ringzzle Web v025 Blockzzle Nickname And Leaderboard Fix

Status: implemented.

## Blockzzle Reference Inspected

Read-only Blockzzle files inspected:

- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/static/play/js/blockzzle-phaser.v026.js`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/functions/api/leaderboard/index.js`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/functions/api/leaderboard/_shared.js`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/Docs/Blockzzle_Web_Anonymous_Leaderboard_Design.md`

## Blockzzle Nickname Pattern

Blockzzle does not keep a focused inline nickname input inside the game-over panel. It shows leaderboard status and submit actions in the canvas panel, then asks for a nickname with a browser prompt when the user explicitly submits a score.

This avoids the iPhone Safari problem where an inline input keeps focus and pushes the entire game-over panel into an awkward position.

## Blockzzle Game-Over Organization

Blockzzle keeps the game-over panel compact:

- clear Game Over title
- score and local stats
- anonymous leaderboard heading
- Today / All-Time tabs
- short leaderboard preview
- submit status
- explicit submit button
- Play Again button

Ringzzle v25 should follow this organization while keeping Ringzzle-specific score, best, today, games, line clear, and Color Burst metrics.

## Blockzzle Read API Pattern

Blockzzle dedupes leaderboard rows using a SQL `NOT EXISTS` query. The query selects the best score per normalized nickname, applies the same tie-break logic for Today and All-Time, excludes rejected rows, and never exposes browser player ids.

Ringzzle v24 performs much of this in JavaScript after fetching rows. v25 will align the Ringzzle read API with the Blockzzle SQL-dedupe pattern so Today and All-Time behave consistently.

## Ringzzle v24 Difference

Ringzzle v24 still uses a DOM inline nickname input in the game-over flow. That keeps iOS keyboard behavior tied to the panel and can push the panel upward on real iPhone Safari.

Ringzzle v24 also showed a live inconsistency where Today returned more entries than All-Time on the first day. Since all rows were submitted on the same day, the two scopes should produce the same deduped entries.

## v25 Changes

v25 implements:

- remove the inline nickname input as the primary submission method
- use a Blockzzle-style browser prompt for nickname entry
- store the confirmed nickname in `ringzzleLeaderboardNicknameV1`
- show the current nickname/status inside the game-over panel
- keep explicit user-triggered submit only
- keep Today / All-Time leaderboard controls inside the game-over flow
- update the read API to use consistent best-per-normalized-nickname dedupe for Today and All-Time

## Implementation Notes

Active v25 assets:

- `/play/css/ringzzle.v025.css`
- `/play/js/ringzzle-phaser.v025.js`

The game-over panel no longer creates the inline DOM nickname form. The panel displays the current nickname or a prompt hint, and `Submit Score` uses the stored nickname or opens a browser prompt when a nickname is missing. Tapping the nickname line opens the same prompt for editing.

The read API now follows the Blockzzle-style SQL `NOT EXISTS` dedupe pattern, then still applies the existing JavaScript public-entry safety pass before returning data.

## Unchanged

v25 does not change gameplay rules, scoring, color progression, tray generation, Color Burst rules, sound behavior, D1 schema, submit API contract, the standalone `/leaderboard/` page, or Cloudflare production settings.

No fake rankings, login, email, ads, analytics, IAP, or Daily Challenge are added.
