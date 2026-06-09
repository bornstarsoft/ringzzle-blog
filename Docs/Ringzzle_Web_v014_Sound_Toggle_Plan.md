# Ringzzle Web v014 Sound Toggle Plan

Date: 2026-06-09

## Goal

v014 adds a lightweight optional Sound On/Off button.

## Sound Policy

- Sound is Off by default on every fresh page load.
- Sound activates only after the user taps the Sound button.
- WebAudio is created or resumed only inside that user gesture.
- The implementation uses oscillator and gain nodes only.
- No audio files are added.
- No autoplay is used.
- Sound On is not automatically restored after reload.
- Sound remains optional and must fail gracefully if WebAudio is blocked.

## Cue Scope

Short, soft cues are used for:

- Valid placement.
- Invalid drop.
- Line clear.
- Color Burst.
- Game over.
- Restart.
- Sound toggle on/off feedback.

The cues are intentionally brief and throttled to avoid rapid-move spam.

## Non-Changes

v014 does not change gameplay rules, scoring, color progression, tray generation, line clear logic, Color Burst rules, backend behavior, leaderboard behavior, ads, analytics, login, IAP, Daily Challenge, fake ranking, Cloudflare Functions, CNAME, config, repo name, Blockzzle Web, or Unity project files.
