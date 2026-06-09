# Ringzzle Web v026 Leaderboard Live Polish And Today Fix

Status: implemented.

## Live Feedback

v25 is mostly improved on real iPhone Safari, but the live leaderboard/game-over flow still needs small polish:

- new Today best should highlight the Submit Score button in yellow like Blockzzle
- Submit Score must always prompt for nickname first when no valid nickname exists
- nickname display in the game-over leaderboard panel should be easier to read
- Today and All-Time can drift after submit, with Today showing an older same-day score

## Blockzzle Patterns Used

Read-only Blockzzle reference:

- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/static/play/js/blockzzle-phaser.v026.js`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/functions/api/leaderboard/index.js`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/functions/api/leaderboard/_shared.js`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/Docs/Blockzzle_Web_Anonymous_Leaderboard_Design.md`

Blockzzle highlights the submit CTA when final score is greater than the previous local Today best. It also uses a prompt for nickname entry rather than an inline focused input.

## v26 Implementation

v26:

- preserve v25 prompt-based nickname flow
- guarantee missing or invalid nickname opens the prompt before submit
- show a helpful status if the prompt is cancelled
- highlight Submit Score in yellow for a new local Today best
- make the nickname line larger and brighter
- harden leaderboard refresh by invalidating Today and All-Time after submit
- use cache-busted no-store reads for leaderboard API requests
- ignore stale leaderboard responses that return after a newer request

## Today / All-Time Fix Finding

The Today/All-Time issue was addressed as client-cache/stale-response hardening. The API already uses the same server-side UTC day key convention for submit and read, and v25 already moved read dedupe to a best-row-per-normalized-nickname SQL pattern.

v26 keeps the D1 schema unchanged and adds:

- cache-busted leaderboard GET URLs
- `cache: "no-store"` on leaderboard fetches
- request ids so stale responses cannot overwrite newer scope data
- post-submit invalidation for both Today and All-Time
- post-submit refresh of the visible scope plus background refresh of the other scope

## Unchanged

No gameplay rules, scoring, color progression, tray generation, sound behavior, D1 schema, submit API contract, fake rankings, login, email, ads, analytics, IAP, Daily Challenge, CNAME, config, or Cloudflare settings are changed.
