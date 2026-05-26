import test from "node:test";
import assert from "node:assert/strict";

import {
  MOVE_STEP,
  SNAKE_STEP,
  advanceSnakeBody,
  clampPosition,
  getNextScore,
  getMoveResult,
  getResetScores,
  getSnakeMoveResult,
  isCaught,
  isMoveAllowed,
  movePosition,
  overlapsAnyBlock,
} from "../movement.js";

test("arrow keys move the position by one step", () => {
  const start = { x: 100, y: 100 };
  const bounds = { width: 500, height: 400 };
  const sprite = { width: 48, height: 48 };

  assert.deepEqual(movePosition(start, "ArrowUp", bounds, sprite), {
    x: 100,
    y: 100 - MOVE_STEP,
  });
  assert.deepEqual(movePosition(start, "ArrowDown", bounds, sprite), {
    x: 100,
    y: 100 + MOVE_STEP,
  });
  assert.deepEqual(movePosition(start, "ArrowLeft", bounds, sprite), {
    x: 100 - MOVE_STEP,
    y: 100,
  });
  assert.deepEqual(movePosition(start, "ArrowRight", bounds, sprite), {
    x: 100 + MOVE_STEP,
    y: 100,
  });
});

test("movement is clamped inside the visible field", () => {
  const bounds = { width: 180, height: 140 };
  const sprite = { width: 48, height: 48 };

  assert.deepEqual(clampPosition({ x: -20, y: -12 }, bounds, sprite), {
    x: 0,
    y: 0,
  });
  assert.deepEqual(clampPosition({ x: 200, y: 200 }, bounds, sprite), {
    x: 132,
    y: 92,
  });
  assert.deepEqual(
    movePosition({ x: 0, y: 0 }, "ArrowLeft", bounds, sprite),
    { x: 0, y: 0 },
  );
});

test("non-arrow keys leave the position unchanged", () => {
  const start = { x: 42, y: 64 };
  const bounds = { width: 500, height: 400 };
  const sprite = { width: 48, height: 48 };

  assert.deepEqual(movePosition(start, "KeyA", bounds, sprite), start);
});

test("movement is rejected when the sprite would overlap a block", () => {
  const start = { x: 100, y: 100 };
  const bounds = { width: 500, height: 400 };
  const sprite = { width: 48, height: 48 };
  const blocks = [{ x: 118, y: 100, width: 36, height: 60 }];

  assert.equal(overlapsAnyBlock({ x: 118, y: 100 }, sprite, blocks), true);
  assert.deepEqual(movePosition(start, "ArrowRight", bounds, sprite, blocks), start);
  assert.deepEqual(getMoveResult(start, "ArrowRight", bounds, sprite, blocks), {
    position: start,
    blocked: true,
  });
});

test("movement continues when blocks are not in the destination", () => {
  const start = { x: 100, y: 100 };
  const bounds = { width: 500, height: 400 };
  const sprite = { width: 48, height: 48 };
  const blocks = [{ x: 250, y: 250, width: 48, height: 48 }];

  assert.deepEqual(movePosition(start, "ArrowRight", bounds, sprite, blocks), {
    x: 100 + MOVE_STEP,
    y: 100,
  });
  assert.deepEqual(getMoveResult(start, "ArrowRight", bounds, sprite, blocks), {
    position: {
      x: 100 + MOVE_STEP,
      y: 100,
    },
    blocked: false,
  });
});

test("snake chase movement reduces distance to the pokemon", () => {
  const snake = { x: 20, y: 80 };
  const pokemon = { x: 80, y: 80 };
  const bounds = { width: 300, height: 240 };
  const snakeSize = { width: 42, height: 28 };

  assert.deepEqual(
    getSnakeMoveResult(snake, pokemon, bounds, snakeSize, [], () => 0.9),
    {
      position: { x: 20 + SNAKE_STEP, y: 80 },
      blocked: false,
    },
  );
});

test("snake sometimes chooses a random walk direction", () => {
  const snake = { x: 80, y: 80 };
  const pokemon = { x: 160, y: 80 };
  const bounds = { width: 300, height: 240 };
  const snakeSize = { width: 42, height: 28 };
  const randomValues = [0.1, 0.6];
  const fakeRandom = () => randomValues.shift();

  assert.deepEqual(
    getSnakeMoveResult(snake, pokemon, bounds, snakeSize, [], fakeRandom),
    {
      position: { x: 80, y: 80 + SNAKE_STEP },
      blocked: false,
    },
  );
});

test("snake stays still when every route is blocked", () => {
  const snake = { x: 80, y: 80 };
  const pokemon = { x: 160, y: 80 };
  const bounds = { width: 300, height: 240 };
  const snakeSize = { width: 42, height: 28 };
  const blocks = [
    { x: 94, y: 80, width: 42, height: 28 },
    { x: 66, y: 80, width: 42, height: 28 },
    { x: 80, y: 94, width: 42, height: 28 },
    { x: 80, y: 66, width: 42, height: 28 },
  ];

  assert.deepEqual(
    getSnakeMoveResult(snake, pokemon, bounds, snakeSize, blocks, () => 0.9),
    {
      position: snake,
      blocked: true,
    },
  );
});

test("snake tries an alternate route when direct chase is blocked", () => {
  const snake = { x: 80, y: 80 };
  const pokemon = { x: 160, y: 80 };
  const bounds = { width: 300, height: 240 };
  const snakeSize = { width: 42, height: 28 };
  const blocks = [{ x: 124, y: 80, width: 24, height: 28 }];

  assert.deepEqual(
    getSnakeMoveResult(snake, pokemon, bounds, snakeSize, blocks, () => 0.9),
    {
      position: { x: 80, y: 80 - SNAKE_STEP },
      blocked: false,
    },
  );
});

test("snake pathfinding can move away from the pokemon to escape a dead end", () => {
  const snake = { x: 80, y: 80 };
  const pokemon = { x: 160, y: 80 };
  const bounds = { width: 260, height: 220 };
  const snakeSize = { width: 42, height: 28 };
  const blocks = [
    { x: 124, y: 70, width: 28, height: 64 },
    { x: 66, y: 94, width: 84, height: 28 },
  ];

  assert.deepEqual(
    getSnakeMoveResult(snake, pokemon, bounds, snakeSize, blocks, () => 0.9),
    {
      position: { x: 80, y: 80 - SNAKE_STEP },
      blocked: false,
    },
  );
});

test("catch detection triggers when snake overlaps pokemon", () => {
  assert.equal(
    isCaught(
      { x: 100, y: 100 },
      { width: 42, height: 28 },
      { x: 120, y: 110 },
      { width: 64, height: 64 },
    ),
    true,
  );
  assert.equal(
    isCaught(
      { x: 10, y: 10 },
      { width: 42, height: 28 },
      { x: 200, y: 200 },
      { width: 64, height: 64 },
    ),
    false,
  );
});

test("snake body follows the head as separate segments", () => {
  const body = [
    { x: 30, y: 10 },
    { x: 18, y: 10 },
    { x: 6, y: 10 },
  ];

  assert.deepEqual(advanceSnakeBody(body, { x: 42, y: 10 }, 4), [
    { x: 42, y: 10 },
    { x: 30, y: 10 },
    { x: 18, y: 10 },
    { x: 6, y: 10 },
  ]);
  assert.deepEqual(advanceSnakeBody(body, { x: 42, y: 10 }, 3), [
    { x: 42, y: 10 },
    { x: 30, y: 10 },
    { x: 18, y: 10 },
  ]);
});

test("score increases only after successful pokemon movement", () => {
  assert.equal(getNextScore(4, { blocked: false }), 5);
  assert.equal(getNextScore(4, { blocked: true }), 4);
});

test("game reset clears current score and preserves the best score", () => {
  assert.deepEqual(getResetScores(9, 6), {
    score: 0,
    bestScore: 9,
  });
  assert.deepEqual(getResetScores(3, 8), {
    score: 0,
    bestScore: 8,
  });
});

test("pokemon movement is disabled while the game is paused", () => {
  assert.equal(isMoveAllowed(false), true);
  assert.equal(isMoveAllowed(true), false);
});
