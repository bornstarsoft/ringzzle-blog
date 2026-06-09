# Ringzzle Web v017 Tray and Board Scale Parity

## Context

v016 improved tray readability by removing visible tray rack/well containers and increasing idle tray ring scale.

Owner feedback clarified that the deeper issue was physical ring size parity: a ring in the tray should look like the same object when dragged and after placement on the board.

## v017 Scale Parity

v017 makes tray, drag ghost, and placed board rings use the same render size for the same ring size.

For each ring size:

- tray small = drag small = board small
- tray medium = drag medium = board medium
- tray large = drag large = board large

This avoids the visual impression that a ring grows when picked up or placed.

## Tray Slot Order

v017 also investigated tray generation.

The v016 generation path used sequence order for size, which made tray slots appear fixed as small, medium, large in repeated cycles. That was not an intentional gameplay rule.

v017 changes generated tray size selection to use the existing RNG, so slot position no longer implies ring size. Random generation can still occasionally produce small/medium/large in order, but it is not forced by slot index.

Tray refill behavior remains unchanged: the tray refills only after all three pieces are used.

## Unchanged Scope

v017 does not change scoring, line clear rules, Color Burst rules, color progression thresholds, sound policy, sound cues, leaderboard, backend, D1, login, ads, analytics, IAP, Daily Challenge, fake ranking, Cloudflare Functions, CNAME, config, repo name, Blockzzle Web, or Unity project files.
