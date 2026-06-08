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
  const COLORS = ["#ff5a5f", "#28c76f", "#2f80ed", "#f2c94c", "#9b51e0", "#ff8a00"];
  const DRAG_LIFT = { x: 0, y: -24 };
  const ORIENTATION_RECOVERY_DELAYS = [0, 100, 300, 600];
  const CLIENT_VERSION = "v002";

  const STORAGE_KEYS = {
    highScore: "ringzzleHighScoreV1",
    todayBest: "ringzzleTodayBestV1",
    todayBestDate: "ringzzleTodayBestDateV1",
    gamesPlayed: "ringzzleGamesPlayedV1",
    lastScore: "ringzzleLastScoreV1",
    bestClear: "ringzzleBestClearV1",
  };

  const SCORE = {
    placement: 10,
    lineClear: 100,
    cellBonus: 150,
    multiClearBonus: 50,
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
    if (clearEvents > 1) return `Combo clear +${scoreDelta}`;
    if (cellBonuses > 0) return `Cell bonus +${scoreDelta}`;
    if (lineClears > 0) return `Line clear +${scoreDelta}`;
    return `Placed +${scoreDelta}`;
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
    const short = height < 700;
    const tiny = height < 620;
    const margin = clamp(Math.floor(width * 0.045), 14, compact ? 20 : 28);
    const headerBottom = tiny ? 108 : short ? 124 : compact ? 138 : 152;
    const trayGap = tiny ? 8 : compact ? 12 : 18;
    const trayHeight = tiny ? 88 : compact ? 104 : 116;
    const statusHeight = tiny ? 22 : compact ? 26 : 32;
    const bottomGap = compact ? 22 : 24;
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
    const boardY = Math.floor(headerBottom + Math.min(verticalExtra * 0.25, compact ? 18 : 28));
    const trayY = boardY + resolvedBoardSize + trayGap;
    const slotGap = compact ? 8 : 12;
    const slotWidth = Math.floor(Math.min(compact ? 108 : 132, (availableWidth - slotGap * 2) / TRAY_SIZE));
    const trayPieceSize = Math.floor(Math.min(slotWidth * 0.72, trayHeight * 0.72));

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
      statusY: Math.min(height - bottomGap - statusHeight + 4, trayY + trayHeight + 6),
    };
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
      this.completedStatsSaved = false;
      this.stats = loadStats(this.storage, this.todayProvider);
      this.highScore = this.stats.highScore;
      this.pieceSequence = 0;
      this.tray = [];
      this.refillTray();
    }

    randomIndex(max) {
      return Math.max(0, Math.min(max - 1, Math.floor(this.rng() * max)));
    }

    createRandomPiece() {
      const sequence = this.pieceSequence;
      this.pieceSequence += 1;
      const size = this.sizes[sequence % this.sizes.length];
      const color = (this.randomIndex(this.colors.length) + sequence) % this.colors.length;
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

      buildLines().forEach((line) => {
        this.sizes.forEach((size) => {
          const values = line.cells.map(([x, y]) => this.board[y][x][size]);
          if (values.every((value) => value !== null) && values.every((value) => value === values[0])) {
            lineEvents.push({ type: "line", id: line.id, size, color: values[0] });
            line.cells.forEach(([x, y]) => clearKeys.add(ringKey(x, y, size)));
          }
        });
      });

      for (let y = 0; y < this.height; y += 1) {
        for (let x = 0; x < this.width; x += 1) {
          const values = this.sizes.map((size) => this.board[y][x][size]);
          if (values.every((value) => value !== null) && values.every((value) => value === values[0])) {
            cellEvents.push({ type: "cell", id: `cell-${x}-${y}`, color: values[0], x, y });
            this.sizes.forEach((size) => clearKeys.add(ringKey(x, y, size)));
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
        clearEvents: lineEvents.length + cellEvents.length,
        clearedRings: rings.length,
        rings,
        cells: uniqueCellsFromRings(rings),
        lineEvents,
        cellEvents,
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
      this.bestClearThisGame = Math.max(this.bestClearThisGame, clearResult.clearEvents);
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
      this.completedStatsSaved = false;
      this.stats = loadStats(this.storage, this.todayProvider);
      this.highScore = this.stats.highScore;
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
      this.previewCell = null;
      this.clearFlashCells = [];
      this.invalidFlashCell = null;
      this.scorePopItems = [];
      this.trayOrigins = [];
      this.resizeFrame = 0;
      this.resizeTimers = [];
      this.viewportResizeHandler = null;
      this.orientationResizeHandler = null;
      this.portraitPromptItems = [];
      this.portraitPromptActive = false;
    }

    create() {
      this.gameModel = new Game();
      this.cameras.main.setBackgroundColor("#13281f");
      this.buildStaticUi();
      this.input.on("pointermove", this.handlePointerMove, this);
      this.input.on("pointerup", this.handlePointerUp, this);
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
      this.titleText = this.add.text(0, 0, "Ringzzle", this.textStyle(34, "#f8fff9", "800"));
      this.subtitleText = this.add.text(
        0,
        0,
        "Free color rings puzzle game. No install. Just play.",
        this.textStyle(14, "#d3e4d7", "650")
      );
      this.metricBacks = Array.from({ length: 3 }, () => this.add.rectangle(0, 0, 100, 34, 0xf8fbf6, 0.1));
      this.metricTexts = Array.from({ length: 3 }, () => this.add.text(0, 0, "", this.textStyle(12, "#f8fff9", "800")));
      this.statusText = this.add.text(0, 0, "", this.textStyle(13, "#d3e4d7", "750"));
      this.restartButton = this.add.text(0, 0, "Restart", this.textStyle(13, "#13281f", "850"))
        .setPadding(12, 7)
        .setBackgroundColor("#f8fff9")
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.restartGame());

      this.boardLayer = this.add.container(0, 0).setDepth(10);
      this.trayLayer = this.add.container(0, 0).setDepth(20);
      this.feedbackLayer = this.add.container(0, 0).setDepth(70);
      this.gameOverLayer = this.add.container(0, 0).setDepth(90);
    }

    addViewportListeners() {
      if (typeof window === "undefined") return;
      this.viewportResizeHandler = () => this.scheduleViewportResize({ reason: "viewport" });
      this.orientationResizeHandler = () => this.scheduleViewportResize({ reason: "orientation", cancelDrag: true });
      window.addEventListener("resize", this.viewportResizeHandler, { passive: true });
      window.addEventListener("orientationchange", this.orientationResizeHandler, { passive: true });
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", this.viewportResizeHandler, { passive: true });
        window.visualViewport.addEventListener("scroll", this.viewportResizeHandler, { passive: true });
      }
    }

    removeViewportListeners() {
      if (typeof window !== "undefined" && this.viewportResizeHandler) {
        window.removeEventListener("resize", this.viewportResizeHandler);
        if (this.orientationResizeHandler) window.removeEventListener("orientationchange", this.orientationResizeHandler);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener("resize", this.viewportResizeHandler);
          window.visualViewport.removeEventListener("scroll", this.viewportResizeHandler);
        }
        if (this.resizeFrame) window.cancelAnimationFrame(this.resizeFrame);
      }
      this.clearViewportRelayoutTimers();
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

      const {
        availableWidth,
        compact,
        margin,
        short,
        tiny,
        topY,
      } = this.layout;

      this.titleText.setFontSize(tiny ? 25 : compact ? 30 : 36);
      this.subtitleText.setFontSize(tiny ? 11 : compact ? 12 : 14);
      this.titleText.setPosition(margin, topY);
      this.subtitleText.setPosition(margin, topY + (tiny ? 30 : compact ? 38 : 44));
      this.subtitleText.setWordWrapWidth(Math.max(180, width - margin * 2 - this.restartButton.width - 12));

      const chipY = tiny ? 78 : short ? 90 : compact ? 100 : 112;
      const chipGap = compact ? 6 : 9;
      const chipHeight = tiny ? 28 : compact ? 32 : 36;
      const chipWidth = Math.floor(Math.min(compact ? 110 : 132, (availableWidth - chipGap * 2) / 3));
      let chipX = margin;
      this.metricBacks.forEach((back) => {
        back.setSize(chipWidth, chipHeight);
        back.setPosition(chipX + chipWidth / 2, chipY);
        back.setStrokeStyle(1, 0xffffff, 0.14);
        chipX += chipWidth + chipGap;
      });
      this.metricTexts.forEach((text, index) => {
        text.setFontSize(tiny ? 10 : compact ? 11 : 12);
        text.setPosition(margin + index * (chipWidth + chipGap) + 9, chipY - (tiny ? 7 : 8));
      });

      this.restartButton.setFontSize(tiny ? 12 : compact ? 13 : 14);
      this.restartButton.setPadding(compact ? 10 : 14, compact ? 7 : 8);
      this.restartButton.setPosition(width - this.restartButton.width - margin, topY + 2);
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
      doc.dataset.ringzzleStatusBottom = String(Math.round(statusBottom));
      doc.style.setProperty("--ringzzle-board-bottom", `${Math.round(boardBottom)}px`);
      doc.style.setProperty("--ringzzle-tray-bottom", `${Math.round(trayBottom)}px`);
      doc.style.setProperty("--ringzzle-status-bottom", `${Math.round(statusBottom)}px`);
    }

    restartGame() {
      this.cancelActiveDragForRelayout();
      this.clearFlashCells = [];
      this.invalidFlashCell = null;
      this.previewCell = null;
      this.clearScorePops();
      this.statusText.setText("");
      this.gameModel.restart();
      this.render();
    }

    render() {
      if (!this.layout || !this.gameModel) return;
      this.renderMetrics();
      this.renderBoard();
      this.renderTray();
      this.renderGameOverPanel();
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
      doc.dataset.ringzzleGameOver = String(this.gameModel.gameOver);
      doc.dataset.ringzzleClientVersion = CLIENT_VERSION;
    }

    drawRing(graphics, x, y, sizeName, colorIndex, cellSize, alpha) {
      const radiusScale = { small: 0.18, medium: 0.285, large: 0.39 };
      const strokeScale = { small: 0.06, medium: 0.066, large: 0.072 };
      const radius = cellSize * radiusScale[sizeName];
      const strokeWidth = Math.max(4, cellSize * strokeScale[sizeName]);
      const color = hexToNumber(COLORS[colorIndex % COLORS.length]);
      graphics.lineStyle(strokeWidth + 2, 0x07130f, (alpha || 1) * 0.26);
      graphics.strokeCircle(x, y + 1, radius);
      graphics.lineStyle(strokeWidth, color, alpha || 1);
      graphics.strokeCircle(x, y, radius);
      graphics.lineStyle(1.25, 0xffffff, (alpha || 1) * 0.48);
      graphics.strokeCircle(x, y - 0.5, radius);
    }

    drawRingGuide(graphics, x, y, sizeName, cellSize) {
      const radiusScale = { small: 0.18, medium: 0.285, large: 0.39 };
      const radius = cellSize * radiusScale[sizeName];
      graphics.lineStyle(Math.max(1, cellSize * 0.012), 0xf8fff9, 0.12);
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
      const pad = Math.max(5, Math.floor(cellSize * 0.04));
      const radius = Math.max(8, Math.floor(cellSize * 0.08));

      g.fillStyle(0x07130f, 0.28);
      g.fillRoundedRect(origin.x - 6, origin.y + 4, boardSize + 12, boardSize + 12, 12);
      g.fillStyle(0xeefaf0, 0.08);
      g.fillRoundedRect(origin.x - 4, origin.y - 4, boardSize + 8, boardSize + 8, 10);

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
            ? (this.previewCell.valid ? 0x38d982 : 0xff5a5f)
            : isInvalid
              ? 0xff5a5f
            : 0xf8fff9;
          const alpha = isPreview ? (this.previewCell.valid ? 0.28 : 0.34) : isInvalid ? 0.22 : 0.10;
          g.fillStyle(fill, alpha);
          g.fillRoundedRect(cellX + pad, cellY + pad, cellSize - pad * 2, cellSize - pad * 2, radius);
          const strokeColor = isFlash ? 0xf2c94c : isInvalid ? 0xff5a5f : isPreview ? fill : 0xffffff;
          const strokeAlpha = isFlash ? 0.9 : isInvalid ? 0.86 : isPreview ? 0.78 : 0.16;
          const strokeWidth = isFlash || isInvalid || isPreview ? 3 : 1.5;
          g.lineStyle(strokeWidth, strokeColor, strokeAlpha);
          g.strokeRoundedRect(cellX + pad, cellY + pad, cellSize - pad * 2, cellSize - pad * 2, radius);
          if ((isPreview && !this.previewCell.valid) || isInvalid) {
            const crossInset = cellSize * 0.28;
            g.lineStyle(Math.max(3, cellSize * 0.035), 0xfff1f2, 0.72);
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

      for (let index = 0; index < TRAY_SIZE; index += 1) {
        const center = this.getTraySlotCenter(index);
        this.trayOrigins[index] = center;
        const x = center.x - layout.slotWidth / 2;
        const y = layout.trayY;
        const piece = this.gameModel.tray[index];
        const isDragging = this.dragState && this.dragState.slotIndex === index;
        const filled = piece && !isDragging && !this.gameModel.gameOver;

        g.fillStyle(0xf8fff9, filled ? 0.12 : 0.055);
        g.fillRoundedRect(x, y, layout.slotWidth, layout.trayHeight, 8);
        g.lineStyle(1.5, 0xffffff, filled ? 0.16 : 0.08);
        g.strokeRoundedRect(x, y, layout.slotWidth, layout.trayHeight, 8);

        if (piece && !isDragging) {
          const cellSize = layout.trayPieceSize * 1.35;
          this.drawRing(g, center.x, center.y - 2, piece.size, piece.color, cellSize, this.gameModel.gameOver ? 0.34 : 1);
        }

        const zone = this.add.zone(center.x, center.y, layout.slotWidth, layout.trayHeight);
        if (piece && !this.gameModel.gameOver) {
          zone.setInteractive({ useHandCursor: true });
          zone.on("pointerdown", (pointer) => this.startDrag(index, pointer));
        }
        this.trayLayer.add(zone);
      }
    }

    startDrag(slotIndex, pointer) {
      if (this.gameModel.gameOver || this.portraitPromptActive) return;
      const piece = this.gameModel.tray[slotIndex];
      if (!piece) return;
      const trayOrigin = this.trayOrigins[slotIndex] || { x: pointer.x, y: pointer.y };
      const ghost = this.add.graphics().setDepth(80);
      this.drawRing(ghost, 0, 0, piece.size, piece.color, this.layout.cellSize * 1.02, 0.94);
      ghost.setPosition(trayOrigin.x, trayOrigin.y);
      this.dragState = {
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
        this.animateGhostBackToTray(state);
        return;
      }

      const result = this.gameModel.placeTrayPiece(state.slotIndex, boardCell.x, boardCell.y);
      if (!result.placed) {
        this.statusText.setText(result.reason === "occupied-size" ? "That size is already there." : "Try another spot.");
        this.flashInvalidCell(boardCell);
        this.renderBoard();
        this.animateGhostBackToTray(state);
        return;
      }

      state.ghost.destroy();
      this.dragState = null;
      this.clearFlashCells = result.cells || [];
      this.invalidFlashCell = null;
      this.statusText.setText(getMoveFeedbackLabel(result, this.gameModel.gameOver));
      this.render();
      this.playScorePop(result, state);
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

    playScorePop(result, state) {
      if (!result || !result.placed || !this.layout || !this.feedbackLayer) return;
      const placed = result.placedRing || {};
      const cellSize = this.layout.cellSize;
      const x = this.layout.boardOrigin.x + (Number.isFinite(placed.x) ? placed.x + 0.5 : 1.5) * cellSize;
      const y = this.layout.boardOrigin.y + (Number.isFinite(placed.y) ? placed.y + 0.5 : 1.5) * cellSize;
      const label = result.clearEvents
        ? getMoveFeedbackLabel(result, false)
        : `+${Math.max(0, Number.parseInt(result.scoreDelta || 0, 10) || 0)}`;
      const color = result.cellBonuses ? "#f2c94c" : result.clearEvents ? "#38d982" : "#f8fff9";
      const text = this.add.text(x, y - cellSize * 0.36, label, this.textStyle(15, color, "900", "center"));
      text.setOrigin(0.5, 0.5);
      const back = this.add.rectangle(x, text.y, text.width + 22, text.height + 12, 0x07130f, 0.58);
      back.setStrokeStyle(1, result.clearEvents ? 0x38d982 : 0xffffff, result.clearEvents ? 0.54 : 0.18);
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
      state.returning = true;
      this.tweens.add({
        targets: state.ghost,
        x: state.trayOrigin.x,
        y: state.trayOrigin.y,
        alpha: 0.48,
        scaleX: 0.78,
        scaleY: 0.78,
        duration: 210,
        ease: "Cubic.easeOut",
        onComplete: () => {
          state.ghost.destroy();
          this.dragState = null;
          this.previewCell = null;
          this.statusText.setText("");
          this.render();
        },
      });
    }

    cancelActiveDragForRelayout() {
      if (!this.dragState) return;
      if (this.dragState.ghost) this.dragState.ghost.destroy();
      this.dragState = null;
      this.previewCell = null;
      this.invalidFlashCell = null;
      this.render();
    }

    renderGameOverPanel() {
      this.gameOverLayer.removeAll(true);
      if (!this.gameModel.gameOver) return;
      const width = this.layout.width;
      const height = this.layout.height;
      const panelWidth = Math.min(330, width - 32);
      const panelHeight = 244;
      const centerX = width / 2;
      const centerY = height / 2;
      const scrim = this.add.rectangle(centerX, centerY, width + 8, height + 8, 0x07130f, 0.62).setInteractive();
      const panel = this.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0xf8fff9, 0.98);
      panel.setStrokeStyle(2, 0x38d982, 0.9);
      const title = this.add.text(centerX, centerY - 96, "Game Over", this.textStyle(25, "#13281f", "850", "center"));
      title.setOrigin(0.5, 0);
      const score = this.add.text(
        centerX,
        centerY - 50,
        `Final score ${formatScore(this.gameModel.score)}`,
        this.textStyle(18, "#13281f", "850", "center")
      );
      score.setOrigin(0.5, 0);
      const stats = this.gameModel.stats;
      const detail = this.add.text(
        centerX,
        centerY - 13,
        `Best ${formatScore(this.gameModel.highScore)}\nToday ${formatScore(stats.todayBest)}   Games ${formatScore(stats.gamesPlayed)}`,
        this.textStyle(12, "#355245", "800", "center")
      );
      detail.setOrigin(0.5, 0);
      detail.setLineSpacing(5);
      const restart = this.add.text(centerX, centerY + 60, "Restart", this.textStyle(15, "#f8fff9", "850", "center"))
        .setOrigin(0.5, 0)
        .setPadding(18, 10)
        .setBackgroundColor("#13281f")
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.restartGame());
      this.gameOverLayer.add([scrim, panel, title, score, detail, restart]);
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
      const scrim = this.add.rectangle(centerX, centerY, width + 8, height + 8, 0x07130f, 0.86).setInteractive();
      scrim.setDepth(120);
      const panel = this.add.rectangle(centerX, centerY, panelWidth, 140, 0xf8fff9, 0.98);
      panel.setStrokeStyle(2, 0xf2c94c, 0.95);
      panel.setDepth(121);
      const title = this.add.text(centerX, centerY - 44, "Rotate to portrait", this.textStyle(22, "#13281f", "850", "center"));
      title.setOrigin(0.5, 0);
      title.setDepth(122);
      const message = this.add.text(
        centerX,
        centerY - 4,
        "Turn your phone back to portrait to keep playing.",
        this.textStyle(13, "#355245", "800", "center")
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
    return new Phaser.Game({
      type: Phaser.AUTO,
      parent: "ringzzle-game",
      width: size.width,
      height: size.height,
      backgroundColor: "#13281f",
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
  }

  const RingzzleCore = {
    BOARD_SIZE,
    TRAY_SIZE,
    SIZES,
    COLORS,
    CLIENT_VERSION,
    SCORE,
    STORAGE_KEYS,
    ORIENTATION_RECOVERY_DELAYS,
    DRAG_LIFT,
    Game,
    createBoard,
    createEmptyCell,
    getTodayKey,
    loadStats,
    normalizeStats,
    completeStats,
    saveStats,
    formatScore,
    formatCompactScore,
    getMoveFeedbackLabel,
    getVisualViewportSize,
    syncCssViewportSize,
    shouldShowPortraitPrompt,
    getDragPlacementCell,
    calculateLayoutMetrics,
  };

  return {
    RingzzleCore,
    bootPhaserGame,
  };
});
