import test from "node:test";
import assert from "node:assert/strict";

import {
  MOVE_STEP,
  clampPosition,
  getMoveResult,
  getSnakeMoveResult,
  isCaught,
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
      position: { x: 32, y: 80 },
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
      position: { x: 80, y: 92 },
      blocked: false,
    },
  );
});

test("snake cannot move through blocks", () => {
  const snake = { x: 80, y: 80 };
  const pokemon = { x: 160, y: 80 };
  const bounds = { width: 300, height: 240 };
  const snakeSize = { width: 42, height: 28 };
  const blocks = [{ x: 92, y: 76, width: 40, height: 40 }];

  assert.deepEqual(
    getSnakeMoveResult(snake, pokemon, bounds, snakeSize, blocks, () => 0.9),
    {
      position: snake,
      blocked: true,
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
