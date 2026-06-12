# Ringzzle Web Mobile Gutters And Leaderboard CTA Fix

## Context

Ringzzle.com is now a game-first site with the homepage embedding the existing playable game through `/play/?embed=home`. The embedded game needs to remain playable, but on real iPhone Safari the card should leave visible side gutters so the page can still be scrolled outside the game area.

This pass follows the recent Blockzzle mobile pattern:

- Keep the homepage game card slightly narrower than the viewport on mobile.
- Preserve direct drag/drop reliability inside the game frame.
- Route public play calls to action to the homepage as the public game-first entry point.
- Preserve standalone `/play/` for direct sessions and the embedded iframe.

## Mobile Game Card Width

The mobile homepage game frame now uses an explicit width of `min(90vw, 400px)` and is centered. This creates visible left and right gutters on iPhone-sized screens while keeping the board and tray large enough for normal play.

Desktop layout remains mostly unchanged. The width rule is limited to the mobile breakpoint where the homepage switches to a single-column game-first layout.

## Drag Versus Scroll Decision

The embedded game canvas remains responsible for drag/drop interactions inside the game area. The page should scroll naturally when the player starts a scroll gesture from the visible side gutters or other content outside the game frame.

This avoids weakening ring drag behavior in order to force scrolling over the canvas. Below-game sections remain reachable through normal page scroll from the gutters or the non-game content areas.

## Leaderboard CTA Route Decision

Public play CTAs now point to `/`, because the homepage is the public game-first entry point:

- `/leaderboard/` primary `Play Ringzzle` CTA points to `/`.
- The homepage leaderboard teaser `Play Ringzzle` CTA points to `/`.

Standalone `/play/` is preserved and still used for:

- Direct play sessions.
- The homepage iframe source: `/play/?embed=home`.
- Existing support/content links where direct play is intentional.

## Embedded Rank And Controls

The embedded homepage game keeps the current play controls. The duplicate homepage title/subtitle is already hidden on mobile, and the in-game controls remain part of the embedded experience.

If future real-device testing shows the embedded header is crowded, Rank can be hidden in `embed=home` and exposed through the below-game leaderboard section. That was not changed in this pass.

## App Card And QR Behavior

The app card keeps its current Coming soon behavior because store URLs are empty. No app store URLs, ratings, reviews, downloads, or app claims were invented.

The QR/mobile target remains `https://ringzzle.com/play/`, matching the current configured direct play target.

## Manual Smoke Checklist

- Homepage game card has visible side gutters on mobile.
- Side gutters allow page scroll on iPhone Safari.
- Drag/drop inside the game still works.
- Board and tray remain visible.
- Below-game sections are reachable by page scroll.
- Leaderboard `Play Ringzzle` CTA goes to `/`.
- Standalone `/play/` still works.
- `/leaderboard/` still works.
