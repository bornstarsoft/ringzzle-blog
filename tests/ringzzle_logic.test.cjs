const assert = require("assert");

const { RingzzleCore } = require("../static/play/js/ringzzle-phaser.v004.js");

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
  assert.deepStrictEqual(game.tray.map((trayPiece) => trayPiece.size), ["small", "medium", "large"]);
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

test("awards and clears a same-cell full color bonus", () => {
  const game = makeGame();
  game.board[2][2].small = 5;
  game.board[2][2].medium = 5;
  game.tray = [piece("large", 5), null, null];

  const result = game.placeTrayPiece(0, 2, 2);

  assert.strictEqual(result.placed, true);
  assert.strictEqual(result.cellBonuses, 1);
  assert.strictEqual(result.clearedRings, 3);
  assert.strictEqual(result.scoreDelta, 160);
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
  assert.strictEqual(RingzzleCore.getAvailableColorCount(149), 3);
  assert.strictEqual(RingzzleCore.getAvailableColorCount(150), 4);
  assert.strictEqual(RingzzleCore.getAvailableColorCount(499), 4);
  assert.strictEqual(RingzzleCore.getAvailableColorCount(500), 5);
  assert.strictEqual(RingzzleCore.getAvailableColorCount(1199), 5);
  assert.strictEqual(RingzzleCore.getAvailableColorCount(1200), 6);
});

test("caps available color count at the configured maximum", () => {
  assert.strictEqual(RingzzleCore.MAX_COLOR_COUNT, 6);
  assert.strictEqual(RingzzleCore.getAvailableColorCount(999999), 6);
  assert.ok(RingzzleCore.getAvailableColorCount(999999) <= RingzzleCore.COLORS.length);
});

test("tray generation respects current available color count", () => {
  const game = makeGame({ rng: () => 0.999 });

  game.score = 500;
  game.refillTray();
  assert.strictEqual(game.availableColorCount, 5);
  assert.ok(game.tray.every((trayPiece) => trayPiece.color < 5));

  game.score = 999999;
  game.refillTray();
  assert.strictEqual(game.availableColorCount, 6);
  assert.ok(game.tray.every((trayPiece) => trayPiece.color < 6));
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

test("formats v004 move feedback for placement, clears, combo, cell bonus, and game over", () => {
  assert.strictEqual(RingzzleCore.CLIENT_VERSION, "v004");
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
    RingzzleCore.getMoveFeedbackLabel({ scoreDelta: 160, clearEvents: 1, lineClears: 0, cellBonuses: 1 }),
    "Cell bonus +160"
  );
  assert.strictEqual(
    RingzzleCore.getMoveFeedbackLabel({ scoreDelta: 10, clearEvents: 0 }, true),
    "Game over."
  );
});

let passed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
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
