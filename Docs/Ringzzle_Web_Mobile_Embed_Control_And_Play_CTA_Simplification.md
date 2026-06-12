# Ringzzle Web Mobile Embed Control And Play CTA Simplification

## iPhone Safari Issue

The game-first homepage embeds `/play/?embed=home`, but the embedded game still showed the standalone game header controls:

- `Ringzzle` title inside the iframe.
- `Free color rings puzzle game...` subtitle inside the iframe.
- `Home` button inside the iframe.
- `Rank` button inside the iframe.

On mobile Safari this duplicated the surrounding homepage context and used space that should belong to the board, tray, Sound, and Restart controls.

## Embedded Title And Description Decision

In `embed=home` mode, the Phaser-rendered in-game title and subtitle are hidden. The homepage keeps the public SEO and explanatory content outside the iframe, so removing duplicate in-game copy from the embedded game does not remove the public landing-page content.

Standalone `/play/` keeps the normal title and subtitle because it is still the direct game route.

## Home Button Embed-Mode Decision

The in-game Home button is hidden in homepage embed mode. The player is already on the homepage, and the page-level navigation provides the home context.

Standalone `/play/` keeps the Home button.

## Rank And Leaderboard Embed-Mode Decision

The in-game Rank button is hidden in homepage embed mode. Leaderboard access remains available through:

- Site navigation.
- The below-game homepage leaderboard section.
- `/leaderboard/`.

Standalone `/play/` keeps the Rank button and in-game leaderboard modal.

## Sound And Restart Preservation

Sound and Restart remain visible in homepage embed mode. They are the two controls the player still needs directly inside the embedded game:

- Sound remains user-triggered and off by default.
- Restart remains available for quick replay.

## Public Play CTA Routing

Public/marketing Play links now route to the homepage game-first area with `/#play`. This includes site navigation and content CTAs such as How to Play, Tips, Privacy, Terms, and the leaderboard hero.

Standalone `/play/` is preserved for direct access, iframe embedding, QR/deep links, canonical game route, and sitemap inclusion.

## Standalone Play Preservation

The direct `/play/` route remains available and uses the full game UI. The homepage iframe still loads `/play/?embed=home`; only that embed mode hides the duplicated title/subtitle/Home/Rank UI.

## Manual Smoke Checklist

- Homepage embed no longer shows duplicate in-game title/subtitle.
- Home is hidden in homepage embed.
- Rank is hidden in homepage embed.
- Sound and Restart remain visible.
- Board and tray remain visible.
- Ring drag/drop still works.
- Side gutters still allow page scroll.
- Public Play CTAs from leaderboard/how-to/tips route to the homepage game-first area.
- Leaderboard remains reachable from homepage/navigation.
- Standalone `/play/` still works with expected controls.
