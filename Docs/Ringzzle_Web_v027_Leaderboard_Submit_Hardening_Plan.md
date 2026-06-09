# Ringzzle Web v027 Leaderboard Submit Hardening Plan

Status: implemented.

## Reality Check

Ringzzle is a browser HTML5 game, so score submission cannot be made perfectly cheat-proof. A determined user can tamper with client-side state, browser storage, and requests.

v27 adds practical MVP guardrails inspired by Blockzzle:

- server-side validation
- sane score and metric bounds
- request size guard
- same-browser cooldown guard
- duplicate submit guard in the game-over UI
- moderation fields preserved
- rejected rows excluded from public leaderboard

## Blockzzle Reference

Read-only Blockzzle files inspected:

- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/static/play/js/blockzzle-phaser.v026.js`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/functions/api/leaderboard/submit.js`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/functions/api/leaderboard/index.js`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/functions/api/leaderboard/_shared.js`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/Docs/Blockzzle_Web_Anonymous_Leaderboard_Design.md`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/Docs/Blockzzle_Web_Leaderboard_Moderation_Plan.md`

## v27 Implementation

v27 improves score update UX and hardens submit API behavior:

- Explicit user-triggered submit remains required.
- New local Today best keeps the yellow Submit Score CTA.
- Lower scores can still be submitted, but the UI does not imply rank changed.
- The same game-over screen cannot submit twice.
- Future games can submit again.
- The submit API rejects oversized JSON, impossible score values, invalid metric bounds, invalid client versions, and too-fast repeated submissions from the same browser player id.

## Implementation Notes

- Active play assets are `/play/css/ringzzle.v027.css` and `/play/js/ringzzle-phaser.v027.js`.
- The submit API keeps the existing table and moderation fields.
- A same-browser cooldown is checked with `browser_player_id` and recent `created_at`.
- The score cap is tightened to `999999`.
- `clientVersion` must match the lightweight `v###` client version format.
- Oversized JSON requests are rejected before validation.

## Privacy And Moderation

v27 does not add login, email, analytics, ads, IAP, Daily Challenge, fake rankings, or public player ids.

The existing moderation columns remain in place:

- `rejected`
- `reject_reason`
- `moderation_note`

Public leaderboard reads continue to filter `rejected = 0` and do not expose browser player ids or moderation fields.

## Unchanged

No gameplay rules, scoring rules, color progression thresholds, tray generation, sound behavior, D1 schema, CNAME, config, or Cloudflare production settings are changed.
