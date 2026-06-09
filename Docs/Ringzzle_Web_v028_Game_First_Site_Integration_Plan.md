# Ringzzle Web v028 Game-First Site Integration Plan

## Current Ringzzle.com State

Ringzzle.com is connected to the existing `ringzzle-blog` Hugo repo through Cloudflare Pages. The playable game is stable at `/play/` with v027 assets, and the leaderboard read/submit APIs are already implemented. The public site still mostly behaves like an inherited blog archive: many generic puzzle posts remain under `content/posts/`, while the homepage and navigation are not yet focused on the Ringzzle game.

## Blockzzle Reference Structure

Blockzzle Web uses a game-first structure:

- custom homepage with a direct Play call to action
- simple top navigation and footer links
- static `/play/` game page
- `/leaderboard/` page for real submitted scores
- lightweight supporting content pages such as privacy, terms, contact, and game explanation
- custom sitemap that includes static `/play/`
- in-game Home control inside the Phaser UI

Reference files inspected include:

- `blockzzle-web/config.toml`
- `blockzzle-web/layouts/index.html`
- `blockzzle-web/layouts/_default/baseof.html`
- `blockzzle-web/layouts/_default/single.html`
- `blockzzle-web/layouts/partials/head.html`
- `blockzzle-web/layouts/sitemap.xml`
- `blockzzle-web/static/play/index.html`
- `blockzzle-web/static/play/js/blockzzle-phaser.v026.js`
- `blockzzle-web/content/block-puzzle.md`

## Recommended Ringzzle.com Structure

Ringzzle.com should become a game-first official Ringzzle Web site:

- Home: game-first landing page with core copy and primary play CTA
- Play: static Phaser game at `/play/`
- Leaderboard: real submitted Today and All-Time entries at `/leaderboard/`
- How to Play: concise rules and scoring support at `/how-to-play/`
- Tips / Blog: preserved existing article archive under `/posts/`
- Privacy / Terms: minimal web-game policy pages

## Existing Content Preservation

Existing `content/posts/` files should be preserved. Many are generic puzzle/news-style posts rather than Ringzzle-specific product pages, so v028 keeps the archive available and adds Ringzzle-focused entry points instead of deleting or rewriting the archive in bulk.

The existing leaderboard content is preserved and remains linked from the homepage and navigation.

## Pages Converted or Added

v028 should add or improve:

- a Ringzzle-specific homepage layout
- `/how-to-play/`
- `/privacy/`
- `/terms/`
- `/posts/` section intro with links to play and how-to content
- a custom sitemap that includes static `/play/`

## Proposed Navigation

Top navigation:

- Home
- Play
- Leaderboard
- How to Play
- Tips / Blog

Footer navigation:

- Privacy
- Terms

The in-game UI should include a Home button that navigates to `/`, positioned near the top controls without overlapping Sound, Restart, Rank, title, board, or tray.

## No Ads or Account Systems

This phase does not add ads, analytics, login, email capture, IAP, Daily Challenge, fake rankings, backend schema changes, or leaderboard API changes. Ringzzle remains focused on free browser play.
