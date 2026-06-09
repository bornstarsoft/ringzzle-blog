import { createId, getDayKey, json, unavailableJson, validateSubmission } from "./_shared.mjs";

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

export async function onRequest({ request, env }) {
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

  const now = new Date();
  const createdAt = now.toISOString();
  const dayKey = getDayKey(now);
  const entry = validation.entry;

  try {
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
