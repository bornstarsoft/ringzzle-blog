# Ringzzle Web v002 QA Polish Plan

Date: 2026-06-08

## Scope

v002 is a QA and polish stabilization pass for the playable Ringzzle Web MVP at `/play/`.

This phase should improve real-play feel, mobile Safari safety, visual clarity, and first-session confidence without expanding the product surface.

## v001 Inspection Summary

- Pure logic is separated behind `RingzzleCore` and is covered by Node tests.
- Placement, tray refill, line clears, same-cell bonus, scoring, game over, restart, and localStorage stats are implemented without backend dependencies.
- The Phaser scene uses the exported logic and publishes layout/game state markers that support browser smoke checks.
- The `/play/` shell uses versioned static CSS/JS assets.
- Mobile layout already uses `visualViewport`, safe-area CSS padding, portrait overlay, and relayout at `0ms`, `100ms`, `300ms`, and `600ms`.
- The bottom tray fits the target phone viewports, but v002 should keep extra bottom reserve for Safari toolbar variance.
- v001 drag behavior is functional; v002 can make valid/invalid feedback and return motion easier to read.
- v001 clear feedback works through cell flash and status text; v002 can add small score/clear cues without changing rules.

## v002 Implementation Plan

- Keep v001 files for rollback history.
- Create versioned v002 assets:
  - `static/play/css/ringzzle.v002.css`
  - `static/play/js/ringzzle-phaser.v002.js`
- Update `static/play/index.html` to reference v002 assets.
- Keep gameplay rules unchanged.
- Keep all storage keys unchanged.
- Add or update tests only where helper logic changes.

## Low-Risk Polish Targets

- Drag feel:
  - Keep ghost movement immediate.
  - Make valid and invalid board previews more legible.
  - Make invalid returns slightly slower and softer.
- Clear visibility:
  - Keep line/cell clear flash.
  - Add a short score pop cue after placement or clears.
  - Use clearer copy for line clear, combo clear, and cell bonus feedback.
- Game over/restart:
  - Improve the panel text layout so it reads cleanly on narrow phones.
  - Preserve the restart flow.
- Mobile safety:
  - Preserve visual viewport sizing and multi-pass relayout.
  - Increase bottom reserve in the layout helper while keeping the board playable at `390x844`, `393x852`, and `430x932`.

## Stop Conditions

Do not add:

- backend
- D1
- leaderboard
- login
- email capture
- ads
- analytics
- IAP
- Daily Challenge
- fake ranking
- mobile app CTA
- Cloudflare Functions

Do not change:

- `CNAME`
- Cloudflare Pages settings
- repo name
- existing blog content
- Blockzzle Web
- Unity projects

## Validation Plan

- `node tests/ringzzle_logic.test.cjs`
- `hugo --minify`
- `git diff --check`
- Confirm generated `/public/play/index.html` references v002 assets.
- Confirm no backend/functions/D1/leaderboard files were added.
- Confirm no `CNAME`, `config.toml`, or Cloudflare production settings changed.
- Browser smoke:
  - load `/play/`
  - place at least one ring
  - invalid drop returns
  - restart works
  - no console errors
- Mobile viewport checks:
  - `390x844`
  - `393x852`
  - `430x932`

## Recommended Next Phase

After v002, run real-device iPhone Safari playtesting for several short first-session runs. Prioritize tuning readability, early-game randomness, and clear/restart presentation before adding any new mode or backend feature.
