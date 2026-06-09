# Ringzzle Web v015 Sound and Tray Clarity Polish

## Context

v014 added the lightweight Sound On/Off button and the owner confirmed that sound works well.

v015 is a small polish pass only. It improves Color Burst sound readability and makes bottom tray rings easier to read.

## Color Burst Sound

Color Burst should sound more distinctive than a normal line clear.

v015 keeps the same sound policy:

- Sound Off by default.
- Sound activates only after the user taps the Sound button.
- WebAudio oscillator/gain only.
- No audio files.
- No autoplay.
- No automatic Sound On restore after reload.

The Color Burst cue uses a short layered oscillator pattern for an electric zap/static-like feel. It stays brief and soft so it does not become harsh or spammy during fast play.

## Tray Ring Readability

The bottom tray rings in v014 were slightly small, making small/medium/large differences harder to read.

v015 increases tray ring rendering closer to full well size while keeping the largest tray ring comfortably inside each tray holder on the supported mobile viewport cases:

- 390x844
- 393x852
- 430x932
- 390x720
- 393x735
- 430x780

The tray wells remain the same rack-style holders. Touch and drag behavior are not changed.

## Deferred Leaderboard

A Blockzzle-like leaderboard is desired, but it is intentionally deferred to a separate phase.

v015 does not add backend, D1, leaderboard, login, ads, analytics, IAP, Daily Challenge, fake ranking, or Cloudflare Functions.

## Unchanged Gameplay

v015 does not change gameplay rules, scoring, line clear rules, Color Burst rules, color progression, tray generation, game-over logic, or localStorage stats.
