# Ringzzle Web v030 Live Site QA Search Readiness

## Scope

v030 is a live crawl-style QA and Search Console preparation pass after the v029 game-first site integration.

This pass does not change Ringzzle gameplay, scoring, color progression, tray generation, sound behavior, leaderboard API, D1 schema, Cloudflare settings, ads, analytics, login, email capture, IAP, Daily Challenge, or fake rankings.

## Live URLs Checked

The following live URLs returned HTTP 200:

- `https://ringzzle.com/`
- `https://ringzzle.com/play/`
- `https://ringzzle.com/leaderboard/`
- `https://ringzzle.com/how-to-play/`
- `https://ringzzle.com/privacy/`
- `https://ringzzle.com/terms/`
- `https://ringzzle.com/posts/`
- `https://ringzzle.com/sitemap.xml`

## Titles and Descriptions

Cache-busted live checks confirmed the v029 title and description output for the main Hugo pages:

- Home: `Ringzzle — Free Color Rings Puzzle Game Online`
- Leaderboard: `Ringzzle Leaderboard — Today and All-Time Scores`
- How to Play: `How to Play Ringzzle — Color Rings Puzzle Guide`
- Privacy: `Ringzzle Privacy`
- Terms: `Ringzzle Terms`
- Posts: `Ringzzle Tips and Puzzle Notes`

The standalone `/play/` page already had the correct title and description. v030 adds canonical, Open Graph, and Twitter summary metadata to `/play/` so the game entry page has the same search/social basics as the Hugo pages.

## Canonical and Social Metadata

The Hugo pages include:

- canonical URL
- meta description
- Open Graph title, description, type, URL, and site name
- Twitter summary card, title, and description

v030 adds the same basic metadata pattern to `static/play/index.html`:

- canonical: `https://ringzzle.com/play/`
- Open Graph title/description/type/URL/site name
- Twitter summary card/title/description

## Internal Links

The live pages include navigation and internal links for the main game flow:

- Home
- Play
- Leaderboard
- How to Play
- Tips / Posts
- Privacy
- Terms

The homepage, leaderboard page, how-to-play page, and posts page all expose links into the core play flow. The standalone `/play/` page remains game-first and uses in-game controls for Home, Rank, Restart, and Sound.

## Sitemap Status

`https://ringzzle.com/sitemap.xml` returns HTTP 200 and includes the important public pages:

- `https://ringzzle.com/`
- `https://ringzzle.com/play/`
- `https://ringzzle.com/how-to-play/`
- `https://ringzzle.com/leaderboard/`
- `https://ringzzle.com/privacy/`
- `https://ringzzle.com/terms/`

`robots.txt` points to `https://ringzzle.com/sitemap.xml`.

## Issues Found

1. Initial plain-URL browser checks showed some Cloudflare cached HTML without the v029 Open Graph and Twitter tags. Cache-busted checks using the v029 commit marker returned the expected v029 HTML, which indicates a cache/deployment freshness issue rather than a source issue.
2. `/play/` was missing canonical, Open Graph, and Twitter metadata because it is a standalone static HTML page outside the Hugo head partial.

## Fixes Made

v030 updates only `static/play/index.html` metadata:

- adds canonical URL
- adds Open Graph tags
- adds Twitter summary tags

No game JavaScript or CSS asset version was changed. `/play/` still references:

- `ringzzle.v028.css`
- `ringzzle-phaser.v028.js`

## Search Console Readiness

The sitemap structure is ready for Google Search Console submission after the v030 deployment is live and the plain, non-cache-busted public URLs serve the v030 HTML.

Recommended Search Console steps:

1. Deploy v030.
2. Recheck `https://ringzzle.com/` and `https://ringzzle.com/play/` without query parameters.
3. Confirm v030 metadata is visible on plain URLs.
4. Submit `https://ringzzle.com/sitemap.xml` in Google Search Console.

## Intentionally Not Changed

This pass does not change:

- gameplay rules
- scoring
- color progression
- tray generation
- sound behavior
- leaderboard API
- D1 schema
- backend functions
- Cloudflare production settings
- `CNAME`
- ads, analytics, login, email capture, IAP, Daily Challenge, or fake rankings
