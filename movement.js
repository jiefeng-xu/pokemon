export const MOVE_STEP = 18;
export const SNAKE_STEP = 14;

export function clampPosition(position, bounds, sprite) {
  const maxX = Math.max(0, bounds.width - sprite.width);
  const maxY = Math.max(0, bounds.height - sprite.height);

  return {
    x: Math.min(Math.max(position.x, 0), maxX),
    y: Math.min(Math.max(position.y, 0), maxY),
  };
}

function toRect(position, size) {
  return {
    x: position.x,
    y: position.y,
    width: size.width,
    height: size.height,
  };
}

function rectanglesOverlap(first, second) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

export function overlapsAnyBlock(position, sprite, blocks) {
  const spriteRect = toRect(position, sprite);

  return blocks.some((block) => rectanglesOverlap(spriteRect, block));
}

export function getMoveResult(position, key, bounds, sprite, blocks = []) {
  const next = { ...position };

  if (key === "ArrowUp") {
    next.y -= MOVE_STEP;
  } else if (key === "ArrowDown") {
    next.y += MOVE_STEP;
  } else if (key === "ArrowLeft") {
    next.x -= MOVE_STEP;
  } else if (key === "ArrowRight") {
    next.x += MOVE_STEP;
  }

  const clamped = clampPosition(next, bounds, sprite);

  if (overlapsAnyBlock(clamped, sprite, blocks)) {
    return {
      position,
      blocked: true,
    };
  }

  return {
    position: clamped,
    blocked: false,
  };
}

export function movePosition(position, key, bounds, sprite, blocks = []) {
  return getMoveResult(position, key, bounds, sprite, blocks).position;
}

function getRandomSnakeKey(random) {
  const keys = ["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"];
  return keys[Math.floor(random() * keys.length)];
}

function getChaseSnakeKey(snakePosition, pokemonPosition) {
  const deltaX = pokemonPosition.x - snakePosition.x;
  const deltaY = pokemonPosition.y - snakePosition.y;

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0 ? "ArrowRight" : "ArrowLeft";
  }

  return deltaY >= 0 ? "ArrowDown" : "ArrowUp";
}

export function getSnakeMoveResult(
  snakePosition,
  pokemonPosition,
  bounds,
  snakeSize,
  blocks = [],
  random = Math.random,
) {
  const key = random() < 0.25
    ? getRandomSnakeKey(random)
    : getChaseSnakeKey(snakePosition, pokemonPosition);
  const next = { ...snakePosition };

  if (key === "ArrowUp") {
    next.y -= SNAKE_STEP;
  } else if (key === "ArrowDown") {
    next.y += SNAKE_STEP;
  } else if (key === "ArrowLeft") {
    next.x -= SNAKE_STEP;
  } else if (key === "ArrowRight") {
    next.x += SNAKE_STEP;
  }

  const clamped = clampPosition(next, bounds, snakeSize);

  if (overlapsAnyBlock(clamped, snakeSize, blocks)) {
    return {
      position: snakePosition,
      blocked: true,
    };
  }

  return {
    position: clamped,
    blocked: false,
  };
}

export function isCaught(snakePosition, snakeSize, pokemonPosition, pokemonSize) {
  return rectanglesOverlap(
    toRect(snakePosition, snakeSize),
    toRect(pokemonPosition, pokemonSize),
  );
}

export function advanceSnakeBody(body, nextHeadPosition, maxLength) {
  return [nextHeadPosition, ...body].slice(0, maxLength);
}
