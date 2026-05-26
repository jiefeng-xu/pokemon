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

function getNextPositionForKey(position, key, step) {
  const next = { ...position };

  if (key === "ArrowUp") {
    next.y -= step;
  } else if (key === "ArrowDown") {
    next.y += step;
  } else if (key === "ArrowLeft") {
    next.x -= step;
  } else if (key === "ArrowRight") {
    next.x += step;
  }

  return next;
}

function getDistance(first, second) {
  return Math.abs(first.x - second.x) + Math.abs(first.y - second.y);
}

function getChaseSnakeKeys(snakePosition, pokemonPosition) {
  return ["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"].sort((first, second) => {
    const firstPosition = getNextPositionForKey(snakePosition, first, SNAKE_STEP);
    const secondPosition = getNextPositionForKey(snakePosition, second, SNAKE_STEP);

    return (
      getDistance(firstPosition, pokemonPosition) -
      getDistance(secondPosition, pokemonPosition)
    );
  });
}

function isSamePosition(first, second) {
  return first.x === second.x && first.y === second.y;
}

function getPositionKey(position) {
  return `${position.x},${position.y}`;
}

function getSnakeCandidate(position, key, bounds, snakeSize, blocks) {
  const clamped = clampPosition(
    getNextPositionForKey(position, key, SNAKE_STEP),
    bounds,
    snakeSize,
  );

  return {
    position: clamped,
    blocked:
      (clamped.x === position.x && clamped.y === position.y) ||
      overlapsAnyBlock(clamped, snakeSize, blocks),
  };
}

function findSnakePathStep(snakePosition, pokemonPosition, bounds, snakeSize, blocks) {
  const queue = [{ position: snakePosition, firstKey: null }];
  const visited = new Set([getPositionKey(snakePosition)]);
  const keys = getChaseSnakeKeys(snakePosition, pokemonPosition);
  let best = {
    distance: getDistance(snakePosition, pokemonPosition),
    firstKey: null,
  };

  while (queue.length > 0 && visited.size < 1200) {
    const current = queue.shift();

    for (const key of keys) {
      const candidate = getSnakeCandidate(
        current.position,
        key,
        bounds,
        snakeSize,
        blocks,
      );

      if (candidate.blocked || isSamePosition(candidate.position, current.position)) {
        continue;
      }

      const positionKey = getPositionKey(candidate.position);

      if (visited.has(positionKey)) {
        continue;
      }

      visited.add(positionKey);
      const firstKey = current.firstKey ?? key;
      const distance = getDistance(candidate.position, pokemonPosition);

      if (distance < best.distance) {
        best = { distance, firstKey };
      }

      if (distance <= SNAKE_STEP) {
        return firstKey;
      }

      queue.push({
        position: candidate.position,
        firstKey,
      });
    }
  }

  return best.firstKey;
}

export function getSnakeMoveResult(
  snakePosition,
  pokemonPosition,
  bounds,
  snakeSize,
  blocks = [],
  random = Math.random,
) {
  const preferredKey = random() < 0.25 ? getRandomSnakeKey(random) : null;
  const pathKey = preferredKey
    ? null
    : findSnakePathStep(snakePosition, pokemonPosition, bounds, snakeSize, blocks);
  const rankedKeys = pathKey
    ? [pathKey, ...getChaseSnakeKeys(snakePosition, pokemonPosition).filter((key) => key !== pathKey)]
    : getChaseSnakeKeys(snakePosition, pokemonPosition);
  const keys = preferredKey
    ? [preferredKey, ...rankedKeys.filter((key) => key !== preferredKey)]
    : rankedKeys;

  for (const key of keys) {
    const candidate = getSnakeCandidate(snakePosition, key, bounds, snakeSize, blocks);

    if (!candidate.blocked) {
      return candidate;
    }
  }

  return {
    position: snakePosition,
    blocked: true,
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
