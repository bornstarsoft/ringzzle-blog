# Ringzzle Web v005 Clear Effect And Color Burst Plan

Date: 2026-06-08

## Goal

v005 improves clarity and reward feedback for the client-only Phaser Ringzzle Web game. It keeps the v004 balance foundation while making clears easier to read and making the tray visually distinct from the 3x3 board.

This phase does not add backend, D1, leaderboard, login, ads, analytics, IAP, Daily Challenge, fake ranking, Cloudflare Functions, or production setting changes.

## Line Clear Effect

When a horizontal, vertical, or diagonal color line clears, Ringzzle Web should show a lightweight beam across the matched line.

Behavior:

- Draw or flash a line across the three involved cells.
- Use the matched ring color for the beam.
- Support simultaneous row, column, and diagonal clears.
- Keep the effect readable but brief so it does not block the next move.
- Keep score and move feedback visible above the effect.

Implementation direction:

- Keep line clear logic in the pure game model.
- Include line event metadata with `id`, `color`, and `cells`.
- Render beams in the Phaser feedback layer after a valid placement.
- Use short alpha/scale tweens rather than heavy particles.
- Publish a small DOM dataset signal for smoke testing, such as line effect count and color burst count.

## Same-Cell Color Burst

When one board cell contains small, medium, and large rings all in the same color, it should trigger a Rainbow-like color burst.

Behavior:

- The completed cell triggers a special color burst event.
- All rings of that color on the board are cleared.
- This replaces v004's local-only same-cell bonus.
- Other colors are preserved.
- Rings already cleared by line clears in the same move are not double-counted.
- The move gets a distinct bonus score.
- Feedback should say `Color Burst` or similar.

Scoring:

- Keep placement score at `+10`.
- Keep line clear score at `+100`.
- Keep multi-clear bonus at `+50` for each extra clear event after the first.
- Keep the color burst bonus at `+150` for v005.

Why keep `+150`:

- The burst is more powerful than v004's local bonus, but it is still rare.
- It remains easy to understand in score feedback.
- Larger scoring changes should wait for playtest because the burst already increases survival by removing more rings.

## Board And Tray Separation

Owner feedback says the bottom 3-piece tray and the 3x3 board look too similar. v005 should make their roles clearer.

Board direction:

- The board should read as the main play area.
- Add a stronger panel/background and border behind the 3x3 grid.
- Keep board cells large, structured, and easy to target.

Tray direction:

- The tray should read as a separate bottom rack or rail.
- Tray slots should be visually smaller or styled differently from board cells.
- Use a rack background, lower contrast slot fill, spacing, and a small label if it fits.
- Do not reduce the interactive drag/tap area.
- Keep the tray above mobile Safari's bottom toolbar.

Mobile constraints:

- Preserve 390x844, 393x852, and 430x932 fit.
- Avoid scroll overflow.
- Keep drag targets ergonomic.
- Keep visual changes inside Phaser drawing so the static Hugo structure remains unchanged.

## Testing

Logic tests should cover:

- Color-only line clears still work with mixed sizes.
- Line clear score is still awarded.
- Full same-color cells now clear all board rings of that color.
- Color burst preserves other colors.
- Overlapping line clear and color burst do not double-count the same ring.
- Color progression still uses v004 thresholds.
- Tray generation still respects unlocked color count.

Browser smoke should cover:

- `/play/` loads v005 assets.
- Valid placement works.
- Invalid drop returns.
- Line clear effect appears.
- Color burst effect can be triggered or is validated by deterministic logic tests if random UI state cannot force it safely.
- Restart works.
- No console errors.
- Mobile viewport checks still pass.

## Rollback

Keep v001, v002, v003, and v004 assets in place. v005 should be activated only by updating `static/play/index.html` to reference `ringzzle.v005.css` and `ringzzle-phaser.v005.js`.
