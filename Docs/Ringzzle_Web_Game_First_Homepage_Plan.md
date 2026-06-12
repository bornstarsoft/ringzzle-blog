# Ringzzle Web Game First Homepage Plan

## What Changed

The Ringzzle homepage is now game-first. Instead of a marketing hero and board preview above the fold, the homepage embeds the existing playable Ringzzle Classic game near the top of the page.

The standalone `/play/` route remains available and continues to use the current v028 game assets:

- `static/play/css/ringzzle.v028.css`
- `static/play/js/ringzzle-phaser.v028.js`

The homepage reuses `/play/` through an iframe embed. This avoids duplicating gameplay logic on the homepage.

## Homepage Game-First Decision

The homepage should let visitors start playing immediately, similar to Sudoku.com-style game-first entry pages.

Mobile behavior:

- compact site header
- playable Ringzzle Classic game appears near the top
- app download card appears below the game
- SEO/help content appears below the game-first area

Desktop behavior:

- two-column first view where space allows
- main column contains the playable game
- side column contains the app download card
- supporting SEO/help content appears below

## `/play/` Preservation

`/play/` remains the full standalone game route.

The homepage iframe points to `/play/?embed=home`. The query parameter is only a marker for the embed context; the current game does not change gameplay rules, scoring, color progression, leaderboard behavior, sound behavior, or tray generation.

The game Home button now navigates the top-level page when the game is embedded, preventing the homepage from loading inside the iframe.

## App Download Behavior

App download information is configured in:

`data/ringzzle_app.toml`

Current values:

- Android app URL: not configured
- iOS app URL: not configured
- QR target URL: `https://ringzzle.com/play/`

Because real app store URLs are not known, the Google Play and App Store controls are shown as disabled `Coming soon` items. No fake app store links, fake ratings, fake reviews, fake downloads, or fake popularity claims are used.

Platform detection is handled by:

`static/js/home.v001.js`

The script lightly detects Android or iOS user agents and orders the matching app store item first. It does not collect data, send analytics, or affect gameplay.

## QR Handling

No generated QR image is included in this pass.

The app card includes a documented QR area and mobile web target. Until a real app URL or generated QR asset is provided, the target is `https://ringzzle.com/play/`.

## SEO Content

The homepage still includes factual SEO/support copy below the game-first section:

- what Ringzzle is
- how to play
- color line clears
- Color Burst
- no-install browser play
- anonymous leaderboard
- links to `/play/`, `/leaderboard/`, `/how-to-play/`, and `/posts/`

## What Was Not Changed

This pass does not change:

- Ringzzle gameplay rules
- scoring
- color progression
- tray generation
- leaderboard API
- D1 schema
- moderation behavior
- nickname logic
- backend functions
- sound policy
- `/leaderboard/`
- `/how-to-play/`
- `/privacy/`
- `/terms/`
- sitemap behavior
- Unity Ringzzle_v1
- Blockzzle
- Puzzlepia
- HotGames
- NewGames

No ads, analytics, login, email capture, IAP, Daily Challenge, coins, boosters, Continue, Undo, Reroll, fake rankings, or fake app store claims were added.

## Manual Smoke Checklist

After deployment, check:

- homepage loads with playable Ringzzle visible immediately
- homepage game accepts a drag/place move
- homepage Sound, Restart, Rank, and Home controls still work
- `/play/` still loads standalone
- `/leaderboard/` still loads
- `/how-to-play/` still loads
- mobile layout shows game first and app card below
- desktop layout shows game and app card side by side
- disabled app store items clearly read `Coming soon`
- no generated `public/` files are committed
