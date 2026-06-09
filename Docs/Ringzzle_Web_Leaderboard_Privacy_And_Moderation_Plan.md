# Ringzzle Web Leaderboard Privacy And Moderation Plan

Status: updated after v020 read-only leaderboard implementation. v020 adds a D1 migration, read-only Cloudflare Pages Function, and read-only leaderboard page. It does not add nickname UI, analytics, ads, login, or score submission.

## Principles

Ringzzle leaderboard work should stay lightweight, anonymous, and honest.

The first leaderboard must be:

- anonymous
- optional
- nickname-only
- no login
- no email
- no account
- no personal profile
- no fake rankings
- no ads, analytics, IAP, or Daily Challenge coupling

## Public Copy

Use clear language:

- `Anonymous leaderboard`
- `Today Top 100`
- `All-Time Top 100`
- `Nickname only. No login.`
- `Submitted leaderboard entries are public.`

Avoid:

- `World Rank`
- `global rank`
- fake rank claims
- `players near you`
- any wording implying account identity or verified ownership

## Data To Store

Store only the data needed to operate and moderate an anonymous score board:

- nickname
- normalized nickname
- score
- best clear
- line clears
- Color Bursts
- max unlocked colors
- optional local games played count at submission time
- optional duration seconds
- board version
- client version
- browser player id for rate limiting and duplicate control
- server day key
- server created timestamp
- rejected flag
- optional rejection reason
- optional moderation note

## Data Not To Store

Do not store:

- email
- password
- login account
- real name
- payment data
- profile data
- precise location
- public social identifier
- mobile advertising id
- fake ranking seed data

Do not expose `browser_player_id` in public API responses or page markup.

## Browser Player ID

If used, `browser_player_id` should be:

- random
- generated locally
- stored in localStorage
- resettable by clearing site data
- used only for rate limiting, dedupe support, and moderation review
- never described as an account
- never exposed publicly

## Nickname Policy

Initial nickname policy should match the Blockzzle MVP:

- 2-16 characters.
- Trim whitespace.
- Collapse repeated spaces.
- Allow letters, numbers, spaces, underscore, and hyphen.
- Block obvious reserved names such as `admin`, `moderator`, `support`, `staff`, `owner`, and offensive placeholders.

Do not overbuild nickname moderation before real traffic. Keep the blocklist conservative and update it only when needed.

## Rejected Score Approach

Prefer hiding over deleting.

Use a `rejected` flag so suspicious or abusive rows disappear from public leaderboards while remaining available for debugging and abuse pattern review.

Suggested fields:

- `rejected INTEGER NOT NULL DEFAULT 0`
- `rejection_reason TEXT`
- `moderation_note TEXT`

Public read endpoints must filter `rejected = 0`.

## Manual D1 Moderation

Until an admin UI exists, moderation should be manual in Cloudflare D1.

Recommended workflow:

1. Open Cloudflare Dashboard.
2. Open the Ringzzle leaderboard D1 database.
3. Inspect `ringzzle_scores`.
4. Review top scores by `score`, `best_clear`, `duration_seconds`, `line_clears`, `color_bursts`, `created_at`, and `nickname`.
5. Set `rejected = 1` for abusive or impossible rows.
6. Add a short `rejection_reason` or `moderation_note` if useful.
7. Confirm the public leaderboard no longer returns the row.

Example review query:

```sql
SELECT id, nickname, score, best_clear, line_clears, color_bursts,
       max_unlocked_colors, duration_seconds, client_version, created_at, rejected
FROM ringzzle_scores
ORDER BY score DESC, best_clear DESC, created_at ASC
LIMIT 50;
```

Example hide query:

```sql
UPDATE ringzzle_scores
SET rejected = 1,
    rejection_reason = 'manual_review'
WHERE id = 'PASTE_ROW_ID_HERE';
```

Example restore query:

```sql
UPDATE ringzzle_scores
SET rejected = 0,
    rejection_reason = NULL
WHERE id = 'PASTE_ROW_ID_HERE';
```

## Moderation Triggers

Review rows when:

- score is impossible or implausible
- high score has very short duration
- nickname is offensive
- nickname impersonates Ringzzle, BornStarSoft, admin, support, or staff
- many similar nicknames appear quickly
- one nickname or browser id submits unusually often
- top scores appear immediately after deployment
- gameplay metrics do not make sense for the score

## Rate Limiting Direction

Reuse the Blockzzle idea:

- limit accepted submissions per browser player id per day
- limit accepted submissions per nickname per day when browser player id is missing
- add a short burst limit per browser player id

If abuse appears, consider Cloudflare platform rate limiting or Turnstile later. Do not add those in the first docs-only phase.

## Privacy Page Update Before Launch

Before public leaderboard launch, update Ringzzle privacy copy to explain:

- localStorage game stats
- optional anonymous leaderboard submission
- public nickname and score display
- browser player id use
- what is not collected
- how rows may be hidden for moderation

Do this before enabling score submission.

## Current Phase Non-Goals

The v020 read-only phase does not add:

- nickname UI
- score submission
- login
- email capture
- ads
- analytics
- IAP
- Daily Challenge
- fake ranking
- mobile app CTA
