# Ringzzle Web Blockzzle Reused Lessons

Date: 2026-06-08

## Source Scope

Read-only architecture reference:

`/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web`

Relevant files inspected:

- `static/play/index.html`
- `static/play/css/blockzzle.v026.css`
- `static/play/js/blockzzle-phaser.v026.js`
- `tests/blockzzle_logic.test.cjs`
- `Docs/Blockzzle_Web_Anonymous_Leaderboard_Design.md`
- `Docs/Blockzzle_Web_Leaderboard_Implementation_Notes.md`

This document records lessons only. Do not modify Blockzzle Web and do not copy Blockzzle gameplay into Ringzzle.

## `/play/` Structure

Blockzzle serves the game as a static Hugo asset route:

- `static/play/index.html`
- `static/play/css/blockzzle.v026.css`
- `static/play/js/blockzzle-phaser.v026.js`

The page loads Phaser from a pinned CDN URL and then loads a versioned game script. Ringzzle Web should use the same static `/play/` shape for v001, with Ringzzle-specific names such as:

- `static/play/index.html`
- `static/play/css/ringzzle.v001.css`
- `static/play/js/ringzzle-phaser.v001.js`

## Versioned Asset Pattern

Blockzzle keeps versioned CSS and JS files in `static/play/`. The active `index.html` points to the current version.

Ringzzle should use explicit versions from the first implementation. This makes rollback simple: point `/play/index.html` back to a previous asset version if a mobile regression ships.

## Mobile Safari Layout First

Blockzzle treats mobile browser viewport behavior as core architecture, not late polish.

Reusable Ringzzle lessons:

- Use `visualViewport.height` and `visualViewport.width` where available.
- Sync measured viewport size into CSS variables.
- Use `env(safe-area-inset-bottom)` and other safe-area insets in the play shell.
- Keep `html`, `body`, and the play shell fixed to the measured viewport.
- Prevent page scroll and overscroll in the game surface.
- Keep the bottom tray clear of the Safari toolbar.
- Validate 390x844, 393x852, and 430x932 as target phone sizes.

## Orientation Recovery

Blockzzle uses delayed multi-pass relayout after viewport and orientation changes:

- 0ms
- 100ms
- 300ms
- 600ms

Ringzzle should reuse this pattern because mobile Safari often reports viewport changes in stages after toolbar, rotation, or page lifecycle events.

## Rotate-To-Portrait Overlay

Blockzzle shows a rotate-to-portrait prompt for cramped mobile landscape viewports.

Ringzzle should use the same policy:

- Portrait is the supported mobile play orientation.
- Landscape on narrow phones should show a blocking overlay.
- The overlay should be removed automatically after returning to portrait.
- Active drags should be cancelled during relayout.

## Tray And Drag Handling

Blockzzle lessons for Ringzzle:

- The bottom tray must never be hidden by the Safari toolbar.
- Tray slots need stable dimensions so layout does not jump.
- Drag ghost should follow the pointer immediately.
- Drag ghost should reflect the board-scale object, not the tiny tray drawing.
- Drop preview should show valid and invalid states clearly.
- Invalid drops should animate back to the tray.
- Relayout should cancel active drag state cleanly.

## Sound Policy

Blockzzle's sound policy should carry over:

- Sound Off by default.
- User-triggered WebAudio only.
- A saved preference must not be treated as an unlocked audio context on page load.
- Sound unlock should be attempted from direct gestures.
- WebAudio errors must never block gameplay.
- Sound cues should be subtle and asset-free for v001.

## localStorage Stats

Blockzzle stores local repeat-play stats and high score in localStorage, but gameplay does not depend on storage being available.

Ringzzle v001 should start smaller:

- Save high score locally.
- Optionally save sound preference only after user activation.
- Do not add daily stats, nickname, anonymous player id, or leaderboard data in v001.

## Testing Style

Blockzzle exports a JS core object and tests deterministic logic with Node:

- board size
- tray size
- placement validation
- drag math helpers
- orientation relayout delays
- sound preference behavior
- local stats
- game over

Ringzzle should follow this pattern with a `RingzzleCore` export and tests for:

- 3x3 board
- cell size-slot occupancy
- 3-piece tray refill
- line clears by color plus size
- same-cell bonus behavior
- scoring
- local high score
- game over when no tray ring can fit

## Docs Style

Blockzzle docs are useful because they are scoped, dated, direct, and explicit about what is not production-ready.

Ringzzle docs should keep that style:

- State the date and scope.
- List files affected or proposed.
- Separate MVP, later, and stop conditions.
- Avoid fake ranking or future-feature claims.
- Keep deployment settings separate from source-code changes.

## Deferred Features

Do not reuse Blockzzle's leaderboard/backend pieces in Ringzzle v001.

Defer:

- Daily mode.
- Leaderboard.
- D1.
- Pages Functions.
- Nicknames.
- Anonymous browser player id.
- Score submission.
- Moderation tools.
- Ads, analytics, IAP, login, email, or mobile app CTA.

Leaderboard should wait until gameplay and mobile stability are proven. Daily mode should wait until Classic mode is stable and should be introduced as a separate mode or route, not an in-game toggle that can reset an active game.

## What Not To Reuse Directly

- Do not copy Blockzzle block shapes or gameplay rules.
- Do not copy Blockzzle leaderboard code.
- Do not copy Blockzzle Unity build assets.
- Do not introduce Cloudflare D1 or Pages Functions for Ringzzle v001.
- Do not claim public rankings without real backend data.

## Ringzzle v001 Architecture Recommendation

Use Blockzzle's static-game architecture, mobile viewport discipline, versioned assets, optional sound policy, localStorage resilience, and testable JS core.

Keep Ringzzle's gameplay rules separate and simpler:

- 3x3 color rings.
- 3 tray pieces.
- One ring per tray piece.
- Local high score only.
- No backend until after the playable MVP is stable on mobile Safari.
