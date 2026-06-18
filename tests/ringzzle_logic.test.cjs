const assert = require("assert");

const { RingzzleCore } = require("../static/play/js/ringzzle-phaser.v031.js");

function memoryStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? String(store[key]) : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    dump() {
      return { ...store };
    },
  };
}

function piece(size, color) {
  return { size, color };
}

function makeGame(options = {}) {
  return new RingzzleCore.Game({
    rng: () => 0,
    storage: memoryStorage(),
    todayProvider: () => new Date("2026-06-08T00:00:00Z"),
    ...options,
  });
}

function sequenceRng(values) {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
}

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

test("starts with a 3x3 board and three single-ring tray pieces", () => {
  const game = makeGame();

  assert.strictEqual(game.width, 3);
  assert.strictEqual(game.height, 3);
  assert.strictEqual(game.tray.length, 3);
  assert.deepStrictEqual(game.sizes, ["small", "medium", "large"]);
  assert.strictEqual(game.board.length, 3);
  assert.strictEqual(game.board[0].length, 3);
  assert.deepStrictEqual(game.board[0][0], { small: null, medium: null, large: null });
  assert.ok(game.tray.every((trayPiece) => RingzzleCore.SIZES.includes(trayPiece.size)));
  assert.ok(game.tray.every((trayPiece) => trayPiece.color < RingzzleCore.START_COLOR_COUNT));
});

test("places a tray ring into an empty matching size slot and disables the tray slot", () => {
  const game = makeGame();
  game.tray = [piece("small", 2), piece("medium", 3), piece("large", 4)];

  const result = game.placeTrayPiece(0, 1, 1);

  assert.strictEqual(result.placed, true);
  assert.strictEqual(game.board[1][1].small, 2);
  assert.strictEqual(game.tray[0], null);
  assert.strictEqual(result.scoreDelta, 10);
  assert.strictEqual(game.score, 10);
});

test("rejects placement when the target cell already has that ring size", () => {
  const game = makeGame();
  game.board[1][1].small = 1;
  game.tray = [piece("small", 2), piece("medium", 3), piece("large", 4)];

  const result = game.placeTrayPiece(0, 1, 1);

  assert.strictEqual(result.placed, false);
  assert.strictEqual(result.reason, "occupied-size");
  assert.strictEqual(game.board[1][1].small, 1);
  assert.deepStrictEqual(game.tray[0], piece("small", 2));
  assert.strictEqual(game.score, 0);
});

test("refills the tray only after all three tray slots have been used", () => {
  const game = makeGame();
  game.tray = [piece("small", 1), piece("medium", 2), piece("large", 3)];

  game.placeTrayPiece(0, 0, 0);
  assert.strictEqual(game.tray[0], null);
  assert.notStrictEqual(game.tray[1], null);
  assert.notStrictEqual(game.tray[2], null);

  game.placeTrayPiece(1, 1, 0);
  assert.strictEqual(game.tray[1], null);
  assert.notStrictEqual(game.tray[2], null);

  game.placeTrayPiece(2, 2, 0);
  assert.strictEqual(game.tray.length, 3);
  assert.ok(game.tray.every(Boolean), "tray should refill after the third piece is used");
});

test("clears a row when colors match even if ring sizes differ", () => {
  const game = makeGame();
  game.board[0][0].small = 2;
  game.board[0][1].medium = 2;
  game.tray = [piece("large", 2), null, null];

  const result = game.placeTrayPiece(0, 2, 0);

  assert.strictEqual(result.placed, true);
  assert.strictEqual(result.lineClears, 1);
  assert.strictEqual(result.clearedRings, 3);
  assert.strictEqual(result.scoreDelta, 110);
  assert.deepStrictEqual(game.board[0][0], { small: null, medium: null, large: null });
  assert.deepStrictEqual(game.board[0][1], { small: null, medium: null, large: null });
  assert.deepStrictEqual(game.board[0][2], { small: null, medium: null, large: null });
});

test("does not clear a row when colors differ even if ring sizes match", () => {
  const game = makeGame();
  game.board[0][0].small = 2;
  game.board[0][1].small = 2;
  game.tray = [piece("small", 3), null, null];

  const result = game.placeTrayPiece(0, 2, 0);

  assert.strictEqual(result.placed, true);
  assert.strictEqual(result.lineClears, 0);
  assert.strictEqual(game.board[0][0].small, 2);
  assert.strictEqual(game.board[0][1].small, 2);
  assert.strictEqual(game.board[0][2].small, 3);
});

test("clears a column by color regardless of ring sizes", () => {
  const game = makeGame();
  game.board[0][1].small = 1;
  game.board[1][1].medium = 1;
  game.tray = [piece("large", 1), null, null];

  const result = game.placeTrayPiece(0, 1, 2);

  assert.strictEqual(result.placed, true);
  assert.strictEqual(result.lineClears, 1);
  assert.strictEqual(result.clearedRings, 3);
  assert.deepStrictEqual(game.board[0][1], { small: null, medium: null, large: null });
  assert.deepStrictEqual(game.board[1][1], { small: null, medium: null, large: null });
  assert.deepStrictEqual(game.board[2][1], { small: null, medium: null, large: null });
});

test("clears a diagonal by color regardless of ring sizes", () => {
  const game = makeGame();
  game.board[0][0].small = 3;
  game.board[1][1].medium = 3;
  game.tray = [piece("large", 3), null, null];

  const result = game.placeTrayPiece(0, 2, 2);

  assert.strictEqual(result.placed, true);
  assert.strictEqual(result.lineClears, 1);
  assert.strictEqual(result.clearedRings, 3);
  assert.deepStrictEqual(game.board[0][0], { small: null, medium: null, large: null });
  assert.deepStrictEqual(game.board[1][1], { small: null, medium: null, large: null });
  assert.deepStrictEqual(game.board[2][2], { small: null, medium: null, large: null });
});

test("removes only matching-color rings from a cleared line", () => {
  const game = makeGame();
  game.board[2][0].small = 2;
  game.board[2][0].medium = 4;
  game.board[2][1].medium = 2;
  game.board[2][1].large = 5;
  game.board[2][2].small = 0;
  game.tray = [piece("large", 2), null, null];

  const result = game.placeTrayPiece(0, 2, 2);

  assert.strictEqual(result.placed, true);
  assert.strictEqual(result.lineClears, 1);
  assert.strictEqual(result.clearedRings, 3);
  assert.deepStrictEqual(game.board[2][0], { small: null, medium: 4, large: null });
  assert.deepStrictEqual(game.board[2][1], { small: null, medium: null, large: 5 });
  assert.deepStrictEqual(game.board[2][2], { small: 0, medium: null, large: null });
});

test("supports overlapping color line clears without double-counting the center ring", () => {
  const game = makeGame();
  game.board[1][0].small = 4;
  game.board[1][2].large = 4;
  game.board[0][1].medium = 4;
  game.board[2][1].large = 4;
  game.tray = [piece("medium", 4), null, null];

  const result = game.placeTrayPiece(0, 1, 1);

  assert.strictEqual(result.placed, true);
  assert.strictEqual(result.lineClears, 2);
  assert.strictEqual(result.clearedRings, 5);
  assert.strictEqual(result.scoreDelta, 260);
  assert.strictEqual(game.score, 260);
  assert.strictEqual(game.bestClearThisGame, 2);
  assert.deepStrictEqual(game.board[1][0], { small: null, medium: null, large: null });
  assert.deepStrictEqual(game.board[1][1], { small: null, medium: null, large: null });
  assert.deepStrictEqual(game.board[1][2], { small: null, medium: null, large: null });
  assert.deepStrictEqual(game.board[0][1], { small: null, medium: null, large: null });
  assert.deepStrictEqual(game.board[2][1], { small: null, medium: null, large: null });
});

test("same-cell full color triggers Color Burst across the board", () => {
  const game = makeGame();
  game.board[2][2].small = 5;
  game.board[2][2].medium = 5;
  game.board[0][0].small = 5;
  game.board[0][1].medium = 5;
  game.board[1][0].large = 4;
  game.board[1][1].small = 2;
  game.tray = [piece("large", 5), null, null];

  const result = game.placeTrayPiece(0, 2, 2);

  assert.strictEqual(result.placed, true);
  assert.strictEqual(result.colorBursts, 1);
  assert.strictEqual(result.cellBonuses, 1);
  assert.strictEqual(result.clearedRings, 5);
  assert.strictEqual(result.scoreDelta, 160);
  assert.strictEqual(result.colorBurstEvents[0].color, 5);
  assert.deepStrictEqual(result.colorBurstEvents[0].source, { x: 2, y: 2 });
  assert.strictEqual(result.colorBurstEvents[0].targets.length, 5);
  assert.deepStrictEqual(game.board[0][0], { small: null, medium: null, large: null });
  assert.deepStrictEqual(game.board[0][1], { small: null, medium: null, large: null });
  assert.deepStrictEqual(game.board[1][0], { small: null, medium: null, large: 4 });
  assert.deepStrictEqual(game.board[1][1], { small: 2, medium: null, large: null });
  assert.deepStrictEqual(game.board[2][2], { small: null, medium: null, large: null });
});

test("Color Burst preserves other colors and does not double-count overlapping line clears", () => {
  const game = makeGame();
  game.board[0][0].small = 1;
  game.board[1][0].large = 1;
  game.board[2][0].small = 1;
  game.board[2][0].medium = 1;
  game.board[1][1].small = 4;
  game.board[1][2].large = 1;
  game.board[2][2].medium = 1;
  game.tray = [piece("large", 1), null, null];

  const result = game.placeTrayPiece(0, 0, 2);

  assert.strictEqual(result.placed, true);
  assert.strictEqual(result.lineClears, 1);
  assert.strictEqual(result.colorBursts, 1);
  assert.strictEqual(result.clearEvents, 2);
  assert.strictEqual(result.clearedRings, 7);
  assert.strictEqual(result.scoreDelta, 310);
  assert.deepStrictEqual(game.board[0][0], { small: null, medium: null, large: null });
  assert.deepStrictEqual(game.board[1][0], { small: null, medium: null, large: null });
  assert.deepStrictEqual(game.board[1][1], { small: 4, medium: null, large: null });
  assert.deepStrictEqual(game.board[1][2], { small: null, medium: null, large: null });
  assert.deepStrictEqual(game.board[2][0], { small: null, medium: null, large: null });
  assert.deepStrictEqual(game.board[2][2], { small: null, medium: null, large: null });
});

test("reports game over when no active tray ring can fit anywhere", () => {
  const game = makeGame();
  for (let y = 0; y < 3; y += 1) {
    for (let x = 0; x < 3; x += 1) {
      game.board[y][x] = { small: 1, medium: 2, large: 3 };
    }
  }
  game.board[2][2].large = null;
  game.tray = [piece("small", 4), piece("medium", 5), null];

  assert.strictEqual(game.checkGameOver(), true);
  assert.strictEqual(game.gameOver, true);
});

test("stores high score and local play stats without backend dependencies", () => {
  const storage = memoryStorage();
  const game = makeGame({ storage });
  game.score = 320;
  game.bestClearThisGame = 2;

  game.recordCompletedGameStats();
  const stored = storage.dump();

  assert.strictEqual(stored.ringzzleHighScoreV1, "320");
  assert.strictEqual(stored.ringzzleTodayBestV1, "320");
  assert.strictEqual(stored.ringzzleTodayBestDateV1, "2026-06-08");
  assert.strictEqual(stored.ringzzleGamesPlayedV1, "1");
  assert.strictEqual(stored.ringzzleLastScoreV1, "320");
  assert.strictEqual(stored.ringzzleBestClearV1, "2");
});

test("resets today best when the stored date is stale", () => {
  const storage = memoryStorage({
    ringzzleTodayBestV1: "999",
    ringzzleTodayBestDateV1: "2026-06-07",
  });

  const stats = RingzzleCore.loadStats(storage, () => new Date("2026-06-08T00:00:00Z"));

  assert.strictEqual(stats.todayBest, 0);
  assert.strictEqual(stats.todayBestDate, "2026-06-08");
});

test("starts available color count low for early games", () => {
  const game = makeGame({ rng: () => 0.999 });

  assert.strictEqual(RingzzleCore.START_COLOR_COUNT, 3);
  assert.strictEqual(RingzzleCore.getAvailableColorCount(0), 3);
  assert.strictEqual(game.availableColorCount, 3);
  assert.ok(game.tray.every((trayPiece) => trayPiece.color < 3));
});

test("increases available color count by score progression", () => {
  assert.strictEqual(RingzzleCore.getAvailableColorCount(249), 3);
  assert.strictEqual(RingzzleCore.getAvailableColorCount(250), 4);
  assert.strictEqual(RingzzleCore.getAvailableColorCount(799), 4);
  assert.strictEqual(RingzzleCore.getAvailableColorCount(800), 5);
  assert.strictEqual(RingzzleCore.getAvailableColorCount(1599), 5);
  assert.strictEqual(RingzzleCore.getAvailableColorCount(1600), 6);
});

test("caps available color count at the configured maximum", () => {
  assert.strictEqual(RingzzleCore.MAX_COLOR_COUNT, 6);
  assert.strictEqual(RingzzleCore.getAvailableColorCount(999999), 6);
  assert.ok(RingzzleCore.getAvailableColorCount(999999) <= RingzzleCore.COLORS.length);
});

test("tray generation respects current available color count", () => {
  const game = makeGame({ rng: () => 0.999 });

  game.score = 800;
  game.refillTray();
  assert.strictEqual(game.availableColorCount, 5);
  assert.ok(game.tray.every((trayPiece) => trayPiece.color < 5));

  game.score = 999999;
  game.refillTray();
  assert.strictEqual(game.availableColorCount, 6);
  assert.ok(game.tray.every((trayPiece) => trayPiece.color < 6));
});

test("tray slot index does not force small medium large size order", () => {
  const game = makeGame({ rng: sequenceRng([0.84, 0.1, 0.42, 0.2, 0.02, 0.3]) });

  assert.deepStrictEqual(game.tray.map((trayPiece) => trayPiece.size), ["large", "medium", "small"]);
  assert.notDeepStrictEqual(game.tray.map((trayPiece) => trayPiece.size), ["small", "medium", "large"]);
});

test("exposes mobile layout helpers for portrait overlay and drag placement", () => {
  assert.deepStrictEqual(RingzzleCore.ORIENTATION_RECOVERY_DELAYS, [0, 100, 300, 600]);
  assert.strictEqual(RingzzleCore.shouldShowPortraitPrompt({ width: 844, height: 390 }), true);
  assert.strictEqual(RingzzleCore.shouldShowPortraitPrompt({ width: 390, height: 844 }), false);

  const cell = RingzzleCore.getDragPlacementCell(
    { x: 155, y: 205 },
    { boardOrigin: { x: 20, y: 100 }, cellSize: 90 },
    { x: 0, y: -20 },
  );
  assert.deepStrictEqual(cell, { x: 1, y: 0 });
});

test("keeps the board and bottom tray inside target iPhone portrait viewports", () => {
  [
    { width: 390, height: 844 },
    { width: 393, height: 852 },
    { width: 430, height: 932 },
  ].forEach((viewport) => {
    const layout = RingzzleCore.calculateLayoutMetrics(viewport.width, viewport.height);
    const boardBottom = layout.boardOrigin.y + layout.boardSize;
    const trayBottom = layout.trayY + layout.trayHeight;
    const statusBottom = layout.statusY + layout.statusHeight;

    assert.ok(layout.boardSize >= 300, `board should stay playable at ${viewport.width}x${viewport.height}`);
    assert.ok(layout.bottomGap >= 20, `bottom reserve should be Safari-safe at ${viewport.width}x${viewport.height}`);
    assert.ok(boardBottom < layout.trayY, `tray should sit below board at ${viewport.width}x${viewport.height}`);
    assert.ok(trayBottom <= viewport.height - layout.bottomGap, `tray should fit at ${viewport.width}x${viewport.height}`);
    assert.ok(statusBottom <= viewport.height, `status should fit at ${viewport.width}x${viewport.height}`);
  });
});

test("sets a JS visible-height CSS variable from visualViewport when available", () => {
  const writes = {};
  const fakeWindow = {
    innerWidth: 390,
    innerHeight: 844,
    visualViewport: {
      width: 393.8,
      height: 735.6,
    },
    document: {
      documentElement: {
        style: {
          setProperty(key, value) {
            writes[key] = value;
          },
        },
      },
    },
  };

  const size = RingzzleCore.syncCssViewportSize(fakeWindow);

  assert.deepStrictEqual(size, { width: 393, height: 735 });
  assert.strictEqual(writes["--ringzzle-viewport-width"], "393px");
  assert.strictEqual(writes["--ringzzle-viewport-height"], "735px");
  assert.strictEqual(writes["--ringzzle-visible-height"], "735px");
});

test("uses compact mobile layout reserves for reduced-height iPhone Safari viewports", () => {
  [
    { width: 390, height: 720 },
    { width: 393, height: 735 },
    { width: 430, height: 780 },
  ].forEach((viewport) => {
    const layout = RingzzleCore.calculateLayoutMetrics(viewport.width, viewport.height);
    const boardBottom = layout.boardOrigin.y + layout.boardSize;
    const trayBottom = layout.trayY + layout.trayHeight;
    const statusBottom = layout.statusY + layout.statusHeight;

    assert.ok(layout.headerBottom <= 116, `header should compact for ${viewport.width}x${viewport.height}`);
    assert.ok(layout.bottomGap >= 64, `bottom reserve should cover Safari toolbar at ${viewport.width}x${viewport.height}`);
    assert.ok(layout.boardSize >= 300, `board should remain playable at ${viewport.width}x${viewport.height}`);
    assert.ok(boardBottom < layout.trayY, `tray should sit below board at ${viewport.width}x${viewport.height}`);
    assert.ok(trayBottom <= viewport.height - layout.bottomGap, `tray should stay above Safari chrome at ${viewport.width}x${viewport.height}`);
    assert.ok(statusBottom <= viewport.height - 8, `status should remain visible at ${viewport.width}x${viewport.height}`);
  });
});

test("keeps compact subtitle clear of score panels on narrow iPhone Safari", () => {
  [
    { width: 390, height: 844 },
    { width: 390, height: 720 },
    { width: 393, height: 735 },
    { width: 430, height: 780 },
  ].forEach((viewport) => {
    const layout = RingzzleCore.calculateLayoutMetrics(viewport.width, viewport.height);
    const header = RingzzleCore.calculateHeaderMetrics(layout);

    assert.ok(header.subtitleBottom + 8 <= header.chipTop, `subtitle should clear score chips at ${viewport.width}x${viewport.height}`);
    assert.ok(header.chipBottom <= layout.boardOrigin.y - 10, `score chips should clear board at ${viewport.width}x${viewport.height}`);
  });
});

test("keeps extra breathing room between score panels and board on mobile", () => {
  [
    { width: 390, height: 844 },
    { width: 393, height: 852 },
    { width: 430, height: 932 },
    { width: 390, height: 720 },
    { width: 393, height: 735 },
    { width: 430, height: 780 },
  ].forEach((viewport) => {
    const layout = RingzzleCore.calculateLayoutMetrics(viewport.width, viewport.height);
    const header = RingzzleCore.calculateHeaderMetrics(layout);

    assert.ok(layout.boardOrigin.y - header.chipBottom >= 34, `score-to-board gap should breathe at ${viewport.width}x${viewport.height}`);
    assert.ok(RingzzleCore.getScoreBoardVisualGap(layout) >= 24, `score-to-board panel gap should be visible at ${viewport.width}x${viewport.height}`);
    assert.ok(layout.boardSize >= 300, `board should remain playable at ${viewport.width}x${viewport.height}`);
  });
});

test("keeps drawn board frame and tray rack visually separated on mobile", () => {
  [
    { width: 350, height: 610 },
    { width: 350, height: 720 },
    { width: 390, height: 844 },
    { width: 393, height: 852 },
    { width: 430, height: 932 },
    { width: 390, height: 720 },
    { width: 393, height: 735 },
    { width: 430, height: 780 },
    { width: 768, height: 1024 },
    { width: 1200, height: 900 },
  ].forEach((viewport) => {
    const layout = RingzzleCore.calculateLayoutMetrics(viewport.width, viewport.height);
    const visualGap = RingzzleCore.getBoardTrayVisualGap(layout);
    const trayMetrics = RingzzleCore.calculateTrayRingRenderMetrics(layout);
    const boardBottom = layout.boardOrigin.y + layout.boardSize;
    const trayRingTop = layout.trayY + layout.trayHeight / 2 - trayMetrics.largestRingDiameter / 2;
    const minVisualGap = viewport.width < 560 ? 12 : 8;
    const trayBottom = layout.trayY + layout.trayHeight;

    assert.ok(visualGap >= minVisualGap, `drawn board/tray gap should be visible at ${viewport.width}x${viewport.height}`);
    assert.ok(trayRingTop >= boardBottom + 20, `large tray rings should clear board frame at ${viewport.width}x${viewport.height}`);
    assert.ok(trayBottom <= viewport.height - layout.bottomGap, `tray should remain above Safari reserve at ${viewport.width}x${viewport.height}`);
  });
});

test("keeps Sound Off one-line control sizing safe on mobile", () => {
  assert.ok(RingzzleCore.SOUND_BUTTON_MIN_WIDTH >= 82, "Sound Off button needs enough width to stay on one line");
  assert.ok(RingzzleCore.CONTROL_BUTTON_MIN_HEIGHT >= 34, "top controls need a tappable minimum height");
  assert.strictEqual(RingzzleCore.getSoundButtonDisplayWidth({ width: 58 }), RingzzleCore.SOUND_BUTTON_MIN_WIDTH);
  assert.strictEqual(RingzzleCore.getSoundButtonDisplayWidth({ width: 94 }), 94);
  assert.strictEqual(RingzzleCore.getControlButtonDisplayHeight({ height: 23 }), RingzzleCore.CONTROL_BUTTON_MIN_HEIGHT);
});

test("keeps status message below tray rings without Safari overflow on mobile", () => {
  [
    { width: 390, height: 844 },
    { width: 393, height: 852 },
    { width: 430, height: 932 },
    { width: 390, height: 720 },
    { width: 393, height: 735 },
    { width: 430, height: 780 },
  ].forEach((viewport) => {
    const layout = RingzzleCore.calculateLayoutMetrics(viewport.width, viewport.height);
    const trayMetrics = RingzzleCore.calculateTrayRingRenderMetrics(layout);
    const trayRingBottom = layout.trayY + layout.trayHeight / 2 + trayMetrics.largestRingDiameter / 2;
    const trayBottom = layout.trayY + layout.trayHeight;
    const statusBottom = layout.statusY + layout.statusHeight;

    assert.ok(layout.statusY >= trayRingBottom + 4, `status should sit below large tray rings at ${viewport.width}x${viewport.height}`);
    assert.ok(layout.statusY >= trayBottom - 6, `status should live below the tray band at ${viewport.width}x${viewport.height}`);
    assert.ok(statusBottom <= viewport.height - 8, `status should remain visible at ${viewport.width}x${viewport.height}`);
    assert.ok(statusBottom <= viewport.height - Math.max(8, layout.bottomGap - 52), `status should clear practical Safari reserve at ${viewport.width}x${viewport.height}`);
    assert.ok(trayBottom <= viewport.height - layout.bottomGap, `tray should stay above Safari reserve at ${viewport.width}x${viewport.height}`);
  });
});

test("tracks drag ghost cleanup transitions defensively", () => {
  let drag = RingzzleCore.resolveDragCleanupState(null, { type: "start", ghostId: "ghost-a" });
  assert.deepStrictEqual(drag.cleanupGhostIds, []);
  assert.strictEqual(drag.state.activeGhostId, "ghost-a");
  assert.strictEqual(drag.state.returning, false);

  drag = RingzzleCore.resolveDragCleanupState(drag.state, { type: "return", tweenId: "tween-a" });
  assert.strictEqual(drag.state.returning, true);
  assert.strictEqual(drag.state.returnTweenId, "tween-a");

  drag = RingzzleCore.resolveDragCleanupState(drag.state, { type: "start", ghostId: "ghost-b" });
  assert.deepStrictEqual(drag.cleanupGhostIds, ["ghost-a"]);
  assert.deepStrictEqual(drag.cleanupTweenIds, ["tween-a"]);
  assert.strictEqual(drag.state.activeGhostId, "ghost-b");
  assert.strictEqual(drag.state.returning, false);

  drag = RingzzleCore.resolveDragCleanupState(drag.state, { type: "valid-drop" });
  assert.deepStrictEqual(drag.cleanupGhostIds, ["ghost-b"]);
  assert.strictEqual(drag.state.activeGhostId, null);

  drag = RingzzleCore.resolveDragCleanupState({ activeGhostId: "ghost-c", returning: true, returnTweenId: "tween-c" }, { type: "cancel" });
  assert.deepStrictEqual(drag.cleanupGhostIds, ["ghost-c"]);
  assert.deepStrictEqual(drag.cleanupTweenIds, ["tween-c"]);
  assert.strictEqual(drag.state.returning, false);
});

test("keeps line match indicators short and inside board bounds", () => {
  const layout = RingzzleCore.calculateLayoutMetrics(390, 720);
  [
    { id: "row-1", color: 0, orientation: "horizontal" },
    { id: "column-2", color: 1, orientation: "vertical" },
    { id: "diagonal-down", color: 2, orientation: "diagonal-down" },
    { id: "diagonal-up", color: 3, orientation: "diagonal-up" },
  ].forEach((event) => {
    const indicator = RingzzleCore.calculateLineIndicatorGeometry(event, layout);
    const boardLeft = layout.boardOrigin.x;
    const boardTop = layout.boardOrigin.y;
    const boardRight = boardLeft + layout.boardSize;
    const boardBottom = boardTop + layout.boardSize;

    assert.strictEqual(indicator.orientation, event.orientation);
    assert.strictEqual(indicator.duration, RingzzleCore.LINE_INDICATOR_DURATION);
    assert.ok(indicator.duration <= 180, "line indicator should disappear quickly");
    assert.ok(indicator.x1 >= boardLeft && indicator.x1 <= boardRight, `${event.id} x1 should stay inside board`);
    assert.ok(indicator.x2 >= boardLeft && indicator.x2 <= boardRight, `${event.id} x2 should stay inside board`);
    assert.ok(indicator.y1 >= boardTop && indicator.y1 <= boardBottom, `${event.id} y1 should stay inside board`);
    assert.ok(indicator.y2 >= boardTop && indicator.y2 <= boardBottom, `${event.id} y2 should stay inside board`);
  });
});

test("keeps Color Burst source-to-target cue geometry short and inside board bounds", () => {
  const layout = RingzzleCore.calculateLayoutMetrics(390, 720);
  const event = {
    color: 0,
    source: { x: 1, y: 1 },
    targets: [
      { x: 1, y: 1, size: "small" },
      { x: 1, y: 1, size: "medium" },
      { x: 1, y: 1, size: "large" },
      { x: 0, y: 2, size: "small" },
      { x: 2, y: 0, size: "large" },
    ],
  };

  const cue = RingzzleCore.calculateColorBurstCueGeometry(event, layout);
  const boardLeft = layout.boardOrigin.x;
  const boardTop = layout.boardOrigin.y;
  const boardRight = boardLeft + layout.boardSize;
  const boardBottom = boardTop + layout.boardSize;

  assert.strictEqual(cue.duration, RingzzleCore.COLOR_BURST_EFFECT_DURATION);
  assert.ok(cue.duration <= 220, "Color Burst cue should stay brief");
  assert.strictEqual(cue.links.length, 2, "same-cell source rings should pulse but not create zero-length links");
  assert.ok(cue.source.x >= boardLeft && cue.source.x <= boardRight);
  assert.ok(cue.source.y >= boardTop && cue.source.y <= boardBottom);
  cue.links.forEach((link) => {
    assert.ok(link.x1 >= boardLeft && link.x1 <= boardRight, "link x1 should stay inside board");
    assert.ok(link.x2 >= boardLeft && link.x2 <= boardRight, "link x2 should stay inside board");
    assert.ok(link.y1 >= boardTop && link.y1 <= boardBottom, "link y1 should stay inside board");
    assert.ok(link.y2 >= boardTop && link.y2 <= boardBottom, "link y2 should stay inside board");
  });
  assert.strictEqual(cue.targetPulses.length, 5);
});

test("keeps sound off by default and requires an explicit user toggle", () => {
  const sound = RingzzleCore.createSoundState();

  assert.strictEqual(sound.enabled, false);
  assert.strictEqual(sound.userActivated, false);
  assert.strictEqual(RingzzleCore.getSoundButtonLabel(sound), "Sound Off");

  const enabled = RingzzleCore.resolveSoundToggleState(sound, { userGesture: true, audioReady: true });
  assert.strictEqual(enabled.enabled, true);
  assert.strictEqual(enabled.userActivated, true);
  assert.strictEqual(RingzzleCore.getSoundButtonLabel(enabled), "Sound On");

  const reloadState = RingzzleCore.createSoundState({ storedPreference: true });
  assert.strictEqual(reloadState.enabled, false, "stored preference must not auto-enable sound on reload");
  assert.strictEqual(reloadState.userActivated, false);
});

test("recognizes only lightweight v031 sound event names", () => {
  ["place", "invalid", "line-clear", "color-burst", "game-over", "restart", "toggle-on", "toggle-off"].forEach((eventName) => {
    const cue = RingzzleCore.getSoundCueSpec(eventName);
    assert.strictEqual(cue.name, eventName);
    assert.ok(cue.duration <= 0.22, `${eventName} cue should be short`);
    assert.ok(cue.gain <= 0.08, `${eventName} cue should stay soft`);
  });

  assert.strictEqual(RingzzleCore.getSoundCueSpec("unknown"), null);
});

test("makes Color Burst sound distinct without enabling sound by default", () => {
  const lineClear = RingzzleCore.getSoundCueSpec("line-clear");
  const colorBurst = RingzzleCore.getSoundCueSpec("color-burst");
  const reloadState = RingzzleCore.createSoundState({ storedPreference: true });

  assert.strictEqual(reloadState.enabled, false);
  assert.strictEqual(colorBurst.character, "electric-zap");
  assert.ok(Array.isArray(colorBurst.layers), "Color Burst should use layered oscillator cue data");
  assert.ok(colorBurst.layers.length >= 2, "Color Burst should be more distinctive than a single sweep");
  assert.notStrictEqual(colorBurst.type, lineClear.type);
  assert.notStrictEqual(colorBurst.frequency, lineClear.frequency);
});

test("matches tray drag and board ring render sizes on target mobile layouts", () => {
  [
    [390, 844],
    [393, 852],
    [430, 932],
    [390, 720],
    [393, 735],
    [430, 780],
  ].forEach(([width, height]) => {
    const layout = RingzzleCore.calculateLayoutMetrics(width, height);
    const metrics = RingzzleCore.calculateTrayRingRenderMetrics(layout);

    assert.strictEqual(metrics.boardRingCellSize, layout.cellSize, `${width}x${height} board render size should use cell size`);
    assert.strictEqual(metrics.ringCellSize, metrics.boardRingCellSize, `${width}x${height} tray ring should match board ring size`);
    assert.strictEqual(metrics.dragRingCellSize, metrics.boardRingCellSize, `${width}x${height} drag ring should match board ring size`);
    RingzzleCore.SIZES.forEach((sizeName) => {
      assert.strictEqual(
        metrics.radiusBySize[sizeName].tray,
        metrics.radiusBySize[sizeName].board,
        `${width}x${height} tray ${sizeName} radius should match board`
      );
      assert.strictEqual(
        metrics.radiusBySize[sizeName].drag,
        metrics.radiusBySize[sizeName].board,
        `${width}x${height} drag ${sizeName} radius should match board`
      );
    });
    assert.ok(metrics.largestRingDiameter <= metrics.slotWidth, `${width}x${height} largest ring should fit tray slot width`);
    assert.ok(metrics.largestRingDiameter <= metrics.trayHeight + 22, `${width}x${height} largest ring should stay near tray band`);
  });
});

test("hides tray rack and wells without removing tray hit areas", () => {
  assert.strictEqual(RingzzleCore.TRAY_VISUAL_STYLE.showRack, false);
  assert.strictEqual(RingzzleCore.TRAY_VISUAL_STYLE.showWells, false);
  assert.strictEqual(RingzzleCore.TRAY_VISUAL_STYLE.keepHitAreas, true);
});

test("formats v031 move feedback for placement, clears, combo, Color Burst, and game over", () => {
  assert.strictEqual(RingzzleCore.CLIENT_VERSION, "v031");
  assert.strictEqual(RingzzleCore.getMoveFeedbackLabel({ scoreDelta: 10, clearEvents: 0 }), "Placed +10");
  assert.strictEqual(
    RingzzleCore.getMoveFeedbackLabel({ scoreDelta: 110, clearEvents: 1, lineClears: 1, cellBonuses: 0 }),
    "Line clear +110"
  );
  assert.strictEqual(
    RingzzleCore.getMoveFeedbackLabel({ scoreDelta: 260, clearEvents: 2, lineClears: 2, cellBonuses: 0 }),
    "Combo clear +260"
  );
  assert.strictEqual(
    RingzzleCore.getMoveFeedbackLabel({ scoreDelta: 160, clearEvents: 1, lineClears: 0, cellBonuses: 1, colorBursts: 1 }),
    "Color Burst +160"
  );
  assert.strictEqual(
    RingzzleCore.getMoveFeedbackLabel({ scoreDelta: 10, clearEvents: 0 }, true),
    "Game over."
  );
});

test("keeps homepage embed controls minimal while preserving standalone controls", () => {
  assert.strictEqual(RingzzleCore.getPlayEmbedMode({ search: "?embed=home" }), "home");
  assert.strictEqual(RingzzleCore.getPlayEmbedMode({ search: "" }), "");

  const standalone = RingzzleCore.getEmbedUiOptions("");
  assert.strictEqual(standalone.showTitle, true);
  assert.strictEqual(standalone.showSubtitle, true);
  assert.strictEqual(standalone.showHomeButton, true);
  assert.strictEqual(standalone.showRankButton, true);
  assert.strictEqual(standalone.showSoundButton, true);
  assert.strictEqual(standalone.showRestartButton, true);

  const embed = RingzzleCore.getEmbedUiOptions(RingzzleCore.EMBED_MODE_HOME);
  assert.strictEqual(embed.showTitle, false);
  assert.strictEqual(embed.showSubtitle, false);
  assert.strictEqual(embed.showHomeButton, false);
  assert.strictEqual(embed.showRankButton, false);
  assert.strictEqual(embed.showSoundButton, true);
  assert.strictEqual(embed.showRestartButton, true);
});

test("uses v031 cache-busted homepage embed mode", () => {
  assert.strictEqual(RingzzleCore.CLIENT_VERSION, "v031");
  assert.strictEqual(RingzzleCore.getPlayEmbedMode({ search: "?embed=home&v=031" }), "home");
});

test("dedupes Ringzzle leaderboard rows by normalized nickname without exposing private fields", async () => {
  const leaderboard = await import("../functions/api/leaderboard/_shared.mjs");
  const rows = [
    {
      id: "older",
      nickname: "Nova",
      nickname_normalized: "nova",
      score: 400,
      best_clear: 1,
      line_clears: 2,
      color_bursts: 0,
      max_unlocked_colors: 4,
      created_at: "2026-06-09T01:00:00.000Z",
      browser_player_id: "secret-a",
    },
    {
      id: "better",
      nickname: " nova ",
      nickname_normalized: "nova",
      score: 550,
      best_clear: 1,
      line_clears: 2,
      color_bursts: 0,
      max_unlocked_colors: 4,
      created_at: "2026-06-09T02:00:00.000Z",
      browser_player_id: "secret-b",
    },
    {
      id: "orbit",
      nickname: "Orbit",
      nickname_normalized: "orbit",
      score: 500,
      best_clear: 2,
      line_clears: 5,
      color_bursts: 1,
      max_unlocked_colors: 5,
      created_at: "2026-06-09T00:30:00.000Z",
      browser_player_id: "secret-c",
    },
  ];

  const entries = leaderboard.dedupeLeaderboardRowsByNickname(rows).map(leaderboard.publicEntry);

  assert.strictEqual(entries.length, 2);
  assert.strictEqual(entries[0].rank, 1);
  assert.strictEqual(entries[0].nickname.trim().toLowerCase(), "nova");
  assert.strictEqual(entries[0].score, 550);
  assert.strictEqual(entries[1].nickname, "Orbit");
  assert.strictEqual(entries[1].bestClear, 2);
  assert.ok(!Object.prototype.hasOwnProperty.call(entries[0], "browser_player_id"));
  assert.ok(!Object.prototype.hasOwnProperty.call(entries[0], "moderation_note"));
});

test("normalizes Ringzzle leaderboard scopes and safe unavailable JSON shape", async () => {
  const leaderboard = await import("../functions/api/leaderboard/_shared.mjs");

  assert.strictEqual(leaderboard.normalizeScope("alltime"), "alltime");
  assert.strictEqual(leaderboard.normalizeScope("today"), "today");
  assert.strictEqual(leaderboard.normalizeScope("bad"), "today");
  assert.strictEqual(leaderboard.normalizeLeaderboardNicknameKey("  Ring   Master "), "ring master");

  const response = leaderboard.unavailableJson();
  const data = await response.json();
  assert.strictEqual(response.status, 503);
  assert.strictEqual(data.ok, false);
  assert.strictEqual(data.error, "leaderboard_unavailable");
});

test("serves Ringzzle leaderboard read API with safe public fields only", async () => {
  const api = await import("../functions/api/leaderboard/index.js");
  const unavailable = await api.onRequestGet({
    request: new Request("https://ringzzle.com/api/leaderboard?scope=today"),
    env: {},
  });
  assert.strictEqual(unavailable.status, 503);

  const rows = [
    {
      id: "top",
      nickname: "Nova",
      nickname_normalized: "nova",
      score: 900,
      best_clear: 2,
      line_clears: 6,
      color_bursts: 1,
      max_unlocked_colors: 5,
      created_at: "2026-06-09T01:00:00.000Z",
      browser_player_id: "hidden",
      rejected: 0,
    },
    {
      id: "dupe",
      nickname: " nova ",
      nickname_normalized: "nova",
      score: 700,
      best_clear: 3,
      line_clears: 9,
      color_bursts: 2,
      max_unlocked_colors: 6,
      created_at: "2026-06-09T00:30:00.000Z",
      browser_player_id: "hidden-too",
      rejected: 0,
    },
  ];
  const env = {
    DB: {
      prepare(sql) {
        assert.ok(sql.includes("ringzzle_scores"));
        return {
          bind(value) {
            assert.match(value, /^\d{4}-\d{2}-\d{2}$/);
            return this;
          },
          async all() {
            return { results: rows };
          },
        };
      },
    },
  };

  const response = await api.onRequestGet({
    request: new Request("https://ringzzle.com/api/leaderboard?scope=today"),
    env,
  });
  const data = await response.json();

  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.ok, true);
  assert.strictEqual(data.scope, "today");
  assert.strictEqual(data.entries.length, 1);
  assert.strictEqual(data.entries[0].score, 900);
  assert.strictEqual(data.entries[0].bestClear, 2);
  assert.ok(!Object.prototype.hasOwnProperty.call(data.entries[0], "browser_player_id"));
  assert.ok(!Object.prototype.hasOwnProperty.call(data.entries[0], "nickname_normalized"));
});

test("validates Ringzzle leaderboard submit payloads with normalized nicknames", async () => {
  const leaderboard = await import("../functions/api/leaderboard/_shared.mjs");

  const validation = leaderboard.validateSubmission({
    nickname: "  Ring   Master ",
    score: "1230",
    bestClear: "2",
    lineClears: "8",
    colorBursts: "1",
    maxUnlockedColors: "5",
    gamesPlayed: "14",
    browserPlayerId: "browser-abc",
    clientVersion: "v019",
  });

  assert.strictEqual(validation.ok, true);
  assert.strictEqual(validation.entry.nickname, "Ring Master");
  assert.strictEqual(validation.entry.nickname_normalized, "ring master");
  assert.strictEqual(validation.entry.score, 1230);
  assert.strictEqual(validation.entry.best_clear, 2);
  assert.strictEqual(validation.entry.line_clears, 8);
  assert.strictEqual(validation.entry.color_bursts, 1);
  assert.strictEqual(validation.entry.max_unlocked_colors, 5);
  assert.strictEqual(validation.entry.games_played, 14);
  assert.strictEqual(validation.entry.browser_player_id, "browser-abc");
  assert.strictEqual(validation.entry.client_version, "v019");

  assert.strictEqual(leaderboard.validateSubmission({ nickname: "", score: 10, browserPlayerId: "id", clientVersion: "v019" }).ok, false);
  assert.strictEqual(leaderboard.validateSubmission({ nickname: "bad!", score: 10, browserPlayerId: "id", clientVersion: "v019" }).ok, false);
  assert.strictEqual(leaderboard.validateSubmission({ nickname: "Player", score: 1000001, browserPlayerId: "id", clientVersion: "v019" }).ok, false);
  assert.strictEqual(leaderboard.validateSubmission({ nickname: "Player", score: 10, browserPlayerId: "", clientVersion: "v019" }).ok, false);
  assert.strictEqual(leaderboard.validateSubmission({ nickname: "Player", score: 10, browserPlayerId: "id", clientVersion: "" }).ok, false);
  assert.strictEqual(leaderboard.validateSubmission({ nickname: "Player", score: 10, maxUnlockedColors: 9, browserPlayerId: "id", clientVersion: "v019" }).ok, false);
});

test("accepts Ringzzle leaderboard submit API without returning browser player id", async () => {
  const submit = await import("../functions/api/leaderboard/submit.js");
  let capturedSql = "";
  let capturedBindings = [];
  const env = {
    DB: {
      prepare(sql) {
        capturedSql = sql;
        if (sql.includes("COUNT(*) AS count")) {
          return {
            bind(...values) {
              assert.deepStrictEqual(values.slice(0, 1), ["browser-secret"]);
              return this;
            },
            async first() {
              return { count: 0 };
            },
          };
        }
        return {
          bind(...values) {
            capturedBindings = values;
            return this;
          },
          async run() {
            return { success: true };
          },
        };
      },
    },
  };

  const response = await submit.onRequest({
    request: new Request("https://ringzzle.com/api/leaderboard/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname: "  Nova ",
        score: 420,
        browserPlayerId: "browser-secret",
        clientVersion: "v019",
        bestClear: 2,
        lineClears: 5,
        colorBursts: 1,
        maxUnlockedColors: 4,
        gamesPlayed: 7,
      }),
    }),
    env,
  });
  const data = await response.json();

  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.ok, true);
  assert.strictEqual(data.accepted, true);
  assert.strictEqual(data.nickname, "Nova");
  assert.strictEqual(data.score, 420);
  assert.ok(!Object.prototype.hasOwnProperty.call(data, "browserPlayerId"));
  assert.ok(!Object.prototype.hasOwnProperty.call(data, "browser_player_id"));
  assert.ok(!Object.prototype.hasOwnProperty.call(data, "moderation_note"));
  assert.ok(capturedSql.includes("INSERT INTO ringzzle_scores"));
  assert.strictEqual(capturedBindings[3], "Nova");
  assert.strictEqual(capturedBindings[4], "nova");
  assert.strictEqual(capturedBindings[5], "browser-secret");
  assert.strictEqual(capturedBindings[6], 420);
  assert.strictEqual(capturedBindings[12], "v019");
  assert.strictEqual(capturedBindings[14], 0);
  assert.strictEqual(capturedBindings[15], null);
  assert.strictEqual(capturedBindings[16], null);
});

test("rejects unsafe Ringzzle leaderboard submit requests", async () => {
  const submit = await import("../functions/api/leaderboard/submit.js");
  const env = { DB: { prepare() { throw new Error("should not write invalid submissions"); } } };

  const getResponse = await submit.onRequest({
    request: new Request("https://ringzzle.com/api/leaderboard/submit", { method: "GET" }),
    env,
  });
  assert.strictEqual(getResponse.status, 405);

  const invalidJson = await submit.onRequest({
    request: new Request("https://ringzzle.com/api/leaderboard/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    }),
    env,
  });
  assert.strictEqual(invalidJson.status, 400);

  const badPayload = await submit.onRequest({
    request: new Request("https://ringzzle.com/api/leaderboard/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: "admin", score: 10, browserPlayerId: "id", clientVersion: "v019" }),
    }),
    env,
  });
  const badPayloadData = await badPayload.json();
  assert.strictEqual(badPayload.status, 400);
  assert.strictEqual(badPayloadData.ok, false);
  assert.ok(!Object.prototype.hasOwnProperty.call(badPayloadData, "browserPlayerId"));
});

test("creates and reuses anonymous browser player ids locally", () => {
  const storage = memoryStorage();
  const first = RingzzleCore.getOrCreateBrowserPlayerId(storage, () => 0.12345);
  const second = RingzzleCore.getOrCreateBrowserPlayerId(storage, () => 0.98765);

  assert.match(first, /^ringzzle_[a-z0-9_]{12,}$/);
  assert.strictEqual(second, first);
  assert.strictEqual(storage.dump().ringzzleBrowserPlayerIdV1, first);
});

test("validates leaderboard nicknames on the client without server coupling", () => {
  const valid = RingzzleCore.validateLeaderboardNicknameClient("  Ring   Master ");
  assert.strictEqual(valid.ok, true);
  assert.strictEqual(valid.nickname, "Ring Master");

  assert.strictEqual(RingzzleCore.validateLeaderboardNicknameClient("").ok, false);
  assert.strictEqual(RingzzleCore.validateLeaderboardNicknameClient("A").ok, false);
  assert.strictEqual(RingzzleCore.validateLeaderboardNicknameClient("ThisNameIsWayTooLong").ok, false);
  assert.strictEqual(RingzzleCore.validateLeaderboardNicknameClient("bad!").ok, false);
});

test("builds anonymous leaderboard submit payload from completed game state", () => {
  const storage = memoryStorage({ ringzzleGamesPlayedV1: 4 });
  const game = makeGame({ storage });
  game.score = 1230;
  game.bestClearThisGame = 2;
  game.totalLineClearsThisGame = 8;
  game.totalColorBurstsThisGame = 1;
  game.availableColorCount = 5;
  game.stats = { gamesPlayed: 5 };

  const payload = RingzzleCore.buildLeaderboardSubmitPayload({
    game,
    nickname: "Nova",
    browserPlayerId: "browser-secret",
  });

  assert.deepStrictEqual(payload, {
    nickname: "Nova",
    score: 1230,
    browserPlayerId: "browser-secret",
    clientVersion: "v031",
    bestClear: 2,
    lineClears: 8,
    colorBursts: 1,
    maxUnlockedColors: 5,
    gamesPlayed: 5,
  });
});

test("guards leaderboard submit state against duplicate taps and auto-submit", () => {
  assert.strictEqual(RingzzleCore.LEADERBOARD_AUTO_SUBMIT, false);

  let state = RingzzleCore.resolveLeaderboardSubmitState(null, { type: "game-over" });
  assert.strictEqual(state.canSubmit, true);
  assert.strictEqual(state.submitting, false);

  state = RingzzleCore.resolveLeaderboardSubmitState(state, { type: "submit-start" });
  assert.strictEqual(state.canSubmit, false);
  assert.strictEqual(state.submitting, true);

  const duplicate = RingzzleCore.resolveLeaderboardSubmitState(state, { type: "submit-start" });
  assert.strictEqual(duplicate.canSubmit, false);
  assert.strictEqual(duplicate.submitting, true);

  state = RingzzleCore.resolveLeaderboardSubmitState(state, { type: "submit-success" });
  assert.strictEqual(state.canSubmit, false);
  assert.strictEqual(state.submitted, true);

  state = RingzzleCore.resolveLeaderboardSubmitState(state, { type: "game-over" });
  assert.strictEqual(state.submitted, true, "same game-over screen should stay submitted");
  assert.strictEqual(state.canSubmit, false);

  state = RingzzleCore.resolveLeaderboardSubmitState(state, { type: "restart" });
  assert.strictEqual(state.canSubmit, false);
  assert.strictEqual(state.submitted, false);

  state = RingzzleCore.resolveLeaderboardSubmitState(state, { type: "game-over" });
  assert.strictEqual(state.canSubmit, true, "future game-over screen can submit again");
  assert.strictEqual(state.submitted, false);
});

test("highlights Submit Score in yellow only for new local Today best", () => {
  const newBest = RingzzleCore.getLeaderboardSubmitCta({
    score: 6550,
    previousTodayBest: 3860,
    submitted: false,
    submitting: false,
  });
  assert.strictEqual(newBest.buttonLabel, "Submit Score");
  assert.strictEqual(newBest.primary, true);
  assert.strictEqual(newBest.fill, "#facc15");
  assert.match(newBest.message, /New Today Best/i);

  const notBest = RingzzleCore.getLeaderboardSubmitCta({
    score: 2500,
    previousTodayBest: 3860,
    submitted: false,
    submitting: false,
  });
  assert.strictEqual(notBest.primary, false);
  assert.notStrictEqual(notBest.fill, "#facc15");

  const submitted = RingzzleCore.getLeaderboardSubmitCta({
    score: 6550,
    previousTodayBest: 3860,
    submitted: true,
    submitting: false,
  });
  assert.strictEqual(submitted.buttonLabel, "Submitted");
  assert.strictEqual(submitted.primary, false);
});

test("uses Blockzzle-style prompt nickname flow without inline input dependency", () => {
  assert.strictEqual(RingzzleCore.LEADERBOARD_NICKNAME_ENTRY_MODE, "prompt");
  assert.strictEqual(RingzzleCore.LEADERBOARD_INLINE_NICKNAME_INPUT, false);

  const stored = RingzzleCore.resolveLeaderboardNicknameForSubmit({
    storedNickname: " Nova ",
    promptProvider: () => {
      throw new Error("stored nickname should not prompt");
    },
  });
  assert.deepStrictEqual(stored, {
    ok: true,
    nickname: "Nova",
    cancelled: false,
    prompted: false,
    shouldStore: false,
    message: "",
  });

  const prompted = RingzzleCore.resolveLeaderboardNicknameForSubmit({
    storedNickname: "",
    promptProvider: () => " Ring   Master ",
  });
  assert.strictEqual(prompted.ok, true);
  assert.strictEqual(prompted.nickname, "Ring Master");
  assert.strictEqual(prompted.prompted, true);
  assert.strictEqual(prompted.shouldStore, true);
  assert.strictEqual(RingzzleCore.shouldSubmitLeaderboardAfterNickname(prompted), true);

  const cancelled = RingzzleCore.resolveLeaderboardNicknameForSubmit({
    storedNickname: "",
    promptProvider: () => null,
  });
  assert.strictEqual(cancelled.ok, false);
  assert.strictEqual(cancelled.cancelled, true);
  assert.strictEqual(RingzzleCore.shouldSubmitLeaderboardAfterNickname(cancelled), false);

  const invalid = RingzzleCore.resolveLeaderboardNicknameForSubmit({
    storedNickname: "",
    promptProvider: () => "!",
  });
  assert.strictEqual(invalid.ok, false);
  assert.strictEqual(invalid.cancelled, false);
  assert.match(invalid.message, /2-16|letters/i);
});

test("uses readable nickname display copy for game-over leaderboard panel", () => {
  const visible = RingzzleCore.getLeaderboardNicknameDisplay("  sjkim  ");
  assert.strictEqual(visible.text, "Nickname: sjkim");
  assert.strictEqual(visible.highlighted, true);
  assert.ok(visible.fontSize >= 12);
  assert.strictEqual(visible.color, "#facc15");

  const missing = RingzzleCore.getLeaderboardNicknameDisplay("");
  assert.match(missing.text, /Submit Score/i);
  assert.strictEqual(missing.highlighted, false);
});

test("builds no-store cache-busted leaderboard read URLs", () => {
  const today = RingzzleCore.buildLeaderboardReadUrl("today", 12345);
  const alltime = RingzzleCore.buildLeaderboardReadUrl("alltime", 12345);

  assert.strictEqual(today, "/api/leaderboard?scope=today&v=12345");
  assert.strictEqual(alltime, "/api/leaderboard?scope=alltime&v=12345");
  assert.strictEqual(RingzzleCore.buildLeaderboardReadUrl("bad", 0), "/api/leaderboard?scope=today&v=0");
});

test("positions Home button left of Sound without crowding mobile controls", () => {
  const homeLayout = RingzzleCore.calculateHomeButtonLayout({
    width: 390,
    margin: 16,
    topY: 12,
    homeButton: { width: 52, height: 34 },
    soundButton: { x: 231, y: 14, width: 64, height: 34 },
  });

  assert.strictEqual(RingzzleCore.HOME_ROUTE, "/");
  assert.strictEqual(homeLayout.label, "Home");
  assert.strictEqual(homeLayout.route, "/");
  assert.strictEqual(homeLayout.action, "navigate-home");
  assert.ok(homeLayout.x >= 16, "Home button should stay inside left edge");
  assert.ok(homeLayout.x + homeLayout.width + homeLayout.gap <= 231, "Home should stay left of Sound");
  assert.strictEqual(homeLayout.y, 14);
});

test("positions Rank button under Restart and opens an in-game modal", () => {
  const layout = RingzzleCore.calculateLayoutMetrics(390, 720);
  const rankLayout = RingzzleCore.calculateRankButtonLayout({
    width: layout.width,
    margin: layout.margin,
    topY: layout.topY,
    restartButton: { x: 304, y: 12, width: 70, height: 34 },
    buttonWidth: 50,
    buttonHeight: 30,
    boardTop: layout.boardOrigin.y,
  });

  assert.strictEqual(RingzzleCore.LEADERBOARD_ROUTE, "/leaderboard/");
  assert.strictEqual(RingzzleCore.LEADERBOARD_OPEN_MODE, "modal");
  assert.strictEqual(rankLayout.label, "Rank");
  assert.strictEqual(rankLayout.action, "open-modal");
  assert.ok(rankLayout.y > 12 + 30, "rank button should sit below restart");
  assert.ok(rankLayout.y + rankLayout.height <= layout.boardOrigin.y - 8, "rank button should clear board");
  assert.ok(rankLayout.x + rankLayout.width <= layout.width - layout.margin + 1, "rank button should stay inside right edge");
});

test("keeps prompt-based game-over leaderboard controls compact on mobile", () => {
  [
    { width: 390, height: 844 },
    { width: 393, height: 852 },
    { width: 430, height: 932 },
    { width: 390, height: 720 },
    { width: 393, height: 735 },
    { width: 430, height: 780 },
  ].forEach((viewport) => {
    const layout = RingzzleCore.calculateLayoutMetrics(viewport.width, viewport.height);
    const panel = RingzzleCore.calculateGameOverPromptPanelLayout({ layout });

    assert.ok(panel.panelTop >= 8, `game-over panel top should fit at ${viewport.width}x${viewport.height}`);
    assert.ok(panel.panelBottom <= viewport.height - 8, `game-over panel bottom should fit at ${viewport.width}x${viewport.height}`);
    assert.ok(panel.submitButton.bottom + 6 <= panel.todayButton.y, `submit should clear tabs at ${viewport.width}x${viewport.height}`);
    assert.ok(panel.leaderboardText.y < panel.submitStatus.y, `leaderboard preview should sit above status at ${viewport.width}x${viewport.height}`);
    assert.ok(panel.submitStatus.y + 18 <= panel.playAgainButton.y, `status should clear Play Again at ${viewport.width}x${viewport.height}`);
  });
});

test("exposes Today and All-Time leaderboard tabs for in-game flow", () => {
  assert.deepStrictEqual(RingzzleCore.LEADERBOARD_SCOPE_TABS, [
    { label: "Today", scope: "today" },
    { label: "All-Time", scope: "alltime" },
  ]);
});

test("keeps in-game leaderboard modal inside compact mobile viewports", () => {
  [
    { width: 390, height: 844 },
    { width: 393, height: 852 },
    { width: 430, height: 932 },
    { width: 390, height: 720 },
    { width: 393, height: 735 },
    { width: 430, height: 780 },
  ].forEach((viewport) => {
    const modal = RingzzleCore.calculateLeaderboardModalLayout(viewport.width, viewport.height);

    assert.ok(modal.panelTop >= 20, `modal top should fit at ${viewport.width}x${viewport.height}`);
    assert.ok(modal.panelBottom <= viewport.height - 20, `modal bottom should fit at ${viewport.width}x${viewport.height}`);
    assert.ok(modal.todayButton.y === modal.allTimeButton.y, "scope buttons should align");
    assert.ok(modal.closeButton.y + modal.closeButton.height <= modal.panelBottom - 10, "close button should stay in panel");
    assert.ok(modal.entryLimit >= 6, "modal should show useful leaderboard rows");
  });
});

test("keeps game-over leaderboard controls separate from nickname submit form", () => {
  const layout = RingzzleCore.calculateLayoutMetrics(390, 720);
  const gameOver = RingzzleCore.calculateGameOverPromptPanelLayout({ layout });

  assert.ok(gameOver.todayButton.y === gameOver.allTimeButton.y, "game-over scope buttons should align");
  assert.ok(gameOver.nickname.y > gameOver.divider.y, "nickname line should sit in leaderboard section");
  assert.ok(gameOver.submitButton.bottom + 6 <= gameOver.todayButton.y, "submit should clear tabs");
  assert.ok(gameOver.leaderboardText.y < gameOver.submitStatus.y, "leaderboard preview should sit above submit status");
  assert.ok(gameOver.playAgainButton.y > gameOver.submitStatus.y, "Play Again should sit below submit status");
});

test("keeps Today and All-Time read API dedupe consistent on first-day data", async () => {
  const api = await import("../functions/api/leaderboard/index.js");
  const rows = [
    {
      id: "a",
      nickname: "Nova",
      nickname_normalized: "nova",
      score: 300,
      best_clear: 1,
      line_clears: 2,
      color_bursts: 0,
      max_unlocked_colors: 4,
      created_at: "2026-06-09T01:00:00.000Z",
      rejected: 0,
    },
    {
      id: "b",
      nickname: " nova ",
      nickname_normalized: "nova",
      score: 500,
      best_clear: 1,
      line_clears: 2,
      color_bursts: 0,
      max_unlocked_colors: 4,
      created_at: "2026-06-09T02:00:00.000Z",
      rejected: 0,
    },
    {
      id: "c",
      nickname: "Orbit",
      nickname_normalized: "orbit",
      score: 450,
      best_clear: 2,
      line_clears: 5,
      color_bursts: 1,
      max_unlocked_colors: 5,
      created_at: "2026-06-09T00:30:00.000Z",
      rejected: 0,
    },
  ];
  const env = {
    DB: {
      prepare(sql) {
        assert.ok(sql.includes("NOT EXISTS"), "read API should dedupe best nickname rows in SQL");
        assert.ok(!sql.includes("browser_player_id"), "public read query must not select browser player id");
        return {
          bind() {
            return this;
          },
          async all() {
            return { results: rows };
          },
        };
      },
    },
  };

  const todayResponse = await api.onRequestGet({
    request: new Request("https://ringzzle.com/api/leaderboard?scope=today"),
    env,
  });
  const allTimeResponse = await api.onRequestGet({
    request: new Request("https://ringzzle.com/api/leaderboard?scope=alltime"),
    env,
  });
  const today = await todayResponse.json();
  const alltime = await allTimeResponse.json();

  assert.deepStrictEqual(today.entries, alltime.entries);
  assert.strictEqual(today.entries.length, 2);
  assert.strictEqual(today.entries[0].nickname.trim().toLowerCase(), "nova");
  assert.strictEqual(today.entries[0].score, 500);
  assert.ok(!Object.prototype.hasOwnProperty.call(today.entries[0], "browserPlayerId"));
});

test("refreshes in-game leaderboard state after successful submit", () => {
  const initial = RingzzleCore.resolveLeaderboardViewState(null, { type: "open" });
  assert.strictEqual(initial.open, true);
  assert.strictEqual(initial.scope, "today");
  assert.strictEqual(initial.needsLoad, true);

  const switched = RingzzleCore.resolveLeaderboardViewState(initial, { type: "scope", scope: "alltime" });
  assert.strictEqual(switched.scope, "alltime");
  assert.strictEqual(switched.needsLoad, true);

  const loaded = RingzzleCore.resolveLeaderboardViewState(switched, {
    type: "loaded",
    scope: "alltime",
    entries: [{ rank: 1, nickname: "Nova", score: 100 }],
  });
  assert.strictEqual(loaded.needsLoad, false);
  assert.strictEqual(loaded.entries.alltime.length, 1);

  const refreshed = RingzzleCore.resolveLeaderboardViewState(loaded, { type: "submit-success" });
  assert.strictEqual(refreshed.needsLoad, true);
  assert.strictEqual(refreshed.entries.today, null);
  assert.strictEqual(refreshed.entries.alltime, null);
  assert.strictEqual(refreshed.loadingScope, null);
  assert.strictEqual(refreshed.status, "Refreshing leaderboard...");
});

test("validates stricter Ringzzle submit bounds for v028", async () => {
  const leaderboard = await import("../functions/api/leaderboard/_shared.mjs");
  const valid = {
    nickname: "Nova",
    score: 999999,
    bestClear: 16,
    lineClears: 10000,
    colorBursts: 10000,
    maxUnlockedColors: 6,
    gamesPlayed: 1000000,
    browserPlayerId: "browser-abc",
    clientVersion: "v028",
  };

  assert.strictEqual(leaderboard.validateSubmission(valid).ok, true);
  assert.strictEqual(leaderboard.validateSubmission({ ...valid, score: 1000000 }).ok, false);
  assert.strictEqual(leaderboard.validateSubmission({ ...valid, bestClear: 17 }).ok, false);
  assert.strictEqual(leaderboard.validateSubmission({ ...valid, lineClears: -1 }).ok, false);
  assert.strictEqual(leaderboard.validateSubmission({ ...valid, colorBursts: 10001 }).ok, false);
  assert.strictEqual(leaderboard.validateSubmission({ ...valid, gamesPlayed: -1 }).ok, false);
  assert.strictEqual(leaderboard.validateSubmission({ ...valid, maxUnlockedColors: 2 }).ok, false);
  assert.strictEqual(leaderboard.validateSubmission({ ...valid, clientVersion: "latest" }).ok, false);
});

test("rate limits too-fast Ringzzle leaderboard submissions by browser player id", async () => {
  const submit = await import("../functions/api/leaderboard/submit.js");
  const now = new Date("2026-06-09T12:00:00.000Z");
  const env = {
    DB: {
      prepare(sql) {
        if (sql.includes("COUNT(*) AS count")) {
          return {
            bind(browserPlayerId, since) {
              assert.strictEqual(browserPlayerId, "browser-secret");
              assert.match(since, /^2026-06-09T11:59:5/);
              return this;
            },
            async first() {
              return { count: 1 };
            },
          };
        }
        throw new Error("rate-limited request should not insert");
      },
    },
  };

  const response = await submit.onRequest({
    request: new Request("https://ringzzle.com/api/leaderboard/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname: "Nova",
        score: 100,
        browserPlayerId: "browser-secret",
        clientVersion: "v028",
      }),
    }),
    env,
    now,
  });
  const data = await response.json();

  assert.strictEqual(response.status, 429);
  assert.strictEqual(data.ok, false);
  assert.strictEqual(data.error, "rate_limited");
  assert.ok(!Object.prototype.hasOwnProperty.call(data, "browserPlayerId"));
});

test("rejects oversized Ringzzle leaderboard submit JSON", async () => {
  const submit = await import("../functions/api/leaderboard/submit.js");
  const response = await submit.onRequest({
    request: new Request("https://ringzzle.com/api/leaderboard/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": "9000",
      },
      body: JSON.stringify({ nickname: "Nova", score: 1, browserPlayerId: "id", clientVersion: "v028" }),
    }),
    env: { DB: { prepare() { throw new Error("oversized request should not query D1"); } } },
  });
  const data = await response.json();

  assert.strictEqual(response.status, 413);
  assert.strictEqual(data.error, "payload_too_large");
});

(async () => {
  let passed = 0;
  for (const { name, fn } of tests) {
    try {
      await fn();
      passed += 1;
      console.log(`ok ${passed} - ${name}`);
    } catch (error) {
      console.error(`not ok ${passed + 1} - ${name}`);
      console.error(error);
      process.exitCode = 1;
      break;
    }
  }

  if (process.exitCode !== 1) {
    console.log(`# ${passed} tests passed`);
  }
})();
