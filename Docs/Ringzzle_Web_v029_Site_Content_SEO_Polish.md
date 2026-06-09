# Ringzzle Web v029 Site Content SEO Polish

## Current Ringzzle.com Site State

Ringzzle.com is now a game-first official site. The homepage leads with Ringzzle, the playable game lives at `/play/`, the anonymous leaderboard lives at `/leaderboard/`, and support pages exist for `/how-to-play/`, `/privacy/`, `/terms/`, and `/posts/`.

The active game remains v028. This pass does not change gameplay, scoring, color progression, sound, leaderboard API behavior, D1 schema, or Cloudflare production settings.

## Blockzzle Patterns Reused

Read-only Blockzzle reference files inspected:

- `blockzzle-web/layouts/index.html`
- `blockzzle-web/layouts/_default/baseof.html`
- `blockzzle-web/layouts/partials/head.html`
- `blockzzle-web/layouts/sitemap.xml`
- `blockzzle-web/layouts/leaderboard/single.html`
- `blockzzle-web/content/block-puzzle.md`

Useful patterns carried forward:

- concise game-first homepage copy
- obvious Play CTA and secondary leaderboard CTA
- lightweight game explanation page
- leaderboard copy that says real submitted scores only
- simple navigation and footer
- explicit static `/play/` entry in sitemap
- no login, email, ads, analytics, IAP, or fake rankings

## Pages Reviewed

- `/`
- `/play/`
- `/leaderboard/`
- `/how-to-play/`
- `/privacy/`
- `/terms/`
- `/posts/`
- existing `content/posts/` archive
- `layouts/partials/head.html`
- `layouts/sitemap.xml`
- `static/play/index.html`

## Content and Internal Linking Changes

Homepage copy was tightened around:

- “Free color rings puzzle game.”
- “No install. Just play.”
- color line clears
- Color Burst
- anonymous leaderboard

The How to Play page now has stronger Play and Leaderboard links while keeping the core rules clear: 3x3 board, small/medium/large rings, one ring per size per cell, color line clears, Color Burst, score/high score, and anonymous leaderboard.

The leaderboard page copy now emphasizes real submitted entries only, nickname-only anonymous submission, no login/email, and no fake rankings. It also keeps the Play CTA visible.

The inherited post archive remains intact. Two directly relevant browser-puzzle posts now include Ringzzle internal links:

- `content/posts/2025-06-26-puzzle-210417.md`
- `content/posts/2025-06-29-game-214329.md`

The `/posts/` index links to `/play/`, `/how-to-play/`, and `/leaderboard/`.

## SEO and Static Checks

The homepage keeps the SEO title:

`Ringzzle — Free Color Rings Puzzle Game Online`

The head partial now includes canonical, description, Open Graph, and Twitter summary metadata. The custom sitemap continues to include the static `/play/` route plus important content pages:

- `/`
- `/play/`
- `/how-to-play/`
- `/leaderboard/`
- `/privacy/`
- `/terms/`

Hugo’s generated robots output remains controlled by `enableRobotsTXT = true`.

## Intentionally Not Changed

This pass does not change:

- Ringzzle gameplay rules
- scoring
- color progression thresholds
- tray generation
- sound behavior
- `/play/` v028 game assets
- leaderboard API
- D1 schema or migrations
- backend functions
- CNAME
- Cloudflare Pages settings
- Blockzzle Web
- Unity projects

No ads, analytics, login, email capture, IAP, Daily Challenge, or fake rankings were added.
