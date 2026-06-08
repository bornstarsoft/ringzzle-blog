# Ringzzle Existing Blog Reuse Assessment

Date: 2026-06-08

## Scope

This assessment covers the existing `ringzzle-blog` repository as the official Ringzzle Web site repository candidate before any rebuild decision. It is documentation-only and does not change gameplay, Hugo config, Cloudflare Pages settings, domain settings, content, theme files, analytics, ads, backend, or leaderboard behavior.

Official working directory:

`/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/ringzzle-blog`

## Current Repo State

- Current branch: `main`
- Initial working tree state: clean
- Remote: `git@github.com:bornstarsoft/ringzzle-blog.git`
- Latest commits inspected:
  - `fcaae45 Document Ringzzle web repo reuse and MVP plan`
  - `4400952 Updated changes`
  - `72d7e03 Auto post 2025-12-17 19:10:55`

## Domain Connection Clues

The repository appears connected to the `ringzzle.com` production direction based on the user-confirmed Cloudflare Pages/GitHub connection and the local Hugo config. Do not disconnect GitHub, Cloudflare Pages, or `ringzzle.com` during the rebuild decision phase.

- `config.toml` sets `baseURL = "https://ringzzle.com/"`.
- `config.toml` sets the site title to `Ringzzle`.
- `README.md` describes the project as a Hugo static blog powered by Cloudflare Pages.
- The root `CNAME` file currently contains `www.bornstarai.com`, not `ringzzle.com`.
- No Cloudflare Pages project settings were changed or inspected externally in this phase.

Assessment: treat the existing production connection as the source of truth for now. The tracked `CNAME` conflict is a source-level risk to investigate later, not a reason to disconnect production settings today. Verify Cloudflare Pages custom-domain settings before changing `CNAME` or deployment configuration.

## Structure Observed

Root files:

- `config.toml`
- `CNAME`
- `README.md`
- `LICENSE.md`
- `gitignore`
- `content/`
- `Docs/`
- `themes/`

Hugo configuration:

- Uses Hugo with the `ananke` theme.
- `enableRobotsTXT = true`
- `buildFuture = false`
- `mainSections = ["posts"]`

Content structure:

- Existing content is under `content/posts/`.
- 138 tracked post files were present during this inspection.
- Posts are dated from 2025-05-27 through 2025-12-17.
- The content is a game and puzzle news/blog archive, not the Ringzzle Web game yet.

Layouts and theme:

- No root-level `layouts/` directory was present before this documentation phase.
- Layout behavior currently comes from `themes/ananke/`.
- The Ananke theme is vendored in the repo.

Static assets:

- No root-level `static/` directory was present before this documentation phase.
- No Ringzzle Web `/play/` assets exist yet.

Cloudflare Pages-related files:

- `README.md` mentions Cloudflare Pages.
- No root-level `wrangler.toml`, `wrangler.example.toml`, `functions/`, `migrations/`, `_headers`, or `_redirects` were present.
- The root `CNAME` exists but currently points to `www.bornstarai.com`.

Docs, scripts, and tests:

- A root-level `Docs/` directory now exists for Ringzzle Web planning.
- No root-level `scripts/` or `tests/` directory was present.
- No `package.json` was present in the site root.

## Blockzzle Web Comparison

Read-only reference inspected:

`/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web`

Blockzzle Web has already grown into a full web-game site structure:

- `static/play/index.html`
- Versioned assets such as `static/play/css/blockzzle.v026.css` and `static/play/js/blockzzle-phaser.v026.js`
- A testable JS core covered by `tests/blockzzle_logic.test.cjs`
- Mobile Safari viewport handling using `visualViewport`, fixed play-shell sizing, and safe-area CSS
- Orientation relayout delays at `0`, `100`, `300`, and `600` milliseconds
- A rotate-to-portrait overlay for cramped landscape phones
- LocalStorage repeat-play stats and sound preference handling
- Later-stage leaderboard/backend files under `functions/`, `migrations/`, and `wrangler.example.toml`

Ringzzle should reuse Blockzzle's static `/play/`, versioned asset, testable-core, and mobile-layout lessons. Ringzzle should not copy Blockzzle's backend, leaderboard, Daily mode, Unity build assets, or gameplay rules for v001.

## Reuse Decision

Yes. `ringzzle-blog` is clean enough to reuse as the official Ringzzle Web repo for now.

Reasons:

- It is the existing production-connected repository for Ringzzle work.
- Its Hugo static-site structure is compatible with a lightweight HTML5 `/play/` game.
- `config.toml` already points at `https://ringzzle.com/`.
- The repo is lean: Hugo config, content archive, docs, and vendored theme.
- It has no existing root-level app code, backend, D1, login, leaderboard, ads, analytics, IAP, or Daily Challenge implementation to unwind.
- Keeping this repo avoids creating or wiring a new GitHub repository before the site direction is stable.
- A static Phaser game can fit under Hugo `static/play/` without backend infrastructure.

Current cleanliness caveats:

- Existing blog posts are not Ringzzle Web product pages, so the homepage/content strategy must change later.
- The root `CNAME` mismatch must be investigated before production deployment edits.
- The vendored Ananke theme is acceptable for preservation, but v001 may need root-level layout overrides for a proper game homepage.

## Repo Name Decision

Keep the repository name as `ringzzle-blog` for now.

Reasons:

- The remote already points to `bornstarsoft/ringzzle-blog.git`.
- Renaming the repository could affect Cloudflare Pages Git integration, deployment history, and any production webhooks.
- The project can use `Ringzzle Web` in docs, copy, titles, and user-facing content without renaming the GitHub repository yet.

Recommended later action: consider a repository rename to `ringzzle-web` only after v001 is deployed, verified on production, and Cloudflare Pages settings are documented. A later rename is reasonable for clarity, but it should be treated as an infrastructure change with rollback notes, not part of this assessment phase.

## New Repo Decision

Do not create a clean new repo now.

The current repo is clean enough to evolve in place, and the risks of breaking the existing GitHub/Cloudflare Pages/ringzzle.com connection outweigh the benefits of starting fresh today.

A clean new repo could become reasonable later only if one of these conditions appears:

- Cloudflare Pages can be reconnected with a documented, tested rollback path.
- The existing repo accumulates unrelated generated files, broken theme history, or content that blocks clean Ringzzle Web development.
- A separate deployment preview proves the new repo can serve the same domain behavior without SEO, DNS, TLS, or build-setting surprises.
- All production settings, branch settings, build commands, environment variables, custom domains, and rollback steps are documented first.

If a new repo is ever recommended, preserve these before switching:

- The existing `ringzzle-blog` Git history.
- The production Cloudflare Pages project settings and custom-domain mapping.
- The current GitHub remote/integration details.
- `config.toml`, `CNAME`, `README.md`, `LICENSE.md`, `gitignore`, and all `Docs/`.
- The full `content/posts/` archive.
- Any DNS, TLS, Pages branch, build-command, and publish-directory settings.
- A rollback plan that can restore the old repo connection quickly.

## Disconnection Risks

Disconnecting GitHub, Cloudflare Pages, or `ringzzle.com` now is high-risk and unnecessary.

Risks include:

- Production downtime or serving stale content at `ringzzle.com`.
- Broken Cloudflare Pages Git deployment hooks.
- Lost or undocumented build settings, branch settings, environment variables, or publish-directory configuration.
- DNS/custom-domain and TLS certificate disruption.
- Loss of easy rollback to the currently connected repo.
- Search-index and canonical URL instability during the Ringzzle Web transition.
- Confusion between the official repo and the abandoned `ringzzle-web` folder.

## Temporary Folder Decision

Treat `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/ringzzle-web` as abandoned/reference only.

The optional `ringzzle-web/Docs` folder was not present during this inspection. If the temporary folder still exists elsewhere, archive or delete it later only after confirming there are no unique planning notes or assets that need to be preserved. Do not use it as the official repo.

## Preserve

Preserve these existing files and content:

- The full `content/posts/` archive.
- `config.toml`, while documenting the later need to update site copy and routing.
- `README.md`, with a later update from `Ringzzle Blog` to `Ringzzle Web`.
- `LICENSE.md`.
- The vendored Ananke theme until a deliberate site design pass replaces or overrides it.
- Git history and the existing `origin` remote.
- The current `CNAME` file until Cloudflare Pages domain settings are checked.

## Changes Needed Before v001 MVP

Before implementing v001, the repo needs:

- A product-facing homepage for Ringzzle Web using:
  - `Ringzzle`
  - `Free color rings puzzle game.`
  - `No install. Just play.`
  - SEO title: `Ringzzle — Free Color Rings Puzzle Game Online`
  - Description: `Place colorful rings, clear lines, complete cells, and chase your best score.`
- A static `/play/` route, likely under `static/play/`.
- Versioned game assets, for example `ringzzle-phaser.v001.js` and `ringzzle.v001.css`.
- A small JS logic core exported for tests.
- Unit tests for placement, line clears, same-cell bonus behavior, scoring, high score, tray refill, and game over.
- Mobile-first layout verification on 390x844, 393x852, and 430x932 viewports.
- A domain/settings check for the `CNAME` mismatch.
- A README update that clearly names the project `Ringzzle Web` while the repo remains `ringzzle-blog`.

## Recommended Next Phase

Recommended next phase: implement the v001 static game foundation in `ringzzle-blog` without backend features.

First implementation slice:

- Add tests for the Ringzzle logic model.
- Add `static/play/index.html`.
- Add versioned CSS and Phaser JS.
- Add localStorage high score only.
- Verify mobile portrait layout before adding any leaderboard, Daily mode, ads, analytics, or production Cloudflare setting changes.
