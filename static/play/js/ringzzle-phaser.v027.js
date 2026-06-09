(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.RingzzleCore = api.RingzzleCore;
  if (typeof window !== "undefined") {
    window.addEventListener("DOMContentLoaded", () => {
      if (root.Phaser) {
        api.bootPhaserGame(root.Phaser);
      }
    });
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const BOARD_SIZE = 3;
  const TRAY_SIZE = 3;
  const SIZES = ["small", "medium", "large"];
  const COLORS = ["#ff3366", "#16e876", "#24a8ff", "#ffd02e", "#a65cff", "#ff8a24"];
  const DRAG_LIFT = { x: 0, y: -24 };
  const ORIENTATION_RECOVERY_DELAYS = [0, 100, 300, 600];
  const CLIENT_VERSION = "v027";
  const LEADERBOARD_AUTO_SUBMIT = false;
  const LEADERBOARD_ROUTE = "/leaderboard/";
  const LEADERBOARD_OPEN_MODE = "modal";
  const LEADERBOARD_NICKNAME_ENTRY_MODE = "prompt";
  const LEADERBOARD_INLINE_NICKNAME_INPUT = false;
  const LEADERBOARD_SCOPE_TABS = [
    { label: "Today", scope: "today" },
    { label: "All-Time", scope: "alltime" },
  ];
  const LINE_INDICATOR_DURATION = 150;
  const COLOR_BURST_EFFECT_DURATION = 200;
  const TRAY_RING_RENDER_SCALE = 1;
  const TRAY_VISUAL_STYLE = {
    showRack: false,
    showWells: false,
    keepHitAreas: true,
  };
  const SOUND_DEFAULT_ENABLED = false;
  const SOUND_MIN_INTERVAL_MS = 42;
  const START_COLOR_COUNT = 3;
  const MAX_COLOR_COUNT = Math.min(6, COLORS.length);
  const UNITY_COLOR_SCORE_THRESHOLDS = [25, 50, 150, 250, 500];
  const COLOR_PROGRESSION = [
    { minScore: 0, colorCount: 3 },
    { minScore: 250, colorCount: 4 },
    { minScore: 800, colorCount: 5 },
    { minScore: 1600, colorCount: 6 },
  ];

  const STORAGE_KEYS = {
    highScore: "ringzzleHighScoreV1",
    todayBest: "ringzzleTodayBestV1",
    todayBestDate: "ringzzleTodayBestDateV1",
    gamesPlayed: "ringzzleGamesPlayedV1",
    lastScore: "ringzzleLastScoreV1",
    bestClear: "ringzzleBestClearV1",
    browserPlayerId: "ringzzleBrowserPlayerIdV1",
    leaderboardNickname: "ringzzleLeaderboardNicknameV1",
  };

  const SCORE = {
    placement: 10,
    lineClear: 100,
    cellBonus: 150,
    multiClearBonus: 50,
  };

  const SOUND_CUES = {
    place: { name: "place", frequency: 420, endFrequency: 520, duration: 0.055, gain: 0.032, type: "sine" },
    invalid: { name: "invalid", frequency: 155, endFrequency: 115, duration: 0.07, gain: 0.024, type: "triangle" },
    "line-clear": { name: "line-clear", frequency: 620, endFrequency: 880, duration: 0.12, gain: 0.052, type: "sine" },
    "color-burst": {
      name: "color-burst",
      frequency: 900,
      endFrequency: 180,
      duration: 0.2,
      gain: 0.064,
      type: "sawtooth",
      character: "electric-zap",
      layers: [
        { frequency: 900, endFrequency: 1760, duration: 0.045, gain: 0.03, type: "square", delay: 0 },
        { frequency: 1320, endFrequency: 260, duration: 0.105, gain: 0.024, type: "sawtooth", delay: 0.025 },
        { frequency: 620, endFrequency: 1180, duration: 0.075, gain: 0.02, type: "triangle", delay: 0.09 },
      ],
    },
    "game-over": { name: "game-over", frequency: 220, endFrequency: 120, duration: 0.16, gain: 0.04, type: "triangle" },
    restart: { name: "restart", frequency: 330, endFrequency: 440, duration: 0.075, gain: 0.03, type: "sine" },
    "toggle-on": { name: "toggle-on", frequency: 500, endFrequency: 760, duration: 0.09, gain: 0.04, type: "sine" },
    "toggle-off": { name: "toggle-off", frequency: 260, endFrequency: 180, duration: 0.07, gain: 0.026, type: "sine" },
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function parseStoredStat(value) {
    const parsed = Number.parseInt(value || "0", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  function padDatePart(value) {
    return String(value).padStart(2, "0");
  }

  function getTodayKey(date) {
    const localDate = date || new Date();
    return [
      localDate.getFullYear(),
      padDatePart(localDate.getMonth() + 1),
      padDatePart(localDate.getDate()),
    ].join("-");
  }

  function normalizeStats(raw, todayKey) {
    const input = raw || {};
    const storedDate = input.todayBestDate || todayKey;
    const dateMatches = storedDate === todayKey;
    return {
      highScore: parseStoredStat(input.highScore),
      todayBest: dateMatches ? parseStoredStat(input.todayBest) : 0,
      todayBestDate: todayKey,
      gamesPlayed: parseStoredStat(input.gamesPlayed),
      lastScore: parseStoredStat(input.lastScore),
      bestClear: parseStoredStat(input.bestClear),
    };
  }

  function loadStats(storage, todayProvider) {
    const todayKey = getTodayKey(todayProvider ? todayProvider() : new Date());
    if (!storage) return normalizeStats({}, todayKey);
    try {
      return normalizeStats({
        highScore: storage.getItem(STORAGE_KEYS.highScore),
        todayBest: storage.getItem(STORAGE_KEYS.todayBest),
        todayBestDate: storage.getItem(STORAGE_KEYS.todayBestDate),
        gamesPlayed: storage.getItem(STORAGE_KEYS.gamesPlayed),
        lastScore: storage.getItem(STORAGE_KEYS.lastScore),
        bestClear: storage.getItem(STORAGE_KEYS.bestClear),
      }, todayKey);
    } catch (error) {
      return normalizeStats({}, todayKey);
    }
  }

  function completeStats(previousStats, score, bestClear, todayKey) {
    const stats = previousStats || normalizeStats({}, todayKey);
    const finalScore = Math.max(0, Number.parseInt(score || 0, 10) || 0);
    const clearCount = Math.max(0, Number.parseInt(bestClear || 0, 10) || 0);
    return {
      highScore: Math.max(stats.highScore || 0, finalScore),
      todayBest: Math.max(stats.todayBest || 0, finalScore),
      todayBestDate: todayKey,
      gamesPlayed: (stats.gamesPlayed || 0) + 1,
      lastScore: finalScore,
      bestClear: Math.max(stats.bestClear || 0, clearCount),
    };
  }

  function saveStats(storage, stats) {
    if (!storage || !stats) return;
    try {
      storage.setItem(STORAGE_KEYS.highScore, String(stats.highScore));
      storage.setItem(STORAGE_KEYS.todayBest, String(stats.todayBest));
      storage.setItem(STORAGE_KEYS.todayBestDate, stats.todayBestDate);
      storage.setItem(STORAGE_KEYS.gamesPlayed, String(stats.gamesPlayed));
      storage.setItem(STORAGE_KEYS.lastScore, String(stats.lastScore));
      storage.setItem(STORAGE_KEYS.bestClear, String(stats.bestClear));
    } catch (error) {
      // Browser-local repeat stats are optional; gameplay must keep moving.
    }
  }

  function createBrowserPlayerId(randomProvider) {
    const randomFn = randomProvider || Math.random;
    const randomPart = Array.from({ length: 3 }, () => {
      const value = Math.floor(Math.max(0, Math.min(0.999999999, randomFn())) * 0xffffffff);
      return value.toString(36).padStart(7, "0");
    }).join("_");
    return `ringzzle_${Date.now().toString(36)}_${randomPart}`;
  }

  function getOrCreateBrowserPlayerId(storage, randomProvider) {
    if (!storage) return createBrowserPlayerId(randomProvider);
    try {
      const existing = String(storage.getItem(STORAGE_KEYS.browserPlayerId) || "").trim();
      if (/^ringzzle_[a-z0-9_]{12,}$/.test(existing) && existing.length <= 80) return existing;
      const created = createBrowserPlayerId(randomProvider);
      storage.setItem(STORAGE_KEYS.browserPlayerId, created);
      return created;
    } catch (error) {
      return createBrowserPlayerId(randomProvider);
    }
  }

  function validateLeaderboardNicknameClient(value) {
    const nickname = String(value || "").trim().replace(/\s+/g, " ");
    if (nickname.length < 2 || nickname.length > 16) {
      return { ok: false, nickname, message: "Use 2-16 characters." };
    }
    if (!/^[A-Za-z0-9 _-]+$/.test(nickname)) {
      return { ok: false, nickname, message: "Use letters, numbers, spaces, _ or -." };
    }
    return { ok: true, nickname, message: "" };
  }

  function resolveLeaderboardNicknameForSubmit(options) {
    const opts = options || {};
    const storedResult = validateLeaderboardNicknameClient(opts.storedNickname || "");
    if (!opts.forcePrompt && storedResult.ok) {
      return {
        ok: true,
        nickname: storedResult.nickname,
        cancelled: false,
        prompted: false,
        shouldStore: false,
        message: "",
      };
    }

    const promptProvider = typeof opts.promptProvider === "function" ? opts.promptProvider : null;
    if (!promptProvider) {
      return {
        ok: false,
        nickname: "",
        cancelled: false,
        prompted: false,
        shouldStore: false,
        message: "Choose a nickname first.",
      };
    }

    const fallback = storedResult.ok ? storedResult.nickname : "Player";
    const entered = promptProvider(fallback);
    if (entered === null || entered === undefined) {
      return {
        ok: false,
        nickname: "",
        cancelled: true,
        prompted: true,
        shouldStore: false,
        message: "",
      };
    }

    const nicknameResult = validateLeaderboardNicknameClient(entered);
    if (!nicknameResult.ok) {
      return {
        ok: false,
        nickname: nicknameResult.nickname,
        cancelled: false,
        prompted: true,
        shouldStore: false,
        message: nicknameResult.message,
      };
    }

    return {
      ok: true,
      nickname: nicknameResult.nickname,
      cancelled: false,
      prompted: true,
      shouldStore: true,
      message: "",
    };
  }

  function shouldSubmitLeaderboardAfterNickname(nicknameResult) {
    return !!(nicknameResult && nicknameResult.ok && !nicknameResult.cancelled);
  }

  function getLeaderboardSubmitCta(options) {
    const opts = options || {};
    if (opts.submitted) {
      return {
        buttonLabel: "Submitted",
        message: "Score submitted.",
        primary: false,
        fill: "#173447",
        text: "#7ba0ad",
      };
    }
    if (opts.submitting) {
      return {
        buttonLabel: "Submitting...",
        message: "Submitting score...",
        primary: true,
        fill: "#facc15",
        text: "#07131e",
      };
    }
    const score = Math.max(0, Number.parseInt(opts.score || 0, 10) || 0);
    const previousTodayBest = Math.max(0, Number.parseInt(opts.previousTodayBest || 0, 10) || 0);
    const isNewTodayBest = score > previousTodayBest;
    return {
      buttonLabel: isNewTodayBest ? "Submit Score" : "Submit anyway",
      message: isNewTodayBest ? "New Today Best!" : "Score saved locally.",
      primary: isNewTodayBest,
      fill: isNewTodayBest ? "#facc15" : "#173447",
      text: isNewTodayBest ? "#07131e" : "#f6fbff",
    };
  }

  function getLeaderboardNicknameDisplay(value) {
    const nicknameResult = validateLeaderboardNicknameClient(value || "");
    if (!nicknameResult.ok) {
      return {
        text: "Tap Submit Score to choose nickname.",
        highlighted: false,
        color: "#bfd1dc",
        fontSize: 11,
      };
    }
    return {
      text: `Nickname: ${nicknameResult.nickname}`,
      highlighted: true,
      color: "#facc15",
      fontSize: 12,
    };
  }

  function buildLeaderboardReadUrl(scope, cacheBust) {
    const resolvedScope = scope === "alltime" ? "alltime" : "today";
    const version = cacheBust === undefined || cacheBust === null
      ? Date.now()
      : cacheBust;
    return `/api/leaderboard?scope=${encodeURIComponent(resolvedScope)}&v=${encodeURIComponent(String(version))}`;
  }

  function buildLeaderboardSubmitPayload(options) {
    const opts = options || {};
    const game = opts.game || {};
    const stats = game.stats || {};
    return {
      nickname: opts.nickname,
      score: Math.max(0, Number.parseInt(game.score || 0, 10) || 0),
      browserPlayerId: opts.browserPlayerId,
      clientVersion: CLIENT_VERSION,
      bestClear: Math.max(0, Number.parseInt(game.bestClearThisGame || 0, 10) || 0),
      lineClears: Math.max(0, Number.parseInt(game.totalLineClearsThisGame || 0, 10) || 0),
      colorBursts: Math.max(0, Number.parseInt(game.totalColorBurstsThisGame || 0, 10) || 0),
      maxUnlockedColors: clamp(Number.parseInt(game.availableColorCount || START_COLOR_COUNT, 10) || START_COLOR_COUNT, START_COLOR_COUNT, MAX_COLOR_COUNT),
      gamesPlayed: Math.max(0, Number.parseInt(stats.gamesPlayed || 0, 10) || 0),
    };
  }

  function resolveLeaderboardSubmitState(previousState, action) {
    const state = {
      visible: false,
      canSubmit: false,
      submitting: false,
      submitted: false,
      message: "",
      ...(previousState || {}),
    };
    const type = action && action.type;
    if (type === "game-over") {
      return { ...state, visible: true, canSubmit: !state.submitted, submitting: false, message: state.message || "" };
    }
    if (type === "submit-start") {
      if (state.submitting || state.submitted) return { ...state, canSubmit: false };
      return { ...state, visible: true, canSubmit: false, submitting: true, message: "Submitting..." };
    }
    if (type === "submit-success") {
      return { ...state, visible: true, canSubmit: false, submitting: false, submitted: true, message: "Score submitted." };
    }
    if (type === "submit-error") {
      return { ...state, visible: true, canSubmit: true, submitting: false, submitted: false, message: (action && action.message) || "Submit failed. Try again." };
    }
    if (type === "restart" || type === "hide") {
      return { visible: false, canSubmit: false, submitting: false, submitted: false, message: "" };
    }
    return state;
  }

  function resolveLeaderboardViewState(previousState, action) {
    const state = {
      open: false,
      scope: "today",
      entries: { today: null, alltime: null },
      status: "",
      loadingScope: null,
      needsLoad: false,
      ...(previousState || {}),
    };
    const type = action && action.type;
    if (type === "open") {
      return { ...state, open: true, needsLoad: !state.entries[state.scope] };
    }
    if (type === "close") {
      return { ...state, open: false, needsLoad: false };
    }
    if (type === "scope") {
      const scope = action.scope === "alltime" ? "alltime" : "today";
      return { ...state, scope, needsLoad: !state.entries[scope] };
    }
    if (type === "loading") {
      const scope = action.scope === "alltime" ? "alltime" : "today";
      return {
        ...state,
        scope: action.preserveScope ? state.scope : scope,
        loadingScope: scope,
        status: "Loading leaderboard...",
        needsLoad: false,
      };
    }
    if (type === "loaded") {
      const scope = action.scope === "alltime" ? "alltime" : "today";
      const entries = { ...state.entries, [scope]: Array.isArray(action.entries) ? action.entries : [] };
      return {
        ...state,
        scope: action.preserveScope ? state.scope : scope,
        entries,
        loadingScope: state.loadingScope === scope ? null : state.loadingScope,
        status: entries[scope].length ? "" : "No submitted scores yet.",
        needsLoad: false,
      };
    }
    if (type === "error") {
      const scope = action.scope === "alltime" ? "alltime" : "today";
      const entries = { ...state.entries, [scope]: [] };
      return {
        ...state,
        scope: action.preserveScope ? state.scope : scope,
        entries,
        loadingScope: state.loadingScope === scope ? null : state.loadingScope,
        status: action.message || "Leaderboard is temporarily unavailable.",
        needsLoad: false,
      };
    }
    if (type === "submit-success") {
      return {
        ...state,
        entries: { today: null, alltime: null },
        loadingScope: null,
        status: "Refreshing leaderboard...",
        needsLoad: true,
      };
    }
    return state;
  }

  function calculateRankButtonLayout(options) {
    const opts = options || {};
    const width = Math.max(280, Math.floor(opts.width || 390));
    const margin = Math.max(10, Math.floor(opts.margin || 16));
    const restart = opts.restartButton || {};
    const buttonWidth = Math.max(42, Math.floor(opts.buttonWidth || 54));
    const buttonHeight = Math.max(24, Math.floor(opts.buttonHeight || 30));
    const restartX = Number.isFinite(restart.x) ? restart.x : width - margin - buttonWidth;
    const restartY = Number.isFinite(restart.y) ? restart.y : Math.floor(opts.topY || 12);
    const restartWidth = Math.max(buttonWidth, Math.floor(restart.width || buttonWidth));
    const restartHeight = Math.max(26, Math.floor(restart.height || 32));
    const boardTop = Math.floor(opts.boardTop || 160);
    const x = clamp(Math.round(restartX + (restartWidth - buttonWidth) / 2), margin, width - margin - buttonWidth);
    const desiredY = restartY + restartHeight + 6;
    const maxY = boardTop - buttonHeight - 8;
    return {
      label: "Rank",
      route: LEADERBOARD_ROUTE,
      action: "open-modal",
      x,
      y: Math.floor(Math.min(desiredY, Math.max(restartY + restartHeight + 2, maxY))),
      width: buttonWidth,
      height: buttonHeight,
    };
  }

  function calculateLeaderboardModalLayout(width, height) {
    const safeWidth = Math.max(280, Math.floor(width || 390));
    const safeHeight = Math.max(280, Math.floor(height || 844));
    const compact = safeWidth < 560 || safeHeight < 760;
    const panelWidth = Math.min(compact ? 342 : 420, safeWidth - 28);
    const panelHeight = Math.min(compact ? 390 : 440, safeHeight - 58);
    const centerX = safeWidth / 2;
    const centerY = safeHeight / 2;
    const panelTop = Math.round(centerY - panelHeight / 2);
    const panelBottom = panelTop + panelHeight;
    const todayButton = { x: Math.round(centerX - 52), y: panelTop + 76, width: 86, height: 31 };
    const allTimeButton = { x: Math.round(centerX + 54), y: panelTop + 76, width: 102, height: 31 };
    const closeButton = { x: centerX, y: panelBottom - 50, width: 104, height: 38 };
    return {
      compact,
      panelWidth,
      panelHeight,
      centerX,
      centerY,
      panelTop,
      panelBottom,
      todayButton,
      allTimeButton,
      listTop: panelTop + 142,
      listBottom: panelBottom - 86,
      closeButton,
      entryLimit: compact ? 8 : 10,
    };
  }

  function calculateGameOverLeaderboardLayout(options) {
    const opts = options || {};
    const layout = opts.layout || calculateLayoutMetrics(390, 844);
    const width = Math.max(280, Math.floor(layout.width || 390));
    const height = Math.max(280, Math.floor(layout.height || 844));
    const compact = !!layout.compact;
    const centerX = width / 2;
    const centerY = height / 2;
    const submit = calculateGameOverSubmitPanelLayout({ layout });
    const headingY = Math.round(centerY - (compact ? 48 : 52));
    const tabY = headingY + 24;
    const listTop = tabY + 36;
    const listBottom = submit.top - 10;
    return {
      centerX,
      headingY,
      todayButton: { x: Math.round(centerX - 52), y: tabY, width: 76, height: 30 },
      allTimeButton: { x: Math.round(centerX + 54), y: tabY, width: 96, height: 30 },
      listTop,
      listBottom,
      entryLimit: compact ? 2 : 3,
      restartTop: submit.restartTop,
    };
  }

  function calculateGameOverPromptPanelLayout(options) {
    const opts = options || {};
    const layout = opts.layout || calculateLayoutMetrics(390, 844);
    const width = Math.max(280, Math.floor(layout.width || 390));
    const height = Math.max(280, Math.floor(layout.height || 844));
    const compact = !!layout.compact || height < 780;
    const centerX = width / 2;
    const panelWidth = Math.min(compact ? 340 : 356, width - 28);
    const preferredHeight = compact ? 430 : 456;
    const panelHeight = Math.min(preferredHeight, height - 18);
    const panelTop = Math.max(8, Math.round((height - panelHeight) / 2));
    const panelBottom = panelTop + panelHeight;
    const playAgainTop = panelBottom - (compact ? 44 : 48);
    const submitY = panelTop + (compact ? 205 : 218);
    const tabY = submitY + (compact ? 39 : 42);
    const listY = tabY + (compact ? 34 : 38);
    const statusY = Math.min(panelBottom - (compact ? 78 : 84), listY + (compact ? 54 : 62));
    return {
      compact,
      centerX,
      panelWidth,
      panelHeight,
      panelTop,
      panelBottom,
      title: { x: centerX, y: panelTop + (compact ? 13 : 16) },
      reason: { x: centerX, y: panelTop + (compact ? 42 : 48) },
      stats: { x: centerX, y: panelTop + (compact ? 67 : 76) },
      divider: { x: centerX, y: panelTop + (compact ? 154 : 166) },
      leaderboardHeading: { x: centerX, y: panelTop + (compact ? 164 : 178) },
      nickname: { x: centerX, y: panelTop + (compact ? 184 : 198) },
      submitButton: {
        x: centerX,
        y: submitY,
        height: compact ? 32 : 34,
        bottom: submitY + (compact ? 32 : 34),
      },
      todayButton: { x: Math.round(centerX - 45), y: tabY, width: 76, height: 30 },
      allTimeButton: { x: Math.round(centerX + 55), y: tabY, width: 96, height: 30 },
      leaderboardText: { x: centerX, y: listY },
      submitStatus: { x: centerX, y: statusY },
      playAgainButton: {
        x: centerX,
        y: playAgainTop,
        height: compact ? 34 : 37,
        bottom: playAgainTop + (compact ? 34 : 37),
      },
      entryLimit: compact ? 2 : 3,
    };
  }

  function calculateGameOverSubmitPanelLayout(options) {
    const opts = options || {};
    const layout = opts.layout || calculateLayoutMetrics(390, 844);
    const width = Math.max(280, Math.floor(layout.width || 390));
    const height = Math.max(280, Math.floor(layout.height || 844));
    const compact = !!layout.compact;
    const centerY = height / 2;
    const panelWidth = Math.min(330, width - 32);
    const left = Math.round((width - panelWidth) / 2) + 14;
    const gameOverDetailBottom = Math.round(centerY - (compact ? 36 : 38));
    const restartTop = Math.round(centerY + (compact ? 198 : 208));
    const visualHeight = Math.floor(opts.visualViewportHeight || height);
    const keyboardVisible = !!opts.keyboardVisible || visualHeight < height - 80;
    const visibleBottom = Math.max(240, Math.min(height, visualHeight)) - (keyboardVisible ? 8 : 10);
    const normalTop = Math.max(gameOverDetailBottom + 8, Math.round(centerY + (compact ? 18 : 24)));
    let maxHeight = Math.min(compact ? 154 : 176, Math.max(132, restartTop - normalTop - 10));
    let top = normalTop;
    if (keyboardVisible) {
      maxHeight = Math.min(maxHeight, Math.max(132, visibleBottom - 8));
      top = Math.max(8, Math.min(normalTop, visibleBottom - maxHeight));
    }
    const bottom = top + maxHeight;
    return {
      left,
      top,
      width: panelWidth - 28,
      maxHeight,
      bottom,
      visibleBottom,
      keyboardVisible,
      restartTop,
      gameOverDetailBottom,
      inputBottom: top + 50,
      submitBottom: top + 50,
    };
  }

  function isLocalDevHost(hostname) {
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  }

  function createEmptyCell() {
    return { small: null, medium: null, large: null };
  }

  function createBoard(width, height) {
    return Array.from({ length: height }, () => Array.from({ length: width }, () => createEmptyCell()));
  }

  function clonePiece(piece) {
    if (!piece) return null;
    return {
      id: piece.id || "",
      size: piece.size,
      color: Number.isFinite(piece.color) ? piece.color : 0,
    };
  }

  function normalizePiece(piece, fallbackId) {
    if (!piece || SIZES.indexOf(piece.size) === -1) return null;
    const color = Number.isFinite(piece.color) ? piece.color : 0;
    return {
      id: piece.id || fallbackId,
      size: piece.size,
      color: ((color % COLORS.length) + COLORS.length) % COLORS.length,
    };
  }

  function getAvailableColorCount(score) {
    const normalizedScore = Math.max(0, Number.parseInt(score || 0, 10) || 0);
    const unlocked = COLOR_PROGRESSION.reduce((count, step) => {
      if (normalizedScore >= step.minScore) return step.colorCount;
      return count;
    }, START_COLOR_COUNT);
    return clamp(unlocked, START_COLOR_COUNT, MAX_COLOR_COUNT);
  }

  function getCellColors(cell, sizes) {
    const seen = new Set();
    const colors = [];
    (sizes || SIZES).forEach((size) => {
      const color = cell && cell[size];
      if (color === null || color === undefined || seen.has(color)) return;
      seen.add(color);
      colors.push(color);
    });
    return colors;
  }

  function cellHasColor(cell, color, sizes) {
    return (sizes || SIZES).some((size) => cell && cell[size] === color);
  }

  function addMatchingColorRings(board, x, y, color, sizes, clearKeys) {
    (sizes || SIZES).forEach((size) => {
      if (board[y][x][size] === color) clearKeys.add(ringKey(x, y, size));
    });
  }

  function addAllColorRings(board, color, sizes, clearKeys) {
    for (let y = 0; y < board.length; y += 1) {
      for (let x = 0; x < board[y].length; x += 1) {
        addMatchingColorRings(board, x, y, color, sizes, clearKeys);
      }
    }
  }

  function collectColorBurstTargets(board, color, sizes) {
    const targets = [];
    for (let y = 0; y < board.length; y += 1) {
      for (let x = 0; x < board[y].length; x += 1) {
        (sizes || SIZES).forEach((size) => {
          if (board[y][x][size] === color) targets.push({ x, y, size, color });
        });
      }
    }
    return targets;
  }

  function buildLines() {
    const lines = [];
    for (let y = 0; y < BOARD_SIZE; y += 1) {
      lines.push({ id: `row-${y}`, cells: [[0, y], [1, y], [2, y]] });
    }
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      lines.push({ id: `column-${x}`, cells: [[x, 0], [x, 1], [x, 2]] });
    }
    lines.push({ id: "diagonal-down", cells: [[0, 0], [1, 1], [2, 2]] });
    lines.push({ id: "diagonal-up", cells: [[0, 2], [1, 1], [2, 0]] });
    return lines;
  }

  function ringKey(x, y, size) {
    return `${x},${y},${size}`;
  }

  function parseRingKey(key) {
    const [x, y, size] = key.split(",");
    return { x: Number.parseInt(x, 10), y: Number.parseInt(y, 10), size };
  }

  function uniqueCellsFromRings(rings) {
    const seen = new Set();
    const cells = [];
    rings.forEach((ring) => {
      const key = `${ring.x},${ring.y}`;
      if (seen.has(key)) return;
      seen.add(key);
      cells.push({ x: ring.x, y: ring.y });
    });
    return cells;
  }

  function getScoreForMove(clearEvents) {
    const eventCount = Math.max(0, Number.parseInt(clearEvents || 0, 10) || 0);
    const multiBonus = eventCount > 1 ? (eventCount - 1) * SCORE.multiClearBonus : 0;
    return multiBonus;
  }

  function getMoveFeedbackLabel(result, gameOver) {
    if (gameOver) return "Game over.";
    const move = result || {};
    const scoreDelta = Math.max(0, Number.parseInt(move.scoreDelta || 0, 10) || 0);
    const clearEvents = Math.max(0, Number.parseInt(move.clearEvents || 0, 10) || 0);
    const lineClears = Math.max(0, Number.parseInt(move.lineClears || 0, 10) || 0);
    const cellBonuses = Math.max(0, Number.parseInt(move.cellBonuses || 0, 10) || 0);
    const colorBursts = Math.max(0, Number.parseInt(move.colorBursts || 0, 10) || 0);
    if (clearEvents > 1) return `Combo clear +${scoreDelta}`;
    if (colorBursts > 0) return `Color Burst +${scoreDelta}`;
    if (cellBonuses > 0) return `Cell bonus +${scoreDelta}`;
    if (lineClears > 0) return `Line clear +${scoreDelta}`;
    return `Placed +${scoreDelta}`;
  }

  function createSoundState(options) {
    const opts = options || {};
    return {
      enabled: SOUND_DEFAULT_ENABLED,
      userActivated: false,
      available: opts.available !== false,
      blocked: false,
      storedPreference: !!opts.storedPreference,
    };
  }

  function getSoundButtonLabel(soundState) {
    return soundState && soundState.enabled ? "Sound On" : "Sound Off";
  }

  function resolveSoundToggleState(soundState, action) {
    const state = {
      ...createSoundState(),
      ...(soundState || {}),
    };
    const request = action || {};
    if (!request.userGesture) {
      return {
        ...state,
        enabled: false,
        userActivated: false,
      };
    }
    if (state.enabled) {
      return {
        ...state,
        enabled: false,
        userActivated: true,
      };
    }
    if (!state.available || !request.audioReady) {
      return {
        ...state,
        enabled: false,
        userActivated: true,
        blocked: true,
      };
    }
    return {
      ...state,
      enabled: true,
      userActivated: true,
      blocked: false,
    };
  }

  function getSoundCueSpec(eventName) {
    if (!Object.prototype.hasOwnProperty.call(SOUND_CUES, eventName)) return null;
    return { ...SOUND_CUES[eventName] };
  }

  function formatScore(value) {
    const score = Math.max(0, Number.parseInt(value || 0, 10) || 0);
    return score.toLocaleString("en-US");
  }

  function formatCompactScore(value) {
    const score = Math.max(0, Number.parseInt(value || 0, 10) || 0);
    if (score >= 1000000) return `${Math.floor(score / 100000) / 10}M`;
    if (score >= 10000) return `${Math.floor(score / 100) / 10}K`;
    return formatScore(score);
  }

  function hexToNumber(hex) {
    return Number.parseInt(String(hex).replace("#", ""), 16);
  }

  function getVisualViewportSize(customWindow) {
    const targetWindow = customWindow || (typeof window !== "undefined" ? window : null);
    if (!targetWindow) return { width: 390, height: 844 };
    const viewport = targetWindow.visualViewport;
    const doc = targetWindow.document && targetWindow.document.documentElement;
    const width = Math.floor((viewport && viewport.width) || targetWindow.innerWidth || (doc && doc.clientWidth) || 390);
    const height = Math.floor((viewport && viewport.height) || targetWindow.innerHeight || (doc && doc.clientHeight) || 844);
    return {
      width: Math.max(280, width),
      height: Math.max(280, height),
    };
  }

  function syncCssViewportSize(customWindow) {
    const targetWindow = customWindow || (typeof window !== "undefined" ? window : null);
    const size = getVisualViewportSize(targetWindow);
    const doc = targetWindow && targetWindow.document && targetWindow.document.documentElement;
    if (doc && doc.style) {
      doc.style.setProperty("--ringzzle-viewport-width", `${size.width}px`);
      doc.style.setProperty("--ringzzle-viewport-height", `${size.height}px`);
      doc.style.setProperty("--ringzzle-visible-height", `${size.height}px`);
    }
    return size;
  }

  function getGameSurfaceSize() {
    const size = syncCssViewportSize();
    return {
      width: Math.max(280, Math.floor(size.width)),
      height: Math.max(280, Math.floor(size.height)),
    };
  }

  function shouldShowPortraitPrompt(size) {
    const width = Math.floor((size && size.width) || 0);
    const height = Math.floor((size && size.height) || 0);
    return width > height && height < 560 && width < 1000;
  }

  function getDragPlacementCell(pointer, layout, lift) {
    if (!pointer || !layout || !layout.boardOrigin || !layout.cellSize) return null;
    const offset = lift || { x: 0, y: 0 };
    const centerX = pointer.x + (offset.x || 0);
    const centerY = pointer.y + (offset.y || 0);
    const x = Math.floor((centerX - layout.boardOrigin.x) / layout.cellSize);
    const y = Math.floor((centerY - layout.boardOrigin.y) / layout.cellSize);
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return null;
    return { x, y };
  }

  function calculateLayoutMetrics(width, height) {
    const compact = width < 560 || height < 760;
    const realSafariCompact = width < 560;
    const short = height < 700;
    const tiny = height < 620;
    const margin = clamp(Math.floor(width * 0.045), 14, compact ? 20 : 28);
    const headerBottom = realSafariCompact ? (tiny ? 92 : short ? 102 : 106) : short ? 124 : compact ? 138 : 152;
    const trayGap = realSafariCompact ? (tiny ? 18 : 28) : tiny ? 12 : compact ? 18 : 24;
    const trayHeight = realSafariCompact ? (tiny ? 76 : 88) : tiny ? 88 : compact ? 104 : 116;
    const statusHeight = realSafariCompact ? (tiny ? 20 : 22) : tiny ? 22 : compact ? 26 : 32;
    const bottomGap = realSafariCompact ? (tiny ? 64 : 72) : compact ? 32 : 24;
    const availableWidth = width - margin * 2;
    const availableHeight = height - headerBottom - trayGap - trayHeight - statusHeight - bottomGap;
    const boardSize = clamp(
      Math.floor(Math.min(availableWidth, availableHeight, compact ? 360 : 430)),
      Math.min(238, Math.max(180, availableWidth)),
      Math.max(180, availableWidth)
    );
    const cellSize = Math.floor(boardSize / BOARD_SIZE);
    const resolvedBoardSize = cellSize * BOARD_SIZE;
    const verticalExtra = Math.max(0, availableHeight - resolvedBoardSize);
    const naturalBoardY = headerBottom + Math.min(verticalExtra * 0.25, compact ? 18 : 28);
    const desiredBoardY = realSafariCompact ? Math.max(naturalBoardY, tiny ? 126 : 156) : naturalBoardY;
    const maxBoardY = height - bottomGap - trayHeight - trayGap - resolvedBoardSize;
    const boardY = Math.floor(Math.min(desiredBoardY, Math.max(headerBottom, maxBoardY)));
    const trayY = boardY + resolvedBoardSize + trayGap;
    const slotGap = compact ? 8 : 12;
    const slotWidth = Math.floor(Math.min(compact ? 108 : 132, (availableWidth - slotGap * 2) / TRAY_SIZE));
    const trayPieceSize = Math.floor(Math.min(slotWidth * 0.72, trayHeight * 0.72));
    const largestTrayRingDiameter = cellSize * getRingRadiusRatio("large") * 2;
    const trayRingBottom = trayY + trayHeight / 2 + largestTrayRingDiameter / 2;
    const lowerStatusY = Math.max(trayY + trayHeight - 6, trayRingBottom + 4);
    const statusY = Math.ceil(clamp(
      lowerStatusY,
      trayY + trayHeight - 6,
      height - statusHeight - 8
    ));

    return {
      width,
      height,
      margin,
      compact,
      short,
      tiny,
      topY: tiny ? 8 : compact ? 12 : 18,
      headerBottom,
      trayGap,
      trayHeight,
      statusHeight,
      bottomGap,
      availableWidth,
      availableHeight,
      boardOrigin: {
        x: Math.floor((width - resolvedBoardSize) / 2),
        y: boardY,
      },
      boardSize: resolvedBoardSize,
      cellSize,
      trayY,
      slotWidth,
      slotGap,
      trayPieceSize,
      statusY,
    };
  }

  function calculateHeaderMetrics(layout) {
    const width = Math.floor((layout && layout.width) || 390);
    const margin = Math.floor((layout && layout.margin) || clamp(Math.floor(width * 0.045), 14, 20));
    const compact = !!(layout && layout.compact);
    const short = !!(layout && layout.short);
    const tiny = !!(layout && layout.tiny);
    const topY = Math.floor((layout && layout.topY) || (tiny ? 8 : compact ? 12 : 18));
    const titleFontSize = tiny ? 24 : compact ? 28 : 36;
    const subtitleFontSize = tiny ? 10 : compact ? 11 : 14;
    const subtitleY = topY + (tiny ? 28 : compact ? 34 : 44);
    const subtitleLineHeight = Math.ceil(subtitleFontSize * 1.28);
    const subtitleLines = compact ? 1 : 2;
    const subtitleBottom = subtitleY + subtitleLineHeight * subtitleLines;
    const chipY = tiny ? 82 : short ? 94 : compact ? 104 : 112;
    const chipHeight = tiny ? 26 : compact ? 30 : 36;
    const chipTop = chipY - chipHeight / 2;
    const chipBottom = chipY + chipHeight / 2;
    const chipGap = compact ? 6 : 9;
    const availableWidth = Math.floor((layout && layout.availableWidth) || (width - margin * 2));
    const chipWidth = Math.floor(Math.min(compact ? 110 : 132, (availableWidth - chipGap * 2) / 3));

    return {
      titleFontSize,
      subtitleFontSize,
      subtitleY,
      subtitleLineHeight,
      subtitleLines,
      subtitleBottom,
      chipY,
      chipHeight,
      chipTop,
      chipBottom,
      chipGap,
      chipWidth,
    };
  }

  function getBoardTrayVisualGap(layout) {
    if (!layout || !layout.boardOrigin) return 0;
    const boardBottom = layout.boardOrigin.y + layout.boardSize;
    const panelPad = Math.max(12, Math.floor(layout.cellSize * 0.085));
    const rackPadY = Math.max(8, Math.floor(layout.trayHeight * 0.075));
    return layout.trayY - rackPadY - (boardBottom + panelPad);
  }

  function getScoreBoardVisualGap(layout) {
    if (!layout || !layout.boardOrigin) return 0;
    const header = calculateHeaderMetrics(layout);
    const panelPad = Math.max(12, Math.floor(layout.cellSize * 0.085));
    return layout.boardOrigin.y - panelPad - header.chipBottom;
  }

  function getLineCellsById(lineId) {
    return buildLines().find((line) => line.id === lineId) || null;
  }

  function calculateLineIndicatorGeometry(lineEvent, layout) {
    const line = getLineCellsById(lineEvent && lineEvent.id);
    if (!line || !layout || !layout.boardOrigin || !layout.cellSize) return null;
    const first = line.cells[0];
    const last = line.cells[line.cells.length - 1];
    const center = ([x, y]) => ({
      x: layout.boardOrigin.x + (x + 0.5) * layout.cellSize,
      y: layout.boardOrigin.y + (y + 0.5) * layout.cellSize,
    });
    const start = center(first);
    const end = center(last);
    let orientation = "horizontal";
    if (line.id.indexOf("column-") === 0) orientation = "vertical";
    if (line.id === "diagonal-down") orientation = "diagonal-down";
    if (line.id === "diagonal-up") orientation = "diagonal-up";
    return {
      id: line.id,
      orientation,
      color: Number.isFinite(lineEvent && lineEvent.color) ? lineEvent.color : 0,
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
      duration: LINE_INDICATOR_DURATION,
    };
  }

  function calculateCellCenter(layout, x, y) {
    return {
      x: layout.boardOrigin.x + (x + 0.5) * layout.cellSize,
      y: layout.boardOrigin.y + (y + 0.5) * layout.cellSize,
    };
  }

  function getRingRadiusRatio(sizeName) {
    if (sizeName === "small") return 0.2;
    if (sizeName === "medium") return 0.31;
    return 0.42;
  }

  function calculateTrayRingRenderMetrics(layout) {
    if (!layout || !Number.isFinite(layout.slotWidth) || !Number.isFinite(layout.trayHeight)) {
      return {
        hitBoxSize: 0,
        ringCellSize: 0,
        dragRingCellSize: 0,
        boardRingCellSize: 0,
        largestRingDiameter: 0,
        margin: 0,
        ringScale: TRAY_RING_RENDER_SCALE,
        dragRingScale: TRAY_RING_RENDER_SCALE,
        slotWidth: 0,
        trayHeight: 0,
        radiusBySize: {},
      };
    }
    const hitBoxSize = Math.floor(Math.min(layout.slotWidth, layout.trayHeight) * 0.9);
    const boardRingCellSize = Math.floor(layout.cellSize);
    const ringCellSize = boardRingCellSize;
    const largestRingDiameter = ringCellSize * getRingRadiusRatio("large") * 2;
    const radiusBySize = {};
    SIZES.forEach((sizeName) => {
      const radius = ringCellSize * getRingRadiusRatio(sizeName);
      radiusBySize[sizeName] = {
        tray: radius,
        drag: radius,
        board: boardRingCellSize * getRingRadiusRatio(sizeName),
      };
    });
    return {
      hitBoxSize,
      ringCellSize,
      dragRingCellSize: ringCellSize,
      boardRingCellSize,
      largestRingDiameter,
      margin: (Math.min(layout.slotWidth, layout.trayHeight + 22) - largestRingDiameter) / 2,
      ringScale: TRAY_RING_RENDER_SCALE,
      dragRingScale: TRAY_RING_RENDER_SCALE,
      slotWidth: layout.slotWidth,
      trayHeight: layout.trayHeight,
      radiusBySize,
    };
  }

  function calculateColorBurstCueGeometry(colorBurstEvent, layout) {
    if (!colorBurstEvent || !layout || !layout.boardOrigin || !layout.cellSize) return null;
    const sourceCell = colorBurstEvent.source || { x: colorBurstEvent.x, y: colorBurstEvent.y };
    if (!Number.isFinite(sourceCell.x) || !Number.isFinite(sourceCell.y)) return null;
    const boardLeft = layout.boardOrigin.x;
    const boardTop = layout.boardOrigin.y;
    const boardRight = boardLeft + layout.boardSize;
    const boardBottom = boardTop + layout.boardSize;
    const source = calculateCellCenter(layout, sourceCell.x, sourceCell.y);
    const targets = Array.isArray(colorBurstEvent.targets) ? colorBurstEvent.targets : [];
    const targetPulses = targets
      .filter((target) => target && Number.isFinite(target.x) && Number.isFinite(target.y))
      .map((target) => {
        const center = calculateCellCenter(layout, target.x, target.y);
        return {
          cellX: target.x,
          cellY: target.y,
          size: target.size,
          color: target.color,
          x: clamp(center.x, boardLeft, boardRight),
          y: clamp(center.y, boardTop, boardBottom),
          radius: layout.cellSize * getRingRadiusRatio(target.size),
        };
      });
    const links = targetPulses
      .filter((target) => target.cellX !== sourceCell.x || target.cellY !== sourceCell.y)
      .map((target) => ({
        color: Number.isFinite(colorBurstEvent.color) ? colorBurstEvent.color : 0,
        x1: clamp(source.x, boardLeft, boardRight),
        y1: clamp(source.y, boardTop, boardBottom),
        x2: target.x,
        y2: target.y,
      }));

    return {
      color: Number.isFinite(colorBurstEvent.color) ? colorBurstEvent.color : 0,
      duration: COLOR_BURST_EFFECT_DURATION,
      source: {
        cellX: sourceCell.x,
        cellY: sourceCell.y,
        x: clamp(source.x, boardLeft, boardRight),
        y: clamp(source.y, boardTop, boardBottom),
      },
      links,
      targetPulses,
    };
  }

  function resolveDragCleanupState(currentState, action) {
    const state = {
      activeGhostId: currentState && currentState.activeGhostId ? currentState.activeGhostId : null,
      returning: !!(currentState && currentState.returning),
      returnTweenId: currentState && currentState.returnTweenId ? currentState.returnTweenId : null,
    };
    const cleanupGhostIds = [];
    const cleanupTweenIds = [];
    const type = action && action.type;

    const clearExisting = () => {
      if (state.activeGhostId) cleanupGhostIds.push(state.activeGhostId);
      if (state.returnTweenId) cleanupTweenIds.push(state.returnTweenId);
      state.activeGhostId = null;
      state.returning = false;
      state.returnTweenId = null;
    };

    if (type === "start") {
      clearExisting();
      state.activeGhostId = action && action.ghostId ? action.ghostId : null;
      return { state, cleanupGhostIds, cleanupTweenIds };
    }

    if (type === "return") {
      state.returning = true;
      state.returnTweenId = action && action.tweenId ? action.tweenId : state.returnTweenId;
      return { state, cleanupGhostIds, cleanupTweenIds };
    }

    if (type === "valid-drop" || type === "invalid-complete" || type === "cancel") {
      clearExisting();
      return { state, cleanupGhostIds, cleanupTweenIds };
    }

    return { state, cleanupGhostIds, cleanupTweenIds };
  }

  class Game {
    constructor(options) {
      const opts = options || {};
      this.width = opts.width || BOARD_SIZE;
      this.height = opts.height || BOARD_SIZE;
      this.traySize = opts.traySize || TRAY_SIZE;
      this.sizes = SIZES.slice();
      this.colors = COLORS.slice();
      this.rng = opts.rng || Math.random;
      this.storage = opts.storage || (typeof window !== "undefined" ? window.localStorage : null);
      this.todayProvider = opts.todayProvider || (() => new Date());
      this.board = createBoard(this.width, this.height);
      this.score = 0;
      this.gameOver = false;
      this.bestClearThisGame = 0;
      this.totalLineClearsThisGame = 0;
      this.totalColorBurstsThisGame = 0;
      this.completedStatsSaved = false;
      this.completedGamePreviousStats = null;
      this.stats = loadStats(this.storage, this.todayProvider);
      this.highScore = this.stats.highScore;
      this.availableColorCount = getAvailableColorCount(this.score);
      this.pieceSequence = 0;
      this.tray = [];
      this.refillTray();
    }

    randomIndex(max) {
      return Math.max(0, Math.min(max - 1, Math.floor(this.rng() * max)));
    }

    updateAvailableColorCount() {
      this.availableColorCount = getAvailableColorCount(this.score);
      return this.availableColorCount;
    }

    createRandomPiece() {
      const sequence = this.pieceSequence;
      this.pieceSequence += 1;
      const size = this.sizes[this.randomIndex(this.sizes.length)];
      const availableColorCount = this.updateAvailableColorCount();
      const color = (this.randomIndex(availableColorCount) + sequence) % availableColorCount;
      return {
        id: `piece-${sequence}`,
        size,
        color,
      };
    }

    refillTray() {
      this.tray = Array.from({ length: this.traySize }, () => this.createRandomPiece());
      this.checkGameOver();
    }

    allTraySlotsEmpty() {
      return this.tray.every((piece) => !piece);
    }

    isInside(x, y) {
      return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    getPlacementFailureReason(piece, x, y) {
      const resolvedPiece = normalizePiece(piece, "candidate");
      if (!resolvedPiece) return "invalid-piece";
      if (!this.isInside(x, y)) return "out-of-bounds";
      if (this.board[y][x][resolvedPiece.size] !== null) return "occupied-size";
      return "";
    }

    canPlacePiece(piece, x, y) {
      return this.getPlacementFailureReason(piece, x, y) === "";
    }

    canPlaceAny(piece) {
      if (!piece) return false;
      for (let y = 0; y < this.height; y += 1) {
        for (let x = 0; x < this.width; x += 1) {
          if (this.canPlacePiece(piece, x, y)) return true;
        }
      }
      return false;
    }

    canPlaceAnyTrayPiece() {
      return this.tray.some((piece) => this.canPlaceAny(piece));
    }

    saveHighScore() {
      if (this.score <= this.highScore) return;
      this.highScore = this.score;
      this.stats.highScore = this.highScore;
      if (!this.storage) return;
      try {
        this.storage.setItem(STORAGE_KEYS.highScore, String(this.highScore));
      } catch (error) {
        // High score storage is local and optional.
      }
    }

    resolveClears() {
      const clearKeys = new Set();
      const lineEvents = [];
      const cellEvents = [];
      const colorBurstEvents = [];

      buildLines().forEach((line) => {
        const firstCell = line.cells[0];
        const candidateColors = getCellColors(this.board[firstCell[1]][firstCell[0]], this.sizes);
        candidateColors.forEach((color) => {
          const matchesLine = line.cells.every(([x, y]) => cellHasColor(this.board[y][x], color, this.sizes));
          if (!matchesLine) return;
          lineEvents.push({ type: "line", id: line.id, color });
          line.cells.forEach(([x, y]) => addMatchingColorRings(this.board, x, y, color, this.sizes, clearKeys));
        });
      });

      for (let y = 0; y < this.height; y += 1) {
        for (let x = 0; x < this.width; x += 1) {
          const values = this.sizes.map((size) => this.board[y][x][size]);
          if (values.every((value) => value !== null) && values.every((value) => value === values[0])) {
            const color = values[0];
            const event = {
              type: "color-burst",
              id: `cell-${x}-${y}`,
              color,
              x,
              y,
              source: { x, y },
              targets: collectColorBurstTargets(this.board, color, this.sizes),
            };
            cellEvents.push(event);
            colorBurstEvents.push(event);
            addAllColorRings(this.board, color, this.sizes, clearKeys);
          }
        }
      }

      const rings = Array.from(clearKeys).map(parseRingKey);
      rings.forEach((ring) => {
        this.board[ring.y][ring.x][ring.size] = null;
      });

      return {
        lineClears: lineEvents.length,
        cellBonuses: cellEvents.length,
        colorBursts: colorBurstEvents.length,
        clearEvents: lineEvents.length + colorBurstEvents.length,
        clearedRings: rings.length,
        rings,
        cells: uniqueCellsFromRings(rings),
        lineEvents,
        cellEvents,
        colorBurstEvents,
      };
    }

    place(piece, x, y) {
      if (this.gameOver) {
        return { placed: false, reason: "game-over", failureReason: "game-over" };
      }
      const resolvedPiece = normalizePiece(piece, "candidate");
      const reason = this.getPlacementFailureReason(resolvedPiece, x, y);
      if (reason) {
        return { placed: false, reason, failureReason: reason };
      }

      this.board[y][x][resolvedPiece.size] = resolvedPiece.color;
      const clearResult = this.resolveClears();
      const scoreDelta = SCORE.placement
        + clearResult.lineClears * SCORE.lineClear
        + clearResult.cellBonuses * SCORE.cellBonus
        + getScoreForMove(clearResult.clearEvents);

      this.score += scoreDelta;
      this.updateAvailableColorCount();
      this.bestClearThisGame = Math.max(this.bestClearThisGame, clearResult.clearEvents);
      this.totalLineClearsThisGame += clearResult.lineClears;
      this.totalColorBurstsThisGame += clearResult.colorBursts;
      this.saveHighScore();

      return {
        placed: true,
        scoreDelta,
        placedRing: { x, y, size: resolvedPiece.size, color: resolvedPiece.color },
        ...clearResult,
      };
    }

    placeTrayPiece(slotIndex, x, y) {
      if (slotIndex < 0 || slotIndex >= this.tray.length) {
        return { placed: false, reason: "tray-slot", failureReason: "tray-slot" };
      }
      const piece = this.tray[slotIndex];
      if (!piece) {
        return { placed: false, reason: "empty-tray", failureReason: "empty-tray" };
      }
      const result = this.place(piece, x, y);
      if (!result.placed) return result;
      this.tray[slotIndex] = null;
      if (this.allTraySlotsEmpty()) {
        this.refillTray();
      } else {
        this.checkGameOver();
      }
      return result;
    }

    checkGameOver() {
      this.gameOver = !this.canPlaceAnyTrayPiece();
      if (this.gameOver) this.recordCompletedGameStats();
      return this.gameOver;
    }

    recordCompletedGameStats() {
      if (this.completedStatsSaved) return this.stats;
      const todayKey = getTodayKey(this.todayProvider());
      const previous = loadStats(this.storage, this.todayProvider);
      this.completedGamePreviousStats = { ...previous };
      this.stats = completeStats(previous, this.score, this.bestClearThisGame, todayKey);
      this.highScore = this.stats.highScore;
      saveStats(this.storage, this.stats);
      this.completedStatsSaved = true;
      return this.stats;
    }

    restart() {
      this.board = createBoard(this.width, this.height);
      this.score = 0;
      this.gameOver = false;
      this.bestClearThisGame = 0;
      this.totalLineClearsThisGame = 0;
      this.totalColorBurstsThisGame = 0;
      this.completedStatsSaved = false;
      this.completedGamePreviousStats = null;
      this.stats = loadStats(this.storage, this.todayProvider);
      this.highScore = this.stats.highScore;
      this.availableColorCount = getAvailableColorCount(this.score);
      this.pieceSequence = 0;
      this.tray = [];
      this.refillTray();
    }
  }

  const SceneBase = root && root.Phaser ? root.Phaser.Scene : class {};

  class RingzzleScene extends SceneBase {
    constructor() {
      super("RingzzleScene");
      this.gameModel = null;
      this.layout = null;
      this.dragState = null;
      this.dragReturnTween = null;
      this.dragVisualState = null;
      this.dragGhostSerial = 0;
      this.previewCell = null;
      this.clearFlashCells = [];
      this.invalidFlashCell = null;
      this.scorePopItems = [];
      this.lineIndicatorItems = [];
      this.colorBurstItems = [];
      this.leaderboardOverlayItems = [];
      this.leaderboardViewState = resolveLeaderboardViewState(null, { type: "close" });
      this.leaderboardRequestIds = { today: 0, alltime: 0 };
      this.trayOrigins = [];
      this.resizeFrame = 0;
      this.resizeTimers = [];
      this.viewportResizeHandler = null;
      this.orientationResizeHandler = null;
      this.visibilityChangeHandler = null;
      this.windowBlurHandler = null;
      this.portraitPromptItems = [];
      this.portraitPromptActive = false;
      this.soundState = createSoundState();
      this.audioContext = null;
      this.lastSoundAt = 0;
      this.domSoundButton = null;
      this.domSoundButtonHandler = null;
      this.domSubmitPanel = null;
      this.domNicknameInput = null;
      this.domSubmitButton = null;
      this.domSubmitMessage = null;
      this.domSubmitHandler = null;
      this.domNicknameFocusHandler = null;
      this.domNicknameBlurHandler = null;
      this.domForceGameOverHandler = null;
      this.leaderboardSubmitState = resolveLeaderboardSubmitState(null, { type: "hide" });
      this.currentGameOverScore = null;
    }

    create() {
      this.gameModel = new Game();
      this.cameras.main.setBackgroundColor("#060b12");
      this.buildStaticUi();
      this.input.on("pointermove", this.handlePointerMove, this);
      this.input.on("pointerup", this.handlePointerUp, this);
      this.input.on("pointerupoutside", this.handlePointerCancel, this);
      this.input.on("gameout", this.handlePointerCancel, this);
      this.addViewportListeners();
      this.scheduleViewportResize();
      this.events.once("shutdown", () => this.removeViewportListeners());
    }

    textStyle(size, color, weight, align) {
      return {
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        fontSize: `${size}px`,
        fontStyle: weight || "600",
        color,
        align: align || "left",
      };
    }

    buildStaticUi() {
      this.titleText = this.add.text(0, 0, "Ringzzle", this.textStyle(34, "#f6fbff", "900"));
      this.titleText.setShadow(0, 2, "#000000", 4, false, true);
      this.subtitleText = this.add.text(
        0,
        0,
        "Free color rings puzzle game. No install. Just play.",
        this.textStyle(14, "#bfd1dc", "650")
      );
      this.metricBacks = Array.from({ length: 3 }, () => this.add.rectangle(0, 0, 100, 34, 0x101f2e, 0.96));
      this.metricTexts = Array.from({ length: 3 }, () => this.add.text(0, 0, "", this.textStyle(12, "#f6fbff", "850")));
      this.statusText = this.add.text(0, 0, "", this.textStyle(13, "#bfd1dc", "750"));
      this.restartButton = this.add.text(0, 0, "Restart", this.textStyle(13, "#f6fbff", "850"))
        .setPadding(12, 7)
        .setBackgroundColor("#173447")
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.restartGame());
      this.rankButton = this.add.text(0, 0, "Rank", this.textStyle(12, "#f6fbff", "850"))
        .setPadding(9, 6)
        .setBackgroundColor("#102839")
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.openLeaderboardOverlay());
      this.soundButton = this.add.text(0, 0, getSoundButtonLabel(this.soundState), this.textStyle(13, "#f6fbff", "850"))
        .setPadding(12, 7)
        .setBackgroundColor("#102839")
        .setAlpha(0);
      if (typeof document !== "undefined") {
        this.domSoundButton = document.getElementById("ringzzle-sound-toggle");
        if (this.domSoundButton) {
          this.domSoundButtonHandler = () => this.toggleSound();
          this.domSoundButton.addEventListener("click", this.domSoundButtonHandler);
          document.documentElement.dataset.ringzzleSoundDomButtonReady = "true";
        }
        this.buildLeaderboardSubmitDom();
        if (isLocalDevHost(document.location && document.location.hostname)) {
          this.domForceGameOverHandler = (event) => {
            const detail = (event && event.detail) || {};
            this.gameModel.score = Math.max(0, Number.parseInt(detail.score || 420, 10) || 420);
            this.gameModel.bestClearThisGame = Math.max(0, Number.parseInt(detail.bestClear || 2, 10) || 2);
            this.gameModel.totalLineClearsThisGame = Math.max(0, Number.parseInt(detail.lineClears || 5, 10) || 5);
            this.gameModel.totalColorBurstsThisGame = Math.max(0, Number.parseInt(detail.colorBursts || 1, 10) || 1);
            this.gameModel.availableColorCount = clamp(Number.parseInt(detail.maxUnlockedColors || 4, 10) || 4, START_COLOR_COUNT, MAX_COLOR_COUNT);
            this.gameModel.gameOver = true;
            this.gameModel.recordCompletedGameStats();
            this.render();
          };
          document.addEventListener("ringzzle-force-game-over", this.domForceGameOverHandler);
        }
      }

      this.boardLayer = this.add.container(0, 0).setDepth(10);
      this.trayLayer = this.add.container(0, 0).setDepth(20);
      this.lineIndicatorLayer = this.add.container(0, 0).setDepth(62);
      this.feedbackLayer = this.add.container(0, 0).setDepth(70);
      this.gameOverLayer = this.add.container(0, 0).setDepth(90);
      this.leaderboardLayer = this.add.container(0, 0).setDepth(100);
    }

    buildLeaderboardSubmitDom() {
      if (typeof document === "undefined") return;
      const legacyPanel = document.getElementById("ringzzle-leaderboard-submit");
      if (legacyPanel) legacyPanel.hidden = true;
      document.documentElement.dataset.ringzzleLeaderboardSubmitDomReady = "false";
      document.documentElement.dataset.ringzzleLeaderboardNicknameEntryMode = LEADERBOARD_NICKNAME_ENTRY_MODE;
    }

    addViewportListeners() {
      if (typeof window === "undefined") return;
      this.viewportResizeHandler = () => this.scheduleViewportResize({ reason: "viewport" });
      this.orientationResizeHandler = () => this.scheduleViewportResize({ reason: "orientation", cancelDrag: true });
      this.visibilityChangeHandler = () => {
        if (document.visibilityState === "hidden") this.clearActiveDragVisual("visibilitychange");
      };
      this.windowBlurHandler = () => this.clearActiveDragVisual("window-blur");
      window.addEventListener("resize", this.viewportResizeHandler, { passive: true });
      window.addEventListener("orientationchange", this.orientationResizeHandler, { passive: true });
      window.addEventListener("blur", this.windowBlurHandler, { passive: true });
      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", this.visibilityChangeHandler, { passive: true });
      }
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", this.viewportResizeHandler, { passive: true });
        window.visualViewport.addEventListener("scroll", this.viewportResizeHandler, { passive: true });
      }
    }

    removeViewportListeners() {
      if (typeof window !== "undefined" && this.viewportResizeHandler) {
        window.removeEventListener("resize", this.viewportResizeHandler);
        if (this.orientationResizeHandler) window.removeEventListener("orientationchange", this.orientationResizeHandler);
        if (this.windowBlurHandler) window.removeEventListener("blur", this.windowBlurHandler);
        if (typeof document !== "undefined" && this.visibilityChangeHandler) {
          document.removeEventListener("visibilitychange", this.visibilityChangeHandler);
        }
        if (window.visualViewport) {
          window.visualViewport.removeEventListener("resize", this.viewportResizeHandler);
          window.visualViewport.removeEventListener("scroll", this.viewportResizeHandler);
        }
        if (this.resizeFrame) window.cancelAnimationFrame(this.resizeFrame);
      }
      this.clearActiveDragVisual("shutdown", { render: false });
      this.clearViewportRelayoutTimers();
      if (this.domSoundButton && this.domSoundButtonHandler) {
        this.domSoundButton.removeEventListener("click", this.domSoundButtonHandler);
      }
      if (this.domSubmitButton && this.domSubmitHandler) {
        this.domSubmitButton.removeEventListener("click", this.domSubmitHandler);
      }
      if (this.domNicknameInput && this.domNicknameFocusHandler) {
        this.domNicknameInput.removeEventListener("focus", this.domNicknameFocusHandler);
      }
      if (this.domNicknameInput && this.domNicknameBlurHandler) {
        this.domNicknameInput.removeEventListener("blur", this.domNicknameBlurHandler);
      }
      if (this.domSubmitPanel && this.domSubmitPanel.parentNode) {
        this.domSubmitPanel.parentNode.removeChild(this.domSubmitPanel);
      }
      if (typeof document !== "undefined" && this.domForceGameOverHandler) {
        document.removeEventListener("ringzzle-force-game-over", this.domForceGameOverHandler);
      }
      this.domSoundButton = null;
      this.domSoundButtonHandler = null;
      this.domSubmitPanel = null;
      this.domNicknameInput = null;
      this.domSubmitButton = null;
      this.domSubmitMessage = null;
      this.domSubmitHandler = null;
      this.domNicknameFocusHandler = null;
      this.domNicknameBlurHandler = null;
      this.domForceGameOverHandler = null;
    }

    clearViewportRelayoutTimers() {
      if (typeof window === "undefined") {
        this.resizeTimers = [];
        return;
      }
      this.resizeTimers.forEach((timerId) => window.clearTimeout(timerId));
      this.resizeTimers = [];
    }

    scheduleViewportResize(options) {
      if (typeof window === "undefined") {
        this.resizeLayout();
        return;
      }
      const opts = options || {};
      if (opts.cancelDrag) this.cancelActiveDragForRelayout();
      this.clearViewportRelayoutTimers();
      ORIENTATION_RECOVERY_DELAYS.forEach((delay) => {
        if (delay === 0) {
          this.queueViewportRelayout();
          return;
        }
        this.resizeTimers.push(window.setTimeout(() => this.queueViewportRelayout(), delay));
      });
    }

    queueViewportRelayout() {
      if (typeof window === "undefined") {
        this.performViewportRelayout();
        return;
      }
      if (this.resizeFrame) window.cancelAnimationFrame(this.resizeFrame);
      this.resizeFrame = window.requestAnimationFrame(() => {
        this.resizeFrame = 0;
        this.performViewportRelayout();
      });
    }

    performViewportRelayout() {
      const size = getGameSurfaceSize();
      if (this.scale && typeof this.scale.resize === "function") {
        this.scale.resize(size.width, size.height);
      }
      this.resizeLayout();
    }

    resizeLayout() {
      const width = this.scale.width;
      const height = this.scale.height;
      this.layout = calculateLayoutMetrics(width, height);
      this.clearLineIndicators();

      const {
        availableWidth,
        compact,
        margin,
        short,
        tiny,
        topY,
      } = this.layout;

      const header = calculateHeaderMetrics(this.layout);
      this.titleText.setFontSize(header.titleFontSize);
      this.subtitleText.setText(compact ? "Free color rings puzzle game." : "Free color rings puzzle game. No install. Just play.");
      this.subtitleText.setFontSize(header.subtitleFontSize);
      this.titleText.setPosition(margin, topY);
      this.subtitleText.setPosition(margin, header.subtitleY);

      const chipY = header.chipY;
      const chipGap = header.chipGap;
      const chipHeight = header.chipHeight;
      const chipWidth = header.chipWidth;
      let chipX = margin;
      this.metricBacks.forEach((back) => {
        back.setSize(chipWidth, chipHeight);
        back.setPosition(chipX + chipWidth / 2, chipY);
        back.setStrokeStyle(1, 0x35e6d0, 0.18);
        chipX += chipWidth + chipGap;
      });
      this.metricTexts.forEach((text, index) => {
        text.setFontSize(tiny ? 10 : compact ? 11 : 12);
        text.setPosition(margin + index * (chipWidth + chipGap) + 9, chipY - (tiny ? 7 : 8));
      });

      this.restartButton.setFontSize(tiny ? 12 : compact ? 13 : 14);
      this.restartButton.setPadding(compact ? 10 : 14, compact ? 7 : 8);
      this.rankButton.setFontSize(tiny ? 11 : compact ? 12 : 13);
      this.rankButton.setPadding(compact ? 8 : 10, compact ? 6 : 7);
      this.soundButton.setFontSize(tiny ? 11 : compact ? 12 : 13);
      this.soundButton.setPadding(compact ? 9 : 12, compact ? 7 : 8);
      this.updateSoundButton();
      const buttonGap = compact ? 7 : 9;
      const restartX = width - this.restartButton.width - margin;
      const soundX = Math.max(margin, restartX - this.soundButton.width - buttonGap);
      this.restartButton.setPosition(restartX, topY + 2);
      this.soundButton.setPosition(soundX, topY + 2);
      const rankLayout = calculateRankButtonLayout({
        width,
        margin,
        topY,
        restartButton: {
          x: this.restartButton.x,
          y: this.restartButton.y,
          width: this.restartButton.width,
          height: this.restartButton.height,
        },
        buttonWidth: this.rankButton.width,
        buttonHeight: this.rankButton.height,
        boardTop: this.layout.boardOrigin.y,
      });
      this.rankButton.setPosition(rankLayout.x, rankLayout.y);
      this.syncDomSoundButton();
      this.subtitleText.setWordWrapWidth(Math.max(170, width - margin * 2 - this.restartButton.width - this.soundButton.width - buttonGap - 18));
      this.statusText.setFontSize(tiny ? 11 : compact ? 12 : 13);
      this.statusText.setWordWrapWidth(width - margin * 2);
      this.statusText.setPosition(margin, this.layout.statusY);

      this.render();
      this.publishLayoutMetrics();
      this.updatePortraitPrompt(width, height);
    }

    publishLayoutMetrics() {
      if (typeof document === "undefined" || !this.layout) return;
      const doc = document.documentElement;
      const boardBottom = this.layout.boardOrigin.y + this.layout.boardSize;
      const trayBottom = this.layout.trayY + this.layout.trayHeight;
      const statusBottom = this.layout.statusY + this.layout.statusHeight;
      const trayMetrics = calculateTrayRingRenderMetrics(this.layout);
      doc.dataset.ringzzlePhaserReady = "true";
      doc.dataset.ringzzleBoardX = String(Math.round(this.layout.boardOrigin.x));
      doc.dataset.ringzzleBoardY = String(Math.round(this.layout.boardOrigin.y));
      doc.dataset.ringzzleCellSize = String(Math.round(this.layout.cellSize));
      doc.dataset.ringzzleTrayY = String(Math.round(this.layout.trayY));
      doc.dataset.ringzzleTrayHeight = String(Math.round(this.layout.trayHeight));
      doc.dataset.ringzzleSlotWidth = String(Math.round(this.layout.slotWidth));
      doc.dataset.ringzzleSlotGap = String(Math.round(this.layout.slotGap));
      doc.dataset.ringzzleBoardBottom = String(Math.round(boardBottom));
      doc.dataset.ringzzleTrayBottom = String(Math.round(trayBottom));
      doc.dataset.ringzzleStatusY = String(Math.round(this.layout.statusY));
      doc.dataset.ringzzleStatusBottom = String(Math.round(statusBottom));
      doc.dataset.ringzzleSoundEnabled = String(!!(this.soundState && this.soundState.enabled));
      doc.dataset.ringzzleSoundUserActivated = String(!!(this.soundState && this.soundState.userActivated));
      doc.dataset.ringzzleSoundLabel = getSoundButtonLabel(this.soundState);
      doc.dataset.ringzzleLeaderboardNicknameEntryMode = LEADERBOARD_NICKNAME_ENTRY_MODE;
      doc.dataset.ringzzleLeaderboardInlineNicknameInput = String(LEADERBOARD_INLINE_NICKNAME_INPUT);
      doc.dataset.ringzzleTrayRingScale = String(trayMetrics.ringScale);
      doc.dataset.ringzzleTrayDragRingScale = String(trayMetrics.dragRingScale);
      doc.dataset.ringzzleTrayRingCellSize = String(Math.round(trayMetrics.ringCellSize));
      doc.dataset.ringzzleTrayDragRingCellSize = String(Math.round(trayMetrics.dragRingCellSize));
      doc.dataset.ringzzleTrayLargestRingDiameter = String(Math.round(trayMetrics.largestRingDiameter));
      doc.dataset.ringzzleTrayVisualRack = String(!!TRAY_VISUAL_STYLE.showRack);
      doc.dataset.ringzzleTrayVisualWells = String(!!TRAY_VISUAL_STYLE.showWells);
      doc.dataset.ringzzleTrayHitAreas = String(!!TRAY_VISUAL_STYLE.keepHitAreas);
      doc.style.setProperty("--ringzzle-board-bottom", `${Math.round(boardBottom)}px`);
      doc.style.setProperty("--ringzzle-tray-bottom", `${Math.round(trayBottom)}px`);
      doc.style.setProperty("--ringzzle-status-bottom", `${Math.round(statusBottom)}px`);
    }

    leaderboardUnavailableMessage(response) {
      if (!response || response.status === 404 || response.status === 503) return "Leaderboard is not available yet.";
      return "Leaderboard is temporarily unavailable.";
    }

    getLeaderboardEntries(scope) {
      const state = this.leaderboardViewState || resolveLeaderboardViewState(null, {});
      const resolvedScope = scope === "alltime" ? "alltime" : "today";
      return state.entries && Array.isArray(state.entries[resolvedScope])
        ? state.entries[resolvedScope]
        : null;
    }

    getLeaderboardPreviewLines(limit) {
      const state = this.leaderboardViewState || resolveLeaderboardViewState(null, {});
      const scope = state.scope === "alltime" ? "alltime" : "today";
      const maxLines = Number.isFinite(limit) ? limit : 3;
      const entries = this.getLeaderboardEntries(scope);
      if (!entries) return [state.status || "Loading leaderboard..."];
      if (!entries.length) return [state.status || "No submitted scores yet."];
      return entries.slice(0, maxLines).map((entry) => (
        `#${entry.rank} ${entry.nickname} ${formatScore(entry.score)}`
      ));
    }

    async loadLeaderboard(scope, options) {
      const opts = options || {};
      const resolvedScope = scope === "alltime" ? "alltime" : "today";
      if (!opts.force && this.leaderboardViewState && this.leaderboardViewState.loadingScope === resolvedScope) return;
      if (typeof fetch === "undefined") {
        this.leaderboardViewState = resolveLeaderboardViewState(this.leaderboardViewState, {
          type: "error",
          scope: resolvedScope,
          preserveScope: !!opts.preserveScope,
          message: "Leaderboard is not available yet.",
        });
        this.render();
        return;
      }
      this.leaderboardRequestIds[resolvedScope] = (this.leaderboardRequestIds[resolvedScope] || 0) + 1;
      const requestId = this.leaderboardRequestIds[resolvedScope];
      this.leaderboardViewState = resolveLeaderboardViewState(this.leaderboardViewState, {
        type: "loading",
        scope: resolvedScope,
        preserveScope: !!opts.preserveScope,
      });
      try {
        const response = await fetch(buildLeaderboardReadUrl(resolvedScope), {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (requestId !== this.leaderboardRequestIds[resolvedScope]) return;
        if (!response.ok) {
          this.leaderboardViewState = resolveLeaderboardViewState(this.leaderboardViewState, {
            type: "error",
            scope: resolvedScope,
            preserveScope: !!opts.preserveScope,
            message: this.leaderboardUnavailableMessage(response),
          });
          this.render();
          return;
        }
        const data = await response.json();
        this.leaderboardViewState = resolveLeaderboardViewState(this.leaderboardViewState, {
          type: "loaded",
          scope: resolvedScope,
          preserveScope: !!opts.preserveScope,
          entries: Array.isArray(data.entries) ? data.entries.slice(0, 100) : [],
        });
      } catch (error) {
        if (requestId !== this.leaderboardRequestIds[resolvedScope]) return;
        this.leaderboardViewState = resolveLeaderboardViewState(this.leaderboardViewState, {
          type: "error",
          scope: resolvedScope,
          preserveScope: !!opts.preserveScope,
          message: "Leaderboard is temporarily unavailable.",
        });
      }
      this.render();
    }

    setLeaderboardScope(scope) {
      const resolvedScope = scope === "alltime" ? "alltime" : "today";
      this.leaderboardViewState = resolveLeaderboardViewState(this.leaderboardViewState, { type: "scope", scope: resolvedScope });
      if (this.leaderboardViewState.needsLoad) this.loadLeaderboard(resolvedScope);
      this.render();
    }

    openLeaderboardOverlay() {
      this.cancelActiveDragForRelayout();
      this.leaderboardViewState = resolveLeaderboardViewState(this.leaderboardViewState, { type: "open" });
      if (this.leaderboardViewState.needsLoad) this.loadLeaderboard(this.leaderboardViewState.scope);
      this.renderLeaderboardOverlay();
    }

    closeLeaderboardOverlay() {
      this.leaderboardViewState = resolveLeaderboardViewState(this.leaderboardViewState, { type: "close" });
      this.clearLeaderboardOverlayItems();
    }

    clearLeaderboardOverlayItems() {
      this.leaderboardOverlayItems.forEach((item) => item.destroy());
      this.leaderboardOverlayItems = [];
      if (this.leaderboardLayer) this.leaderboardLayer.removeAll(true);
    }

    renderLeaderboardOverlay() {
      this.clearLeaderboardOverlayItems();
      if (!this.leaderboardViewState || !this.leaderboardViewState.open) return;
      const modal = calculateLeaderboardModalLayout(this.scale.width, this.scale.height);
      const scope = this.leaderboardViewState.scope === "alltime" ? "alltime" : "today";
      const title = scope === "today" ? "Today Top 100" : "All-Time Top 100";
      const entries = this.getLeaderboardPreviewLines(modal.entryLimit);
      const scrim = this.add.rectangle(modal.centerX, modal.centerY, this.scale.width + 8, this.scale.height + 8, 0x03070d, 0.78)
        .setInteractive();
      const panel = this.add.rectangle(modal.centerX, modal.centerY, modal.panelWidth, modal.panelHeight, 0x0b1622, 0.98);
      panel.setStrokeStyle(2, 0x35e6d0, 0.84);
      const heading = this.add.text(modal.centerX, modal.panelTop + 18, "Leaderboard", this.textStyle(modal.compact ? 22 : 24, "#f6fbff", "850", "center"))
        .setOrigin(0.5, 0);
      const subhead = this.add.text(modal.centerX, modal.panelTop + 50, "Anonymous scores. Nickname only.", this.textStyle(11, "#bfd1dc", "750", "center"))
        .setOrigin(0.5, 0);
      const todayButton = this.add.text(modal.todayButton.x, modal.todayButton.y, "Today", this.textStyle(12, scope === "today" ? "#07131e" : "#f6fbff", "850", "center"))
        .setOrigin(0.5, 0)
        .setPadding(14, 8)
        .setBackgroundColor(scope === "today" ? "#35e6d0" : "#102839")
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.setLeaderboardScope("today"));
      const allTimeButton = this.add.text(modal.allTimeButton.x, modal.allTimeButton.y, "All-Time", this.textStyle(12, scope === "alltime" ? "#07131e" : "#f6fbff", "850", "center"))
        .setOrigin(0.5, 0)
        .setPadding(14, 8)
        .setBackgroundColor(scope === "alltime" ? "#35e6d0" : "#102839")
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.setLeaderboardScope("alltime"));
      const listTitle = this.add.text(modal.centerX, modal.panelTop + 116, title, this.textStyle(13, "#35e6d0", "850", "center"))
        .setOrigin(0.5, 0);
      const listText = this.add.text(
        modal.centerX,
        modal.listTop,
        entries.join("\n"),
        this.textStyle(modal.compact ? 12 : 13, "#f6fbff", "800", "center")
      );
      listText.setOrigin(0.5, 0);
      listText.setAlign("center");
      listText.setWordWrapWidth(modal.panelWidth - 42);
      const note = this.add.text(modal.centerX, modal.panelBottom - 78, "Viewing does not change your current game.", this.textStyle(10, "#bfd1dc", "750", "center"))
        .setOrigin(0.5, 0);
      const closeButton = this.add.text(modal.centerX, modal.closeButton.y, "Close", this.textStyle(15, "#07131e", "850", "center"))
        .setOrigin(0.5, 0)
        .setPadding(28, 10)
        .setBackgroundColor("#35e6d0")
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.closeLeaderboardOverlay());
      const items = [scrim, panel, heading, subhead, todayButton, allTimeButton, listTitle, listText, note, closeButton];
      items.forEach((item) => item.setDepth(101));
      scrim.setDepth(100);
      this.leaderboardOverlayItems = items;
      if (this.leaderboardLayer) this.leaderboardLayer.add(items);
    }

    restartGame() {
      this.cancelActiveDragForRelayout();
      this.clearFlashCells = [];
      this.invalidFlashCell = null;
      this.previewCell = null;
      this.clearScorePops();
      this.clearLineIndicators();
      this.clearColorBurstCues();
      this.closeLeaderboardOverlay();
      this.statusText.setText("");
      this.hideLeaderboardSubmitPanel();
      this.gameModel.restart();
      this.render();
      this.playSoundCue("restart");
    }

    render() {
      if (!this.layout || !this.gameModel) return;
      this.renderMetrics();
      this.renderBoard();
      this.renderTray();
      this.renderGameOverPanel();
      this.renderLeaderboardOverlay();
    }

    hideLeaderboardSubmitPanel() {
      this.leaderboardSubmitState = resolveLeaderboardSubmitState(this.leaderboardSubmitState, { type: "restart" });
      this.currentGameOverScore = null;
      this.syncLeaderboardSubmitPanel();
    }

    setLeaderboardSubmitMessage(message) {
      if (this.domSubmitMessage) this.domSubmitMessage.textContent = message || "";
      if (typeof document !== "undefined") {
        document.documentElement.dataset.ringzzleLeaderboardSubmitMessage = message || "";
      }
    }

    syncLeaderboardSubmitPanel() {
      if (typeof document !== "undefined") {
        const doc = document.documentElement;
        doc.dataset.ringzzleLeaderboardSubmitVisible = String(!!(this.gameModel && this.gameModel.gameOver));
        doc.dataset.ringzzleLeaderboardSubmitDisabled = String(!(this.leaderboardSubmitState && this.leaderboardSubmitState.canSubmit));
        doc.dataset.ringzzleLeaderboardSubmitMode = LEADERBOARD_NICKNAME_ENTRY_MODE;
        doc.dataset.ringzzleLeaderboardInlineNicknameInput = String(LEADERBOARD_INLINE_NICKNAME_INPUT);
      }
    }

    loadStoredLeaderboardNickname() {
      try {
        return window.localStorage.getItem(STORAGE_KEYS.leaderboardNickname) || "";
      } catch (error) {
        return "";
      }
    }

    saveStoredLeaderboardNickname(nickname) {
      try {
        window.localStorage.setItem(STORAGE_KEYS.leaderboardNickname, nickname);
      } catch (error) {
        // Nickname persistence is optional local convenience.
      }
    }

    requestNicknameForLeaderboard(options) {
      const opts = options || {};
      const storedNickname = opts.storedNickname !== undefined
        ? opts.storedNickname
        : this.loadStoredLeaderboardNickname();
      return resolveLeaderboardNicknameForSubmit({
        storedNickname,
        forcePrompt: !!opts.forcePrompt,
        promptProvider: (fallback) => {
          if (typeof window === "undefined" || typeof window.prompt !== "function") return null;
          return window.prompt("Nickname for anonymous leaderboard (2-16 letters, numbers, spaces, _ or -)", fallback || "Player");
        },
      });
    }

    editLeaderboardNickname() {
      if (!this.gameModel || !this.gameModel.gameOver) return;
      const nicknameResult = this.requestNicknameForLeaderboard({ forcePrompt: true });
      if (nicknameResult.cancelled) return;
      if (!nicknameResult.ok) {
        this.leaderboardSubmitState = resolveLeaderboardSubmitState(this.leaderboardSubmitState, {
          type: "submit-error",
          message: nicknameResult.message,
        });
        this.render();
        return;
      }
      this.saveStoredLeaderboardNickname(nicknameResult.nickname);
      this.leaderboardSubmitState = resolveLeaderboardSubmitState(this.leaderboardSubmitState, {
        type: "submit-error",
        message: `Nickname: ${nicknameResult.nickname}`,
      });
      this.render();
    }

    async submitLeaderboardScore() {
      if (!this.gameModel || !this.gameModel.gameOver) return;
      if (this.leaderboardSubmitState && this.leaderboardSubmitState.submitting) return;
      if (this.leaderboardSubmitState && this.leaderboardSubmitState.submitted) return;

      const nicknameResult = this.requestNicknameForLeaderboard();
      if (nicknameResult.cancelled) {
        this.leaderboardSubmitState = resolveLeaderboardSubmitState(this.leaderboardSubmitState, {
          type: "submit-error",
          message: "Score not submitted.",
        });
        this.render();
        return;
      }
      if (!nicknameResult.ok) {
        this.leaderboardSubmitState = resolveLeaderboardSubmitState(this.leaderboardSubmitState, {
          type: "submit-error",
          message: nicknameResult.message,
        });
        this.render();
        return;
      }

      const nextState = resolveLeaderboardSubmitState(this.leaderboardSubmitState, { type: "submit-start" });
      this.leaderboardSubmitState = nextState;
      this.syncLeaderboardSubmitPanel();
      this.render();
      try {
        const browserPlayerId = getOrCreateBrowserPlayerId(window.localStorage);
        this.saveStoredLeaderboardNickname(nicknameResult.nickname);
        const payload = buildLeaderboardSubmitPayload({
          game: this.gameModel,
          nickname: nicknameResult.nickname,
          browserPlayerId,
        });
        if (typeof document !== "undefined") {
          document.documentElement.dataset.ringzzleLeaderboardSubmitAttempts = String(
            (Number.parseInt(document.documentElement.dataset.ringzzleLeaderboardSubmitAttempts || "0", 10) || 0) + 1
          );
          document.documentElement.dataset.ringzzleLeaderboardSubmitPayloadKeys = Object.keys(payload).sort().join(",");
        }
        const response = await fetch("/api/leaderboard/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data || !data.ok || !data.accepted) {
          throw new Error((data && data.message) || "Submit failed. Try again.");
        }
        this.leaderboardSubmitState = resolveLeaderboardSubmitState(this.leaderboardSubmitState, { type: "submit-success" });
        this.leaderboardViewState = resolveLeaderboardViewState(this.leaderboardViewState, { type: "submit-success" });
        const visibleScope = this.leaderboardViewState.scope === "alltime" ? "alltime" : "today";
        this.loadLeaderboard(visibleScope, { force: true });
        this.loadLeaderboard(visibleScope === "today" ? "alltime" : "today", { force: true, preserveScope: true });
      } catch (error) {
        this.leaderboardSubmitState = resolveLeaderboardSubmitState(this.leaderboardSubmitState, {
          type: "submit-error",
          message: error && error.message ? error.message : "Submit failed. Try again.",
        });
      }
      this.syncLeaderboardSubmitPanel();
      this.render();
    }

    renderMetrics() {
      const stats = this.gameModel.stats || {};
      this.metricTexts[0].setText(`Score ${formatCompactScore(this.gameModel.score)}`);
      this.metricTexts[1].setText(`Best ${formatCompactScore(this.gameModel.highScore)}`);
      this.metricTexts[2].setText(`Today ${formatCompactScore(stats.todayBest || 0)}`);
      this.publishGameStateMetrics();
    }

    publishGameStateMetrics() {
      if (typeof document === "undefined" || !this.gameModel) return;
      const doc = document.documentElement;
      doc.dataset.ringzzleScore = String(this.gameModel.score);
      doc.dataset.ringzzleTrayActive = this.gameModel.tray.map((piece) => (piece ? "1" : "0")).join("");
      doc.dataset.ringzzleTraySizes = this.gameModel.tray.map((piece) => (piece ? piece.size : "empty")).join(",");
      doc.dataset.ringzzleGameOver = String(this.gameModel.gameOver);
      doc.dataset.ringzzleColorCount = String(this.gameModel.availableColorCount);
      doc.dataset.ringzzleClientVersion = CLIENT_VERSION;
      doc.dataset.ringzzleDragGhostActive = String(!!(this.dragState && this.dragState.ghost));
      doc.dataset.ringzzleLeaderboardAutoSubmit = String(LEADERBOARD_AUTO_SUBMIT);
      if (!doc.dataset.ringzzleLineIndicatorActive) doc.dataset.ringzzleLineIndicatorActive = "false";
      if (!doc.dataset.ringzzleColorBurstActive) doc.dataset.ringzzleColorBurstActive = "false";
      this.publishSoundMetrics();
    }

    publishSoundMetrics() {
      if (typeof document === "undefined") return;
      const doc = document.documentElement;
      doc.dataset.ringzzleSoundEnabled = String(!!(this.soundState && this.soundState.enabled));
      doc.dataset.ringzzleSoundUserActivated = String(!!(this.soundState && this.soundState.userActivated));
      doc.dataset.ringzzleSoundBlocked = String(!!(this.soundState && this.soundState.blocked));
      doc.dataset.ringzzleSoundLabel = getSoundButtonLabel(this.soundState);
      if (this.soundButton) {
        doc.dataset.ringzzleSoundButtonX = String(Math.round(this.soundButton.x));
        doc.dataset.ringzzleSoundButtonY = String(Math.round(this.soundButton.y));
        doc.dataset.ringzzleSoundButtonWidth = String(Math.round(this.soundButton.width));
        doc.dataset.ringzzleSoundButtonHeight = String(Math.round(this.soundButton.height));
      }
    }

    updateSoundButton() {
      if (!this.soundButton) return;
      const enabled = !!(this.soundState && this.soundState.enabled);
      this.soundButton.setText(getSoundButtonLabel(this.soundState));
      this.soundButton.setBackgroundColor(enabled ? "#1a5c49" : "#102839");
      if (this.domSoundButton) {
        this.domSoundButton.textContent = getSoundButtonLabel(this.soundState);
        this.domSoundButton.setAttribute("aria-pressed", String(enabled));
        this.domSoundButton.dataset.enabled = String(enabled);
      }
      this.syncDomSoundButton();
      this.publishSoundMetrics();
    }

    syncDomSoundButton() {
      if (!this.domSoundButton || !this.soundButton) return;
      const doc = typeof document !== "undefined" ? document.documentElement : null;
      const left = `${Math.round(this.soundButton.x)}px`;
      const top = `${Math.round(this.soundButton.y)}px`;
      this.domSoundButton.style.left = left;
      this.domSoundButton.style.top = top;
      this.domSoundButton.style.width = `${Math.round(this.soundButton.width)}px`;
      this.domSoundButton.style.height = `${Math.max(34, Math.round(this.soundButton.height + 6))}px`;
      this.domSoundButton.style.fontSize = this.soundButton.style && this.soundButton.style.fontSize
        ? this.soundButton.style.fontSize
        : "12px";
      if (doc && doc.style) {
        doc.style.setProperty("--ringzzle-sound-left", left);
        doc.style.setProperty("--ringzzle-sound-top", top);
      }
    }

    updateButtonHitZone(zone, button) {
      if (!zone || !button) return;
      const width = Math.max(48, button.width + 10);
      const height = Math.max(34, button.height + 8);
      zone.setPosition(button.x + button.width / 2, button.y + button.height / 2);
      zone.setSize(width, height);
      if (zone.input && zone.input.hitArea) {
        zone.input.hitArea.setTo(0, 0, width, height);
      }
    }

    activateAudioContextFromGesture() {
      const AudioContextClass = root && (root.AudioContext || root.webkitAudioContext);
      if (!AudioContextClass) return false;
      try {
        if (!this.audioContext || this.audioContext.state === "closed") {
          this.audioContext = new AudioContextClass();
        }
        if (this.audioContext.state === "suspended" && typeof this.audioContext.resume === "function") {
          this.audioContext.resume().catch(() => {
            if (this.soundState) {
              this.soundState = {
                ...this.soundState,
                enabled: false,
                blocked: true,
              };
              this.updateSoundButton();
            }
          });
        }
        return this.audioContext.state !== "closed";
      } catch (error) {
        this.audioContext = null;
        return false;
      }
    }

    async toggleSound() {
      if (typeof document !== "undefined") {
        const doc = document.documentElement;
        const count = Number.parseInt(doc.dataset.ringzzleSoundToggleAttempts || "0", 10) || 0;
        doc.dataset.ringzzleSoundToggleAttempts = String(count + 1);
      }
      if (this.soundState && this.soundState.enabled) {
        this.playSoundCue("toggle-off", { force: true });
        this.soundState = resolveSoundToggleState(this.soundState, { userGesture: true, audioReady: true });
        this.updateSoundButton();
        return;
      }

      const audioReady = this.activateAudioContextFromGesture();
      this.soundState = resolveSoundToggleState(this.soundState, { userGesture: true, audioReady });
      this.updateSoundButton();
      if (this.soundState.enabled) {
        this.playSoundCue("toggle-on", { force: true });
      } else {
        this.statusText.setText("Sound unavailable.");
      }
    }

    playSoundCue(eventName, options) {
      const spec = getSoundCueSpec(eventName);
      if (!spec || !this.audioContext) return false;
      const opts = options || {};
      if (!opts.force && !(this.soundState && this.soundState.enabled)) return false;
      try {
        const now = this.audioContext.currentTime || 0;
        const nowMs = Date.now ? Date.now() : now * 1000;
        if (!opts.force && nowMs - this.lastSoundAt < SOUND_MIN_INTERVAL_MS) return false;
        this.lastSoundAt = nowMs;
        const layers = Array.isArray(spec.layers) && spec.layers.length ? spec.layers : [spec];
        layers.forEach((layer) => {
          const startAt = now + (Number.isFinite(layer.delay) ? Math.max(0, layer.delay) : 0);
          const duration = Math.max(0.025, Math.min(spec.duration, layer.duration || spec.duration));
          const oscillator = this.audioContext.createOscillator();
          const gain = this.audioContext.createGain();
          oscillator.type = layer.type || spec.type;
          oscillator.frequency.setValueAtTime(Math.max(1, layer.frequency || spec.frequency), startAt);
          oscillator.frequency.exponentialRampToValueAtTime(
            Math.max(1, layer.endFrequency || spec.endFrequency || layer.frequency || spec.frequency),
            startAt + duration
          );
          gain.gain.setValueAtTime(0.0001, startAt);
          gain.gain.exponentialRampToValueAtTime(Math.min(layer.gain || spec.gain, spec.gain), startAt + 0.006);
          gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
          oscillator.connect(gain);
          gain.connect(this.audioContext.destination);
          oscillator.start(startAt);
          oscillator.stop(startAt + duration + 0.015);
        });
        if (typeof document !== "undefined") {
          document.documentElement.dataset.ringzzleLastSoundCue = eventName;
        }
        return true;
      } catch (error) {
        return false;
      }
    }

    playResultSound(result) {
      if (!result || !result.placed) return;
      if (this.gameModel && this.gameModel.gameOver) {
        this.playSoundCue("game-over");
      } else if (result.colorBursts > 0) {
        this.playSoundCue("color-burst");
      } else if (result.lineClears > 0) {
        this.playSoundCue("line-clear");
      } else {
        this.playSoundCue("place");
      }
    }

    drawRing(graphics, x, y, sizeName, colorIndex, cellSize, alpha) {
      const radiusScale = { small: 0.18, medium: 0.285, large: 0.39 };
      const strokeScale = { small: 0.06, medium: 0.066, large: 0.072 };
      const radius = cellSize * radiusScale[sizeName];
      const strokeWidth = Math.max(4, cellSize * strokeScale[sizeName]);
      const color = hexToNumber(COLORS[colorIndex % COLORS.length]);
      const resolvedAlpha = alpha || 1;
      graphics.lineStyle(strokeWidth + 8, color, resolvedAlpha * 0.18);
      graphics.strokeCircle(x, y, radius);
      graphics.lineStyle(strokeWidth + 4, 0x01050a, resolvedAlpha * 0.48);
      graphics.strokeCircle(x, y + 1.8, radius);
      graphics.lineStyle(strokeWidth, color, resolvedAlpha);
      graphics.strokeCircle(x, y, radius);
      graphics.lineStyle(Math.max(1.6, strokeWidth * 0.2), 0xffffff, resolvedAlpha * 0.7);
      graphics.strokeCircle(x, y - 0.8, radius);
    }

    drawRingGuide(graphics, x, y, sizeName, cellSize) {
      const radiusScale = { small: 0.18, medium: 0.285, large: 0.39 };
      const radius = cellSize * radiusScale[sizeName];
      graphics.lineStyle(Math.max(1, cellSize * 0.008), 0x9eb4c2, 0.045);
      graphics.strokeCircle(x, y, radius);
    }

    renderBoard() {
      this.boardLayer.removeAll(true);
      const layout = this.layout;
      const g = this.add.graphics();
      this.boardLayer.add(g);
      const origin = layout.boardOrigin;
      const boardSize = layout.boardSize;
      const cellSize = layout.cellSize;
      const pad = Math.max(7, Math.floor(cellSize * 0.055));
      const radius = Math.max(10, Math.floor(cellSize * 0.085));
      const panelPad = Math.max(12, Math.floor(cellSize * 0.085));
      const panelRadius = Math.max(18, Math.floor(cellSize * 0.13));
      const panelX = origin.x - panelPad;
      const panelY = origin.y - panelPad;
      const panelSize = boardSize + panelPad * 2;

      g.fillStyle(0x01050a, 0.55);
      g.fillRoundedRect(panelX - 2, panelY + 9, panelSize + 4, panelSize + 8, panelRadius + 2);
      g.fillStyle(0x0b1622, 0.98);
      g.fillRoundedRect(panelX, panelY, panelSize, panelSize, panelRadius);
      g.lineStyle(2.5, 0x35e6d0, 0.36);
      g.strokeRoundedRect(panelX, panelY, panelSize, panelSize, panelRadius);
      g.lineStyle(1, 0x72bdf2, 0.11);
      g.strokeRoundedRect(panelX + 5, panelY + 5, panelSize - 10, panelSize - 10, panelRadius - 5);

      for (let y = 0; y < BOARD_SIZE; y += 1) {
        for (let x = 0; x < BOARD_SIZE; x += 1) {
          const cellX = origin.x + x * cellSize;
          const cellY = origin.y + y * cellSize;
          const centerX = cellX + cellSize / 2;
          const centerY = cellY + cellSize / 2;
          const isPreview = this.previewCell && this.previewCell.x === x && this.previewCell.y === y;
          const isFlash = this.clearFlashCells.some((cell) => cell.x === x && cell.y === y);
          const isInvalid = this.invalidFlashCell && this.invalidFlashCell.x === x && this.invalidFlashCell.y === y;
          const fill = isPreview
            ? (this.previewCell.valid ? 0x16e876 : 0xff3366)
            : isInvalid
              ? 0xff3366
            : 0x142231;
          const alpha = isPreview ? (this.previewCell.valid ? 0.3 : 0.34) : isInvalid ? 0.24 : 0.92;
          g.fillStyle(fill, alpha);
          g.fillRoundedRect(cellX + pad, cellY + pad, cellSize - pad * 2, cellSize - pad * 2, radius);
          const strokeColor = isFlash ? 0xffd02e : isInvalid ? 0xff3366 : isPreview ? fill : 0x365265;
          const strokeAlpha = isFlash ? 0.92 : isInvalid ? 0.86 : isPreview ? 0.82 : 0.58;
          const strokeWidth = isFlash || isInvalid || isPreview ? 3 : 1.5;
          g.lineStyle(strokeWidth, strokeColor, strokeAlpha);
          g.strokeRoundedRect(cellX + pad, cellY + pad, cellSize - pad * 2, cellSize - pad * 2, radius);
          if ((isPreview && !this.previewCell.valid) || isInvalid) {
            const crossInset = cellSize * 0.28;
            g.lineStyle(Math.max(3, cellSize * 0.035), 0xf6fbff, 0.72);
            g.beginPath();
            g.moveTo(cellX + crossInset, cellY + crossInset);
            g.lineTo(cellX + cellSize - crossInset, cellY + cellSize - crossInset);
            g.moveTo(cellX + cellSize - crossInset, cellY + crossInset);
            g.lineTo(cellX + crossInset, cellY + cellSize - crossInset);
            g.strokePath();
          }

          this.gameModel.sizes.forEach((sizeName) => this.drawRingGuide(g, centerX, centerY, sizeName, cellSize));
          this.gameModel.sizes.forEach((sizeName) => {
            const color = this.gameModel.board[y][x][sizeName];
            if (color !== null) this.drawRing(g, centerX, centerY, sizeName, color, cellSize, 1);
          });
        }
      }
    }

    getTraySlotCenter(index) {
      const layout = this.layout;
      const totalWidth = layout.slotWidth * TRAY_SIZE + layout.slotGap * (TRAY_SIZE - 1);
      const startX = (layout.width - totalWidth) / 2;
      return {
        x: startX + index * (layout.slotWidth + layout.slotGap) + layout.slotWidth / 2,
        y: layout.trayY + layout.trayHeight / 2,
      };
    }

    renderTray() {
      this.trayLayer.removeAll(true);
      const layout = this.layout;
      const g = this.add.graphics();
      this.trayLayer.add(g);
      this.trayOrigins = [];
      const trayMetrics = calculateTrayRingRenderMetrics(layout);

      for (let index = 0; index < TRAY_SIZE; index += 1) {
        const center = this.getTraySlotCenter(index);
        this.trayOrigins[index] = center;
        const piece = this.gameModel.tray[index];
        const isDragging = this.dragState && this.dragState.slotIndex === index;

        if (piece && !isDragging) {
          this.drawRing(g, center.x, center.y - 2, piece.size, piece.color, trayMetrics.ringCellSize, this.gameModel.gameOver ? 0.34 : 1);
        }

        const zone = this.add.zone(center.x, center.y, layout.slotWidth, layout.trayHeight);
        if (piece && !this.gameModel.gameOver) {
          zone.setInteractive({ useHandCursor: true });
          zone.on("pointerdown", (pointer) => this.startDrag(index, pointer));
        }
        this.trayLayer.add(zone);
      }
    }

    nextDragGhostId() {
      this.dragGhostSerial += 1;
      return `ghost-${this.dragGhostSerial}`;
    }

    stopGhostTweens(ghost) {
      if (!ghost || !this.tweens) return;
      if (typeof this.tweens.killTweensOf === "function") {
        this.tweens.killTweensOf(ghost);
      }
    }

    destroyGhost(ghost) {
      if (!ghost) return;
      this.stopGhostTweens(ghost);
      if (typeof ghost.destroy === "function" && !ghost.destroyed) {
        ghost.destroy();
      }
    }

    setDragVisualState(action) {
      const resolved = resolveDragCleanupState(this.dragVisualState, action);
      this.dragVisualState = resolved.state;
      return resolved;
    }

    clearActiveDragVisual(reason, options) {
      const opts = options || {};
      const state = this.dragState;
      if (this.dragReturnTween && typeof this.dragReturnTween.remove === "function") {
        this.dragReturnTween.remove(false);
      }
      this.dragReturnTween = null;
      if (state && state.ghost) this.destroyGhost(state.ghost);
      this.dragState = null;
      this.dragVisualState = resolveDragCleanupState(this.dragVisualState, { type: "cancel", reason }).state;
      this.previewCell = null;
      this.invalidFlashCell = null;
      if (opts.clearStatus && this.statusText) this.statusText.setText("");
      if (typeof document !== "undefined") {
        document.documentElement.dataset.ringzzleDragGhostActive = "false";
      }
      if (opts.render !== false && this.layout && this.gameModel) this.render();
    }

    completeDragVisual(state, actionType) {
      if (state && state.ghost) this.destroyGhost(state.ghost);
      if (this.dragState === state) this.dragState = null;
      this.dragReturnTween = null;
      this.dragVisualState = resolveDragCleanupState(this.dragVisualState, { type: actionType || "valid-drop" }).state;
      if (typeof document !== "undefined") {
        document.documentElement.dataset.ringzzleDragGhostActive = "false";
      }
    }

    startDrag(slotIndex, pointer) {
      if (this.gameModel.gameOver || this.portraitPromptActive || (this.leaderboardViewState && this.leaderboardViewState.open)) return;
      const piece = this.gameModel.tray[slotIndex];
      if (!piece) return;
      this.clearActiveDragVisual("new-drag", { render: false, clearStatus: false });
      const trayOrigin = this.trayOrigins[slotIndex] || { x: pointer.x, y: pointer.y };
      const ghost = this.add.graphics().setDepth(80);
      const ghostId = this.nextDragGhostId();
      const trayMetrics = calculateTrayRingRenderMetrics(this.layout);
      this.drawRing(ghost, 0, 0, piece.size, piece.color, trayMetrics.dragRingCellSize, 0.94);
      ghost.setPosition(trayOrigin.x, trayOrigin.y);
      this.setDragVisualState({ type: "start", ghostId });
      this.dragState = {
        ghostId,
        slotIndex,
        piece: clonePiece(piece),
        trayOrigin: { ...trayOrigin },
        ghost,
        valid: false,
        boardCell: null,
        returning: false,
      };
      this.statusText.setText("");
      this.invalidFlashCell = null;
      if (typeof document !== "undefined") {
        document.documentElement.dataset.ringzzleDragGhostActive = "true";
      }
      this.renderTray();
      this.handlePointerMove(pointer);
    }

    getDragBoardCell(pointer) {
      return getDragPlacementCell(pointer, this.layout, DRAG_LIFT);
    }

    handlePointerMove(pointer) {
      if (!this.dragState || this.dragState.returning) return;
      const boardCell = this.getDragBoardCell(pointer);
      if (boardCell) {
        const valid = this.gameModel.canPlacePiece(this.dragState.piece, boardCell.x, boardCell.y);
        this.previewCell = { ...boardCell, valid };
        this.dragState.valid = valid;
        this.dragState.boardCell = boardCell;
        this.statusText.setText(valid ? "Release to place." : "That size is already there.");
      } else {
        this.previewCell = null;
        this.dragState.valid = false;
        this.dragState.boardCell = null;
        this.statusText.setText("");
      }
      this.renderBoard();
      this.moveDragGhost(pointer);
    }

    handlePointerUp(pointer) {
      if (!this.dragState || this.dragState.returning) return;
      const state = this.dragState;
      const boardCell = this.getDragBoardCell(pointer);
      this.previewCell = null;
      if (!boardCell) {
        this.statusText.setText("Drop onto the board.");
        this.renderBoard();
        this.flashInvalidCell(null);
        this.playSoundCue("invalid");
        this.animateGhostBackToTray(state);
        return;
      }

      const result = this.gameModel.placeTrayPiece(state.slotIndex, boardCell.x, boardCell.y);
      if (!result.placed) {
        this.statusText.setText(result.reason === "occupied-size" ? "That size is already there." : "Try another spot.");
        this.flashInvalidCell(boardCell);
        this.renderBoard();
        this.playSoundCue("invalid");
        this.animateGhostBackToTray(state);
        return;
      }

      this.completeDragVisual(state, "valid-drop");
      this.clearFlashCells = result.cells || [];
      this.invalidFlashCell = null;
      this.statusText.setText(getMoveFeedbackLabel(result, this.gameModel.gameOver));
      this.render();
      this.playScorePop(result, state);
      this.playLineIndicators(result.lineEvents || []);
      this.playColorBurstCue(result.colorBurstEvents || []);
      this.playResultSound(result);
      if (this.clearFlashCells.length) {
        this.time.delayedCall(420, () => {
          this.clearFlashCells = [];
          this.renderBoard();
        });
      }
    }

    moveDragGhost(pointer) {
      if (!this.dragState || !this.dragState.ghost) return;
      this.dragState.ghost.setPosition(pointer.x + DRAG_LIFT.x, pointer.y + DRAG_LIFT.y);
    }

    handlePointerCancel() {
      if (!this.dragState || this.dragState.returning) return;
      this.statusText.setText("");
      this.clearActiveDragVisual("pointer-cancel");
    }

    flashInvalidCell(boardCell) {
      if (!boardCell) {
        this.invalidFlashCell = null;
        return;
      }
      this.invalidFlashCell = { x: boardCell.x, y: boardCell.y };
      this.time.delayedCall(240, () => {
        this.invalidFlashCell = null;
        this.renderBoard();
      });
    }

    clearScorePops() {
      this.scorePopItems.forEach((item) => item.destroy());
      this.scorePopItems = [];
    }

    clearLineIndicators() {
      if (this.lineIndicatorItems && this.tweens && typeof this.tweens.killTweensOf === "function") {
        this.tweens.killTweensOf(this.lineIndicatorItems);
      }
      (this.lineIndicatorItems || []).forEach((item) => {
        if (item && typeof item.destroy === "function" && !item.destroyed) item.destroy();
      });
      this.lineIndicatorItems = [];
      if (this.lineIndicatorLayer) this.lineIndicatorLayer.removeAll(true);
      if (typeof document !== "undefined") {
        document.documentElement.dataset.ringzzleLineIndicatorActive = "false";
      }
    }

    playLineIndicators(lineEvents) {
      this.clearLineIndicators();
      if (!lineEvents || !lineEvents.length || !this.layout || !this.lineIndicatorLayer) return;
      const indicators = lineEvents
        .map((event) => calculateLineIndicatorGeometry(event, this.layout))
        .filter(Boolean);
      if (!indicators.length) return;

      indicators.forEach((indicator) => {
        const color = hexToNumber(COLORS[indicator.color % COLORS.length]);
        const g = this.add.graphics();
        const width = Math.max(7, this.layout.cellSize * 0.06);
        g.lineStyle(width + 7, color, 0.18);
        g.beginPath();
        g.moveTo(indicator.x1, indicator.y1);
        g.lineTo(indicator.x2, indicator.y2);
        g.strokePath();
        g.lineStyle(width, color, 0.82);
        g.beginPath();
        g.moveTo(indicator.x1, indicator.y1);
        g.lineTo(indicator.x2, indicator.y2);
        g.strokePath();
        g.lineStyle(Math.max(2, width * 0.25), 0xffffff, 0.62);
        g.beginPath();
        g.moveTo(indicator.x1, indicator.y1);
        g.lineTo(indicator.x2, indicator.y2);
        g.strokePath();
        this.lineIndicatorLayer.add(g);
        this.lineIndicatorItems.push(g);
      });

      if (typeof document !== "undefined") {
        document.documentElement.dataset.ringzzleLineIndicatorActive = "true";
        document.documentElement.dataset.ringzzleLastLineIndicatorCount = String(indicators.length);
      }
      this.tweens.add({
        targets: this.lineIndicatorItems.slice(),
        alpha: 0,
        duration: LINE_INDICATOR_DURATION,
        ease: "Sine.easeOut",
        onComplete: () => this.clearLineIndicators(),
      });
    }

    clearColorBurstCues() {
      if (this.colorBurstItems && this.tweens && typeof this.tweens.killTweensOf === "function") {
        this.tweens.killTweensOf(this.colorBurstItems);
      }
      (this.colorBurstItems || []).forEach((item) => {
        if (item && typeof item.destroy === "function" && !item.destroyed) item.destroy();
      });
      this.colorBurstItems = [];
      if (typeof document !== "undefined") {
        document.documentElement.dataset.ringzzleColorBurstActive = "false";
      }
    }

    playColorBurstCue(colorBurstEvents) {
      this.clearColorBurstCues();
      if (!colorBurstEvents || !colorBurstEvents.length || !this.layout || !this.feedbackLayer) return;
      const cues = colorBurstEvents
        .map((event) => calculateColorBurstCueGeometry(event, this.layout))
        .filter(Boolean);
      cues.forEach((cue) => {
        const color = hexToNumber(COLORS[cue.color % COLORS.length]);
        cue.links.forEach((link) => {
          const g = this.add.graphics();
          const width = Math.max(3, this.layout.cellSize * 0.026);
          const midX = (link.x1 + link.x2) / 2;
          const midY = (link.y1 + link.y2) / 2;
          const dx = link.x2 - link.x1;
          const dy = link.y2 - link.y1;
          const length = Math.max(1, Math.hypot(dx, dy));
          const jitter = Math.min(10, this.layout.cellSize * 0.08);
          const bendX = midX + (-dy / length) * jitter;
          const bendY = midY + (dx / length) * jitter;
          g.lineStyle(width + 5, color, 0.14);
          g.beginPath();
          g.moveTo(link.x1, link.y1);
          g.lineTo(bendX, bendY);
          g.lineTo(link.x2, link.y2);
          g.strokePath();
          g.lineStyle(width, color, 0.82);
          g.beginPath();
          g.moveTo(link.x1, link.y1);
          g.lineTo(bendX, bendY);
          g.lineTo(link.x2, link.y2);
          g.strokePath();
          g.lineStyle(Math.max(1.5, width * 0.35), 0xffffff, 0.6);
          g.beginPath();
          g.moveTo(link.x1, link.y1);
          g.lineTo(bendX, bendY);
          g.lineTo(link.x2, link.y2);
          g.strokePath();
          this.feedbackLayer.add(g);
          this.colorBurstItems.push(g);
        });

        const sourcePulse = this.add.circle(cue.source.x, cue.source.y, this.layout.cellSize * 0.45, color, 0.18);
        sourcePulse.setStrokeStyle(Math.max(4, this.layout.cellSize * 0.045), color, 0.82);
        this.feedbackLayer.add(sourcePulse);
        this.colorBurstItems.push(sourcePulse);

        cue.targetPulses.forEach((target) => {
          const pulse = this.add.circle(target.x, target.y, Math.max(target.radius, this.layout.cellSize * 0.18), color, 0.08);
          pulse.setStrokeStyle(Math.max(2, this.layout.cellSize * 0.022), color, 0.56);
          this.feedbackLayer.add(pulse);
          this.colorBurstItems.push(pulse);
        });

        const text = this.add.text(cue.source.x, cue.source.y, "Color Burst", this.textStyle(15, "#f6fbff", "900", "center"));
        text.setOrigin(0.5, 0.5);
        text.setShadow(0, 2, "#000000", 5, false, true);
        this.feedbackLayer.add(text);
        this.colorBurstItems.push(text);
      });
      if (typeof document !== "undefined") {
        document.documentElement.dataset.ringzzleColorBurstActive = "true";
        document.documentElement.dataset.ringzzleLastColorBurstCount = String(colorBurstEvents.length);
        document.documentElement.dataset.ringzzleLastColorBurstLinkCount = String(cues.reduce((count, cue) => count + cue.links.length, 0));
      }
      this.tweens.add({
        targets: this.colorBurstItems.slice(),
        alpha: 0,
        scaleX: 1.06,
        scaleY: 1.06,
        duration: COLOR_BURST_EFFECT_DURATION,
        ease: "Sine.easeOut",
        onComplete: () => this.clearColorBurstCues(),
      });
    }

    playScorePop(result, state) {
      if (!result || !result.placed || !this.layout || !this.feedbackLayer) return;
      const placed = result.placedRing || {};
      const cellSize = this.layout.cellSize;
      const x = this.layout.boardOrigin.x + (Number.isFinite(placed.x) ? placed.x + 0.5 : 1.5) * cellSize;
      const y = this.layout.boardOrigin.y + (Number.isFinite(placed.y) ? placed.y + 0.5 : 1.5) * cellSize;
      const label = result.clearEvents
        ? getMoveFeedbackLabel(result, false)
        : `+${Math.max(0, Number.parseInt(result.scoreDelta || 0, 10) || 0)}`;
      const color = result.cellBonuses ? "#ffd02e" : result.clearEvents ? "#16e876" : "#f6fbff";
      const text = this.add.text(x, y - cellSize * 0.36, label, this.textStyle(15, color, "900", "center"));
      text.setOrigin(0.5, 0.5);
      const back = this.add.rectangle(x, text.y, text.width + 22, text.height + 12, 0x07111c, 0.72);
      back.setStrokeStyle(1, result.clearEvents ? 0x16e876 : 0xffffff, result.clearEvents ? 0.56 : 0.18);
      this.feedbackLayer.add([back, text]);
      this.scorePopItems.push(back, text);
      const targets = [back, text];
      this.tweens.add({
        targets,
        y: "-=34",
        alpha: 0,
        duration: result.clearEvents ? 760 : 560,
        ease: "Sine.easeOut",
        onComplete: () => {
          targets.forEach((item) => item.destroy());
          this.scorePopItems = this.scorePopItems.filter((item) => targets.indexOf(item) === -1);
        },
      });
      if (state && state.slotIndex >= 0 && typeof document !== "undefined") {
        document.documentElement.dataset.ringzzleLastPlacedSlot = String(state.slotIndex);
      }
    }

    animateGhostBackToTray(state) {
      if (!state || !state.ghost || state.returning) return;
      if (this.dragReturnTween && typeof this.dragReturnTween.remove === "function") {
        this.dragReturnTween.remove(false);
      }
      this.stopGhostTweens(state.ghost);
      state.returning = true;
      this.dragVisualState = resolveDragCleanupState(this.dragVisualState, { type: "return", tweenId: `return-${state.ghostId || "ghost"}` }).state;
      this.dragReturnTween = this.tweens.add({
        targets: state.ghost,
        x: state.trayOrigin.x,
        y: state.trayOrigin.y,
        alpha: 0.48,
        scaleX: 0.78,
        scaleY: 0.78,
        duration: 210,
        ease: "Cubic.easeOut",
        onComplete: () => {
          this.completeDragVisual(state, "invalid-complete");
          this.previewCell = null;
          this.statusText.setText("");
          this.render();
        },
      });
    }

    cancelActiveDragForRelayout() {
      this.clearActiveDragVisual("relayout");
      this.clearLineIndicators();
      this.clearColorBurstCues();
    }

    renderGameOverPanel() {
      this.gameOverLayer.removeAll(true);
      if (!this.gameModel.gameOver) {
        this.syncLeaderboardSubmitPanel();
        return;
      }
      if (this.currentGameOverScore !== this.gameModel.score) {
        this.currentGameOverScore = this.gameModel.score;
        this.leaderboardSubmitState = resolveLeaderboardSubmitState(this.leaderboardSubmitState, { type: "game-over" });
      }
      if (this.leaderboardViewState && this.leaderboardViewState.needsLoad) {
        this.loadLeaderboard(this.leaderboardViewState.scope);
      } else if (this.leaderboardViewState && !this.leaderboardViewState.entries[this.leaderboardViewState.scope] && !this.leaderboardViewState.loadingScope) {
        this.loadLeaderboard(this.leaderboardViewState.scope);
      }
      const width = this.layout.width;
      const height = this.layout.height;
      const centerX = width / 2;
      const panelLayout = calculateGameOverPromptPanelLayout({ layout: this.layout });
      const scope = this.leaderboardViewState.scope === "alltime" ? "alltime" : "today";
      const leaderboardTitle = scope === "today" ? "Today Top 100" : "All-Time Top 100";
      const leaderboardLines = this.getLeaderboardPreviewLines(panelLayout.entryLimit);
      const storedNickname = this.loadStoredLeaderboardNickname();
      const nicknameDisplay = getLeaderboardNicknameDisplay(storedNickname);
      const previousTodayBest = this.gameModel.completedGamePreviousStats
        ? this.gameModel.completedGamePreviousStats.todayBest
        : Math.max(0, (this.gameModel.stats && this.gameModel.stats.todayBest) || 0);
      const submitCta = getLeaderboardSubmitCta({
        score: this.gameModel.score,
        previousTodayBest,
        submitted: !!(this.leaderboardSubmitState && this.leaderboardSubmitState.submitted),
        submitting: !!(this.leaderboardSubmitState && this.leaderboardSubmitState.submitting),
      });
      const submitMessage = this.leaderboardSubmitState && this.leaderboardSubmitState.message
        ? this.leaderboardSubmitState.message
        : submitCta.message || "Anonymous leaderboard. No login or email.";
      const submitting = !!(this.leaderboardSubmitState && this.leaderboardSubmitState.submitting);
      const submitted = !!(this.leaderboardSubmitState && this.leaderboardSubmitState.submitted);
      const submitLabel = submitCta.buttonLabel;
      const scrim = this.add.rectangle(centerX, height / 2, width + 8, height + 8, 0x03070d, 0.72).setInteractive();
      const panel = this.add.rectangle(centerX, panelLayout.panelTop + panelLayout.panelHeight / 2, panelLayout.panelWidth, panelLayout.panelHeight, 0x0b1622, 0.98);
      panel.setStrokeStyle(2, 0x35e6d0, 0.74);
      const title = this.add.text(panelLayout.title.x, panelLayout.title.y, "Game Over", this.textStyle(panelLayout.compact ? 23 : 25, "#f6fbff", "850", "center"));
      title.setOrigin(0.5, 0);
      const score = this.add.text(
        panelLayout.reason.x,
        panelLayout.reason.y,
        `Final score ${formatScore(this.gameModel.score)}`,
        this.textStyle(panelLayout.compact ? 16 : 18, "#f6fbff", "850", "center")
      );
      score.setOrigin(0.5, 0);
      const stats = this.gameModel.stats;
      const detail = this.add.text(
        panelLayout.stats.x,
        panelLayout.stats.y,
        [
          `Best ${formatScore(this.gameModel.highScore)}   Today ${formatScore(stats.todayBest)}`,
          `Games ${formatScore(stats.gamesPlayed)}   Clears ${formatScore(this.gameModel.totalLineClearsThisGame || 0)}`,
          `Color Bursts ${formatScore(this.gameModel.totalColorBurstsThisGame || 0)}   Best Clear ${formatScore(this.gameModel.bestClearThisGame || 0)}`,
        ].join("\n"),
        this.textStyle(12, "#bfd1dc", "800", "center")
      );
      detail.setOrigin(0.5, 0);
      detail.setLineSpacing(5);
      const divider = this.add.rectangle(panelLayout.divider.x, panelLayout.divider.y, panelLayout.panelWidth - 44, 1, 0x243b52, 0.86);
      const leaderboardHeading = this.add.text(panelLayout.leaderboardHeading.x, panelLayout.leaderboardHeading.y, `Anonymous leaderboard · ${leaderboardTitle}`, this.textStyle(12, "#35e6d0", "850", "center"));
      leaderboardHeading.setOrigin(0.5, 0);
      const nicknameText = this.add.text(panelLayout.nickname.x, panelLayout.nickname.y, nicknameDisplay.text, this.textStyle(nicknameDisplay.fontSize, nicknameDisplay.color, "850", "center"))
        .setOrigin(0.5, 0)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.editLeaderboardNickname());
      nicknameText.setWordWrapWidth(panelLayout.panelWidth - 44);
      const submitButton = this.add.text(panelLayout.submitButton.x, panelLayout.submitButton.y, submitLabel, this.textStyle(13, submitCta.text, "850", "center"))
        .setOrigin(0.5, 0)
        .setPadding(submitCta.primary ? 22 : 18, panelLayout.compact ? 7 : 8)
        .setBackgroundColor(submitCta.fill)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.submitLeaderboardScore());
      submitButton.setAlpha(submitCta.primary || submitted || submitting ? 1 : 0.9);
      const todayButton = this.add.text(panelLayout.todayButton.x, panelLayout.todayButton.y, "Today", this.textStyle(11, scope === "today" ? "#07131e" : "#f6fbff", "850", "center"))
        .setOrigin(0.5, 0)
        .setPadding(10, 7)
        .setBackgroundColor(scope === "today" ? "#35e6d0" : "#102839")
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.setLeaderboardScope("today"));
      const allTimeButton = this.add.text(panelLayout.allTimeButton.x, panelLayout.allTimeButton.y, "All-Time", this.textStyle(11, scope === "alltime" ? "#07131e" : "#f6fbff", "850", "center"))
        .setOrigin(0.5, 0)
        .setPadding(10, 7)
        .setBackgroundColor(scope === "alltime" ? "#35e6d0" : "#102839")
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.setLeaderboardScope("alltime"));
      const leaderboardText = this.add.text(
        panelLayout.leaderboardText.x,
        panelLayout.leaderboardText.y,
        leaderboardLines.join("\n"),
        this.textStyle(10, "#f6fbff", "800", "center")
      );
      leaderboardText.setOrigin(0.5, 0);
      leaderboardText.setAlign("center");
      leaderboardText.setWordWrapWidth(panelLayout.panelWidth - 48);
      const submitStatus = this.add.text(panelLayout.submitStatus.x, panelLayout.submitStatus.y, submitMessage, this.textStyle(9, "#bfd1dc", "760", "center"));
      submitStatus.setOrigin(0.5, 0);
      submitStatus.setAlign("center");
      submitStatus.setWordWrapWidth(panelLayout.panelWidth - 44);
      const restart = this.add.text(panelLayout.playAgainButton.x, panelLayout.playAgainButton.y, "Play Again", this.textStyle(15, "#07131e", "850", "center"))
        .setOrigin(0.5, 0)
        .setPadding(24, 9)
        .setBackgroundColor("#35e6d0")
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.restartGame());
      this.gameOverLayer.add([scrim, panel, title, score, detail, divider, leaderboardHeading, nicknameText, submitButton, todayButton, allTimeButton, leaderboardText, submitStatus, restart]);
      this.syncLeaderboardSubmitPanel();
    }

    destroyPortraitPrompt() {
      this.portraitPromptItems.forEach((item) => item.destroy());
      this.portraitPromptItems = [];
      this.portraitPromptActive = false;
    }

    updatePortraitPrompt(width, height) {
      const shouldShow = shouldShowPortraitPrompt({ width, height });
      if (!shouldShow) {
        this.destroyPortraitPrompt();
        return;
      }
      this.destroyPortraitPrompt();
      this.portraitPromptActive = true;
      const centerX = width / 2;
      const centerY = height / 2;
      const panelWidth = Math.min(348, width - 32);
      const scrim = this.add.rectangle(centerX, centerY, width + 8, height + 8, 0x03070d, 0.86).setInteractive();
      scrim.setDepth(120);
      const panel = this.add.rectangle(centerX, centerY, panelWidth, 140, 0x0b1622, 0.98);
      panel.setStrokeStyle(2, 0xffd02e, 0.88);
      panel.setDepth(121);
      const title = this.add.text(centerX, centerY - 44, "Rotate to portrait", this.textStyle(22, "#f6fbff", "850", "center"));
      title.setOrigin(0.5, 0);
      title.setDepth(122);
      const message = this.add.text(
        centerX,
        centerY - 4,
        "Turn your phone back to portrait to keep playing.",
        this.textStyle(13, "#bfd1dc", "800", "center")
      );
      message.setOrigin(0.5, 0);
      message.setWordWrapWidth(panelWidth - 42);
      message.setDepth(122);
      this.portraitPromptItems = [scrim, panel, title, message];
    }
  }

  function bootPhaserGame(Phaser) {
    if (!Phaser || typeof document === "undefined") return null;
    const target = document.getElementById("ringzzle-game");
    if (!target) return null;
    const size = getGameSurfaceSize();
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: "ringzzle-game",
      width: size.width,
      height: size.height,
      backgroundColor: "#08151c",
      input: {
        activePointers: 3,
      },
      scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.NO_CENTER,
      },
      render: {
        antialias: true,
        pixelArt: false,
      },
      scene: RingzzleScene,
    });
    root.RingzzleGameInstance = game;
    return game;
  }

  const RingzzleCore = {
    BOARD_SIZE,
    TRAY_SIZE,
    SIZES,
    COLORS,
    CLIENT_VERSION,
    START_COLOR_COUNT,
    MAX_COLOR_COUNT,
    UNITY_COLOR_SCORE_THRESHOLDS,
    COLOR_PROGRESSION,
    SCORE,
    STORAGE_KEYS,
    ORIENTATION_RECOVERY_DELAYS,
    DRAG_LIFT,
    LINE_INDICATOR_DURATION,
    COLOR_BURST_EFFECT_DURATION,
    TRAY_RING_RENDER_SCALE,
    TRAY_VISUAL_STYLE,
    SOUND_DEFAULT_ENABLED,
    SOUND_MIN_INTERVAL_MS,
    LEADERBOARD_AUTO_SUBMIT,
    LEADERBOARD_ROUTE,
    LEADERBOARD_OPEN_MODE,
    LEADERBOARD_NICKNAME_ENTRY_MODE,
    LEADERBOARD_INLINE_NICKNAME_INPUT,
    LEADERBOARD_SCOPE_TABS,
    Game,
    createBoard,
    createEmptyCell,
    getTodayKey,
    loadStats,
    normalizeStats,
    completeStats,
    saveStats,
    createBrowserPlayerId,
    getOrCreateBrowserPlayerId,
    validateLeaderboardNicknameClient,
    resolveLeaderboardNicknameForSubmit,
    shouldSubmitLeaderboardAfterNickname,
    getLeaderboardSubmitCta,
    getLeaderboardNicknameDisplay,
    buildLeaderboardReadUrl,
    buildLeaderboardSubmitPayload,
    resolveLeaderboardSubmitState,
    resolveLeaderboardViewState,
    calculateRankButtonLayout,
    calculateGameOverSubmitPanelLayout,
    calculateGameOverPromptPanelLayout,
    calculateLeaderboardModalLayout,
    calculateGameOverLeaderboardLayout,
    getAvailableColorCount,
    formatScore,
    formatCompactScore,
    getMoveFeedbackLabel,
    createSoundState,
    getSoundButtonLabel,
    resolveSoundToggleState,
    getSoundCueSpec,
    getVisualViewportSize,
    syncCssViewportSize,
    shouldShowPortraitPrompt,
    getDragPlacementCell,
    calculateLayoutMetrics,
    calculateHeaderMetrics,
    getBoardTrayVisualGap,
    getScoreBoardVisualGap,
    calculateLineIndicatorGeometry,
    calculateColorBurstCueGeometry,
    calculateTrayRingRenderMetrics,
    resolveDragCleanupState,
    isLocalDevHost,
  };

  return {
    RingzzleCore,
    bootPhaserGame,
  };
});
