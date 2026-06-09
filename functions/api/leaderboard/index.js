import {
  dedupeLeaderboardRowsByNickname,
  getDayKey,
  json,
  normalizeScope,
  publicEntry,
  unavailableJson,
} from "./_shared.mjs";

export async function onRequestGet({ request, env }) {
  if (!env || !env.DB) return unavailableJson();

  const url = new URL(request.url);
  const scope = normalizeScope(url.searchParams.get("scope"));
  const dayKey = getDayKey();
  const generatedAt = new Date().toISOString();

  try {
    const scopedWhere = scope === "today" ? "AND s.day_key = ?" : "";
    const betterScopedWhere = scope === "today" ? "AND better.day_key = s.day_key" : "";
    const nicknameKey = "COALESCE(NULLIF(LOWER(TRIM(s.nickname_normalized)), ''), LOWER(TRIM(s.nickname)))";
    const betterNicknameKey = "COALESCE(NULLIF(LOWER(TRIM(better.nickname_normalized)), ''), LOWER(TRIM(better.nickname)))";
    const query = `
      SELECT s.id, s.nickname, s.nickname_normalized, s.score, s.best_clear, s.line_clears,
             s.color_bursts, s.max_unlocked_colors, s.created_at
      FROM ringzzle_scores s
      WHERE s.rejected = 0
        ${scopedWhere}
        AND NOT EXISTS (
          SELECT 1
          FROM ringzzle_scores better
          WHERE better.rejected = 0
            ${betterScopedWhere}
            AND ${betterNicknameKey} = ${nicknameKey}
            AND (
              better.score > s.score
              OR (better.score = s.score AND better.best_clear > s.best_clear)
              OR (better.score = s.score AND better.best_clear = s.best_clear AND better.line_clears > s.line_clears)
              OR (better.score = s.score AND better.best_clear = s.best_clear AND better.line_clears = s.line_clears AND better.color_bursts > s.color_bursts)
              OR (better.score = s.score AND better.best_clear = s.best_clear AND better.line_clears = s.line_clears AND better.color_bursts = s.color_bursts AND better.max_unlocked_colors > s.max_unlocked_colors)
              OR (
                better.score = s.score
                AND better.best_clear = s.best_clear
                AND better.line_clears = s.line_clears
                AND better.color_bursts = s.color_bursts
                AND better.max_unlocked_colors = s.max_unlocked_colors
                AND better.created_at < s.created_at
              )
              OR (
                better.score = s.score
                AND better.best_clear = s.best_clear
                AND better.line_clears = s.line_clears
                AND better.color_bursts = s.color_bursts
                AND better.max_unlocked_colors = s.max_unlocked_colors
                AND better.created_at = s.created_at
                AND better.id < s.id
              )
            )
        )
      ORDER BY s.score DESC, s.best_clear DESC, s.line_clears DESC, s.color_bursts DESC,
               s.max_unlocked_colors DESC, s.created_at ASC
      LIMIT 100
    `;
    const result = scope === "today"
      ? await env.DB.prepare(query).bind(dayKey).all()
      : await env.DB.prepare(query).all();
    const rows = Array.isArray(result && result.results) ? result.results : [];
    const entries = dedupeLeaderboardRowsByNickname(rows).map(publicEntry);

    return json({
      ok: true,
      scope,
      entries,
      generatedAt,
    });
  } catch (error) {
    return json({
      ok: false,
      scope,
      error: "leaderboard_query_failed",
      message: "Leaderboard is temporarily unavailable.",
      generatedAt,
    }, 503);
  }
}
