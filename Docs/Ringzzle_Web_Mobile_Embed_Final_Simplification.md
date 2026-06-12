# Ringzzle Web Mobile Embed Final Simplification

## Real iPhone Safari Issue

After the first embed cleanup pass, real iPhone Safari still showed duplicated standalone game UI inside the homepage iframe:

- `Ringzzle` title.
- `Free color rings puzzle game...` subtitle.
- `Home` button.
- `Rank` button.

The homepage already provides the public Ringzzle context, navigation, and leaderboard access, so these duplicated in-game controls made the mobile game-first page feel crowded.

## Root Cause Found

The v029 code hid the Phaser title/subtitle/Home/Rank in `embed=home`, but the homepage iframe URL stayed unchanged as `/play/?embed=home`. On real Safari and through CDN/browser caching, that unchanged embedded page URL could keep serving older play HTML or older active asset references.

v030 fixes this by cache-busting both layers:

- `/play/` now references `ringzzle.v030.css` and `ringzzle-phaser.v030.js`.
- The homepage iframe now loads `/play/?embed=home&v=030`.

v030 also hardens the Phaser side by using blank labels for title/subtitle/Home/Rank in homepage embed mode, not only toggling visibility after creation.

## v030 Embed-Mode Hidden Controls

In `/play/?embed=home&v=030`:

- In-game `Ringzzle` title is not rendered.
- In-game subtitle/description is not rendered.
- In-game `Home` button is not rendered.
- In-game `Rank` button is not rendered.
- `Sound` remains visible.
- `Restart` remains visible.
- Score, best, today, board, tray, drag/drop, and game rules are unchanged.

## Standalone `/play/` Preservation

Standalone `/play/` remains the direct game route and keeps the full controls:

- title
- subtitle
- Home
- Rank
- Sound
- Restart

The direct route remains available for direct sessions, canonical/sitemap use, and debugging.

## Mobile Nav Simplification

On mobile, visible site navigation hides `Home` and `Play`. The Ringzzle brand/logo still links to `/`, and the visible mobile nav focuses on:

- Leaderboard
- How to Play
- Tips

Desktop navigation can retain the fuller link set.

## Public Play CTA Routing

Public and marketing Play links route to `/#play`, the homepage game-first play area. This includes site navigation, page CTAs, leaderboard CTA, How to Play links, Tips links, Privacy/Terms play links, and the app card mobile web target.

`/play/` remains reserved for:

- iframe source with embed mode
- standalone direct route
- canonical/sitemap direct game references
- developer/debug/direct play use

## Manual Smoke Checklist

- Homepage embed no longer shows Ringzzle title.
- Homepage embed no longer shows subtitle.
- Homepage embed no longer shows Home.
- Homepage embed no longer shows Rank.
- Sound and Restart remain visible.
- Board/tray remain visible.
- Ring drag/drop works.
- Mobile nav has no Home/Play clutter.
- Public Play CTAs route to `/#play`.
- Standalone `/play/` still has full controls.
- `/leaderboard/` still works.
