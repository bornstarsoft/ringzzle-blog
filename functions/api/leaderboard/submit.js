import { createId, getDayKey, json, unavailableJson, validateSubmission } from "./_shared.mjs";

const MAX_JSON_BODY_BYTES = 8192;
const SUBMISSION_COOLDOWN_SECONDS = 8;

async function readJson(request) {
  try {
    return await request.json();
  } catch (error) {
    return null;
  }
}

function isJsonRequest(request) {
  const contentType = request.headers.get("content-type") || "";
  return contentType.toLowerCase().includes("application/json");
}

function isRequestBodyTooLarge(request) {
  const contentLength = Number.parseInt(request.headers.get("content-length") || "0", 10);
  return Number.isFinite(contentLength) && contentLength > MAX_JSON_BODY_BYTES;
}

async function hasRecentSubmission(db, browserPlayerId, now) {
  const since = new Date(now.getTime() - SUBMISSION_COOLDOWN_SECONDS * 1000).toISOString();
  const result = await db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM ringzzle_scores
      WHERE rejected = 0
        AND browser_player_id = ?
        AND created_at >= ?
    `)
    .bind(browserPlayerId, since)
    .first();
  return Number(result && result.count ? result.count : 0) > 0;
}

export async function onRequest({ request, env, now: injectedNow }) {
  if (request.method !== "POST") {
    return json({
      ok: false,
      error: "method_not_allowed",
      message: "Use POST to submit a leaderboard score.",
    }, 405);
  }

  if (!env || !env.DB) return unavailableJson();

  if (!isJsonRequest(request)) {
    return json({
      ok: false,
      error: "unsupported_media_type",
      message: "Submit leaderboard scores as JSON.",
    }, 415);
  }

  if (isRequestBodyTooLarge(request)) {
    return json({
      ok: false,
      error: "payload_too_large",
      message: "Leaderboard submission is too large.",
    }, 413);
  }

  const body = await readJson(request);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json({
      ok: false,
      error: "invalid_json",
      message: "Invalid leaderboard submission.",
    }, 400);
  }

  const validation = validateSubmission(body);
  if (!validation.ok) {
    return json({
      ok: false,
      error: "invalid_submission",
      message: validation.error,
    }, 400);
  }

  const now = injectedNow instanceof Date ? injectedNow : new Date();
  const createdAt = now.toISOString();
  const dayKey = getDayKey(now);
  const entry = validation.entry;

  try {
    if (await hasRecentSubmission(env.DB, entry.browser_player_id, now)) {
      return json({
        ok: false,
        error: "rate_limited",
        message: "Please wait a moment before submitting another score.",
      }, 429);
    }

    await env.DB
      .prepare(`
        INSERT INTO ringzzle_scores (
          id,
          created_at,
          day_key,
          nickname,
          nickname_normalized,
          browser_player_id,
          score,
          best_clear,
          line_clears,
          color_bursts,
          max_unlocked_colors,
          games_played,
          client_version,
          board_version,
          rejected,
          reject_reason,
          moderation_note
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        createId(),
        createdAt,
        dayKey,
        entry.nickname,
        entry.nickname_normalized,
        entry.browser_player_id,
        entry.score,
        entry.best_clear,
        entry.line_clears,
        entry.color_bursts,
        entry.max_unlocked_colors,
        entry.games_played,
        entry.client_version,
        entry.board_version,
        0,
        null,
        null
      )
      .run();

    return json({
      ok: true,
      accepted: true,
      score: entry.score,
      nickname: entry.nickname,
    });
  } catch (error) {
    return json({
      ok: false,
      error: "leaderboard_submit_failed",
      message: "Leaderboard is temporarily unavailable.",
    }, 503);
  }
}
