# Ringzzle Web v018 Status Text Tray Overlap Hotfix

## Context

v017 fixed tray, drag ghost, and board ring scale parity. It also removed the unintended fixed small/medium/large tray slot ordering.

The remaining UI issue was that lower status messages such as `Placed +10` could sit near the full-size tray rings and visually overlap a large tray ring.

## v018 Fix

v018 moves the status message out of the tray area.

The message now sits in the safe gap below the score chips and above the board panel. This keeps it visible while preventing overlap with:

- tray rings
- board cells
- the Safari bottom toolbar reserve

## Scope

v018 does not change gameplay rules, scoring, color progression, tray generation, line clear behavior, Color Burst behavior, sound behavior, leaderboard behavior, backend behavior, D1, Cloudflare Functions, CNAME, or config.
