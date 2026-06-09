# Ringzzle Web v008 iPhone Safari Layout Hotfix

Date: 2026-06-09

## Issue

v007 made the interface cleaner, but owner testing on real iPhone Safari showed a layout failure: the board stayed too large/tall and the bottom tray could be pushed behind the Safari bottom toolbar.

Desktop and browser mobile emulation were not enough because real Safari browser chrome reduces the actually visible height available to the game.

## Root Cause

The game already read `window.visualViewport.height`, but the page shell still had a `100vh` minimum height path and the mobile layout reserved only a small bottom gap. That was too optimistic for real iPhone Safari.

## v008 Fix

v008 is a layout hotfix only:

- Keep the v007 visual style.
- Version active assets to `ringzzle.v008.css` and `ringzzle-phaser.v008.js`.
- Use a JS-set `--ringzzle-visible-height` CSS variable from `visualViewport.height`.
- Remove the `100vh` shell minimum that can fight the visible viewport size.
- Compact the mobile header/HUD.
- Add a larger mobile bottom reserve for Safari browser chrome.
- Calculate board size from the remaining visible height so the board shrinks before the tray is hidden.
- Preserve multi-pass relayout at `0ms`, `100ms`, `300ms`, and `600ms`.

## Priority

Tray visibility is the top priority. On real iPhone Safari, the player must always be able to see and drag from the bottom tray.

## Non-Goals

v008 does not change gameplay rules, scoring, color progression, tray generation, Color Burst, line clear effects, backend, leaderboard, login, ads, analytics, IAP, Daily Challenge, or Cloudflare settings.
