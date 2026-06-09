# Ringzzle Web v024 Blockzzle Leaderboard UI Adoption

Status: implemented.

## Blockzzle Files And Patterns Inspected

Read-only Blockzzle reference inspected:

- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/static/play/js/blockzzle-phaser.v026.js`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/Docs/Blockzzle_Web_Anonymous_Leaderboard_Design.md`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/static/js/leaderboard.v001.js`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/layouts/leaderboard/single.html`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/functions/api/leaderboard/`

## Blockzzle Rank Button Pattern

Blockzzle keeps a small leaderboard/Rank button near the Restart control during play. Tapping it does not navigate away from the game. It opens an in-game leaderboard overlay and preserves the current play state.

## Blockzzle In-Game Leaderboard Popup

Blockzzle renders a Phaser overlay with:

- dark scrim
- centered leaderboard panel
- Today and All-Time tabs
- real leaderboard entries loaded from `/api/leaderboard`
- graceful empty/unavailable text
- Close button

The overlay is separate from the normal play HUD and can be closed without changing the game.

## Blockzzle Game-Over Leaderboard Flow

Blockzzle game over keeps leaderboard content inside the game-over panel:

- leaderboard heading
- Today / All-Time controls
- short list preview
- submit status
- play again/restart action

This avoids forcing the player to leave `/play/` just to inspect ranking context.

## Blockzzle Keyboard / Nickname Behavior

Current Blockzzle uses a browser prompt for nickname entry, which delegates keyboard handling to the browser rather than pushing an in-canvas form around. Ringzzle already has a DOM nickname input from v22, so v24 keeps the Ringzzle input but moves leaderboard browsing controls out of the DOM submit panel and into Phaser panels. This reduces the amount of UI that can be pushed by the iOS keyboard.

## Ringzzle v24 Adaptation

Ringzzle v24 adapts the proven Blockzzle flow:

- Rank opens an in-game leaderboard modal instead of navigating to `/leaderboard/`.
- Game Over shows Today / All-Time controls and leaderboard preview inside the game-over panel.
- The DOM nickname form is reduced to nickname, submit, privacy, and status only.
- Submit remains explicit and user-triggered.
- Submit success refreshes the in-game leaderboard data.
- The standalone `/leaderboard/` page remains for site navigation, but it is no longer the primary in-game flow.

## Ringzzle-Specific Details Preserved

v24 does not change:

- color-only line clears
- Color Burst
- scoring
- score-based color progression
- tray generation
- sound behavior
- anonymous browser player id
- D1 schema
- submit/read API contracts
- standalone `/leaderboard/` page

No login, email, ads, analytics, IAP, Daily Challenge, fake rankings, or Cloudflare setting changes are included.
