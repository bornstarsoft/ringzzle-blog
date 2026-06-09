# Ringzzle Web v016 Tray Minimal UI Hotfix

## Context

v015 sound is accepted. The remaining tray issue is visual presentation: idle tray rings still looked slightly smaller than the selected/dragged ring, and the tray rack/wells made the bottom area feel heavier than desired.

## v016 Changes

v016 sets idle tray rings to full tray scale so they read as scale 1.0 before selection.

The selected/dragged tray ring now uses the same tray render size as the idle tray ring, avoiding an obvious pickup size jump.

v016 also removes the visible tray rack/background and the three visible tray wells/holders. The rings now float cleanly near the bottom of the play area.

## Preserved Interaction

The visible tray containers are removed, but the invisible tray slot hit areas remain in place.

This preserves:

- touch targets
- pointer hit areas
- drag behavior
- invalid drop return behavior
- tray refill behavior
- mobile Safari fit
- tray visibility above the bottom reserve

## Unchanged Scope

v016 does not change gameplay rules, scoring, color progression, tray generation, Sound Off default behavior, WebAudio sound behavior, localStorage stats, leaderboard, backend, D1, login, ads, analytics, IAP, Daily Challenge, fake ranking, Cloudflare Functions, CNAME, config, repo name, Blockzzle Web, or Unity project files.

Leaderboard remains deferred to a separate phase.
