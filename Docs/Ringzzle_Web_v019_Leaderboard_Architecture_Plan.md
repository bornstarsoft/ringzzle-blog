# Ringzzle Web v019 Leaderboard Architecture Plan

Status: updated after v22 game-over submission UI implementation. v020 adds a D1 migration, read-only Cloudflare Pages Function, and read-only `/leaderboard/` page. v21 adds the submit API. v22 adds explicit user-triggered game-over nickname submission UI. Automatic score submission remains deferred.

## References Inspected

Read-only Blockzzle Web reference files inspected:

- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/migrations/0001_create_blockzzle_leaderboard.sql`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/functions/api/leaderboard/_shared.js`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/functions/api/leaderboard/index.js`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/functions/api/leaderboard/submit.js`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/static/play/js/blockzzle-phaser.v023.js`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/static/js/leaderboard.v001.js`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/content/leaderboard.md`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/layouts/leaderboard/single.html`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/Docs/Blockzzle_Web_Anonymous_Leaderboard_Design.md`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/Docs/Blockzzle_Web_Leaderboard_Moderation_Plan.md`
- `/Users/seongjinkim/BornStarSoft_Publishing/github_hugo/blockzzle-web/content/privacy.md`

## Recommendation

Reuse the Blockzzle pattern: Cloudflare Pages Functions plus Cloudflare D1.

Reasons:

- Ringzzle is already a static Hugo game hosted in the same Cloudflare-oriented deployment style.
- The required API surface is small.
- D1 is enough for Today Top 100 and All-Time Top 100.
- It avoids login, account, email, and a separate backend vendor.
- Blockzzle already proves the shape: `GET /api/leaderboard?scope=...` and a later `POST /api/leaderboard/submit`.

v020 implemented only the read layer. v21 implements the submit API only.

Implemented in v020:

- D1 migration for `ringzzle_scores`.
- `GET /api/leaderboard?scope=today`.
- `GET /api/leaderboard?scope=alltime`.
- A simple read-only `/leaderboard/` page.

Implemented in v21:

- `POST /api/leaderboard/submit`.
- Server-side validation and nickname normalization.
- Anonymous insert into `ringzzle_scores`.
- Public-safe success/error responses.

Implemented in v22:

- Game-over nickname input.
- Explicit `Submit Score` button.
- Anonymous browser player id stored locally.
- Local nickname preference.
- `/leaderboard/` link.
- No rank claim after submit.

Still deferred:

- Privacy page launch copy.
- Any automatic score submission from `/play/`.

## Current Ringzzle Local Data

Ringzzle currently has browser-local stats and gameplay state only:

- `score`
- `highScore`
- `ringzzleHighScoreV1`
- `ringzzleTodayBestV1`
- `ringzzleTodayBestDateV1`
- `ringzzleGamesPlayedV1`
- `ringzzleLastScoreV1`
- `ringzzleBestClearV1`
- `gameOver`
- `bestClearThisGame`
- per-move `lineClears`
- per-move `colorBursts`
- `availableColorCount`
- `CLIENT_VERSION`

Ringzzle does not currently have nickname UI, server submission, D1, Cloudflare Functions, total line clear count per run, total Color Burst count per run, or public leaderboard UI.

Future leaderboard submission should fit after game over, not during active play. The natural location is the game-over panel, near the existing final score and restart action.

## Proposed D1 Table

Proposed table: `ringzzle_scores`

```sql
CREATE TABLE IF NOT EXISTS ringzzle_scores (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  normalized_nickname TEXT NOT NULL,
  score INTEGER NOT NULL,
  best_clear INTEGER NOT NULL,
  line_clears INTEGER NOT NULL DEFAULT 0,
  color_bursts INTEGER NOT NULL DEFAULT 0,
  max_unlocked_colors INTEGER NOT NULL DEFAULT 3,
  games_played INTEGER,
  board_version TEXT NOT NULL,
  client_version TEXT NOT NULL,
  browser_player_id TEXT,
  day_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  rejected INTEGER NOT NULL DEFAULT 0,
  reject_reason TEXT,
  moderation_note TEXT
);
```

Suggested indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_ringzzle_scores_day_score
  ON ringzzle_scores (day_key, score DESC, best_clear DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_ringzzle_scores_score
  ON ringzzle_scores (score DESC, best_clear DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_ringzzle_scores_normalized_day
  ON ringzzle_scores (normalized_nickname, day_key, score DESC);

CREATE INDEX IF NOT EXISTS idx_ringzzle_scores_browser_created_at
  ON ringzzle_scores (browser_player_id, created_at);

CREATE INDEX IF NOT EXISTS idx_ringzzle_scores_rejected
  ON ringzzle_scores (rejected, created_at);
```

## Proposed API Endpoints

Use the Blockzzle endpoint shape unless there is a deployment reason to split routes later:

- `GET /api/leaderboard?scope=today`
- `GET /api/leaderboard?scope=alltime`
- `POST /api/leaderboard/submit`

Optional future aliases:

- `GET /api/leaderboard/today`
- `GET /api/leaderboard/all-time`

## Submission Payload

Proposed `POST /api/leaderboard/submit` JSON:

```json
{
  "nickname": "Player",
  "score": 1230,
  "bestClear": 2,
  "lineClears": 8,
  "colorBursts": 1,
  "maxUnlockedColors": 5,
  "gamesPlayed": 14,
  "clientVersion": "v019",
  "browserPlayerId": "local-random-id"
}
```

Notes:

- `nickname`, `score`, `browserPlayerId`, and `clientVersion` are required in v21.
- `bestClear`, `lineClears`, `colorBursts`, `maxUnlockedColors`, and `gamesPlayed` are optional but validated when present.
- If total run line clears and Color Bursts are not tracked yet in the game UI, add run counters before enabling the game-over submission flow.
- `day_key` and `created_at` must be server-derived.
- `browser_player_id` must never be returned in public leaderboard responses.
- The server writes snake_case D1 columns and stores `board_version = ringzzle-classic-v1`.

## Public Response Shape

Proposed `GET /api/leaderboard?scope=today` response:

```json
{
  "ok": true,
  "scope": "today",
  "entries": [
    {
      "rank": 1,
      "nickname": "Player",
      "score": 1230,
      "best_clear": 2,
      "line_clears": 8,
      "color_bursts": 1,
      "max_unlocked_colors": 5,
      "created_at": "2026-06-09T00:00:00.000Z"
    }
  ]
}
```

Public responses must not include:

- `browser_player_id`
- moderation notes
- rejected rows
- raw request metadata
- email, login, or profile data

## Today And All-Time Behavior

Today:

- Use server-derived UTC `day_key` for the first MVP unless owner chooses a product timezone later.
- Filter `rejected = 0`.
- Dedupe by normalized nickname within the same day.
- Return Top 100.

All-Time:

- Query all non-rejected rows.
- Dedupe by normalized nickname globally.
- Return Top 100.

If the API fails, Ringzzle should fall back to local-only stats and show honest copy such as `Leaderboard temporarily unavailable. Your local score is still saved.`

## Tie-Break Rules

Recommended ordering:

1. Higher `score`.
2. Higher `best_clear`.
3. Higher `line_clears`.
4. Higher `color_bursts`.
5. Higher `max_unlocked_colors`.
6. Earlier `created_at`.
7. Lexicographically smaller `id`.

The first implementation should keep the rule simple. If real traffic shows awkward rankings, tune later.

## Nickname Normalization And Dedupe

Nickname validation should follow Blockzzle:

- Trim leading/trailing whitespace.
- Collapse repeated spaces.
- Allow letters, numbers, spaces, underscore, and hyphen.
- Length: 2-16 characters.
- Block reserved names such as `admin`, `moderator`, `support`, `staff`, and `owner`.

Store both:

- `nickname`: display form.
- `normalized_nickname`: lowercase trimmed/collapsed form for dedupe.

Public leaderboard should show only the best row per `normalized_nickname` for each scope. This prevents one nickname from crowding the board.

## Moderation Fields

Store:

- `rejected`
- `reject_reason`
- `moderation_note`
- gameplay context fields such as `client_version`, `board_version`, `line_clears`, `color_bursts`, and `max_unlocked_colors`

Do not store:

- email
- password
- account id
- real name
- payment data
- precise location
- public IP address in the D1 row
- user agent unless a later privacy update explicitly approves it

## Ringzzle-Specific Validation

Initial sanity checks should include:

- Score is within an MVP maximum.
- Duration is plausible for non-zero scores.
- `best_clear` is within the possible clear count range for a move.
- `line_clears` and `color_bursts` are non-negative and plausible for the score.
- `max_unlocked_colors` is between 3 and 6 for the current Ringzzle MVP.
- `client_version` is short and supported.
- `board_version` is `ringzzle-classic-v1` or another explicit supported value.

Do not attempt tournament-grade anti-cheat in the first phase. Make the leaderboard honest and moderatable, then harden based on real abuse.

## Implementation Phases

1. Review and approve this plan. Done.
2. Add D1 migration, read-only API, and read-only leaderboard page. Done in v020.
3. Add `POST /api/leaderboard/submit`. Done in v21.
4. Configure/verify Cloudflare D1 binding for production/staging after deployment.
5. Add Ringzzle run counters needed for game-over submission, still local-only.
6. Add privacy copy before public submission launch.
7. Add game-over nickname/submission UI. Done in v22.
8. Add manual moderation workflow documentation with real table names after production DB naming is final.
9. Consider stronger anti-cheat only after real traffic exists.

## Stop Conditions

Do not proceed if the phase starts to include login, email, ads, analytics, IAP, fake rankings, Daily Challenge, mobile app CTA, or broad Cloudflare production setting changes.
