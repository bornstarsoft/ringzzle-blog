# Ringzzle Web v022 Game Over Submission UI

Status: implemented.

## Scope

v022 adds the first in-game leaderboard submission UI. It appears only after game over and only submits when the player taps `Submit Score`.

This phase does not add automatic submission, login, email, ads, analytics, IAP, Daily Challenge, fake rankings, or gameplay changes.

## Game Over UI

The game-over panel keeps the final score, best score, today score, games played, and restart action. v022 adds:

- nickname input
- `Submit Score` button
- privacy copy: `Anonymous leaderboard. No login or email.`
- `/leaderboard/` link
- success/failure message area

The submit UI is a DOM overlay so mobile Safari text input behaves normally.

## Anonymous Browser Player ID

v022 creates a random local browser player id when needed and stores it in:

- `ringzzleBrowserPlayerIdV1`

The id is not shown in the UI and is sent only to `POST /api/leaderboard/submit`.

It is not a login, account, profile, or public identity.

## Nickname

The last nickname may be stored locally in:

- `ringzzleLeaderboardNicknameV1`

Client validation mirrors the server expectation for helpful feedback:

- 2-16 characters
- letters, numbers, spaces, underscore, and hyphen

The server remains the source of truth.

## Payload

v022 sends:

- `nickname`
- `score`
- `browserPlayerId`
- `clientVersion`
- `bestClear`
- `lineClears`
- `colorBursts`
- `maxUnlockedColors`
- `gamesPlayed`

The UI does not claim a rank because the v21 submit response does not return one.

## Duplicate Guard

The submit button is disabled while submitting and after a successful submit for the same game-over screen. Restart resets the local submit UI state.
