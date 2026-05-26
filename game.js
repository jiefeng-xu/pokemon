import {
  clampPosition,
  getMoveResult,
  getSnakeMoveResult,
  isCaught,
  overlapsAnyBlock,
} from "./movement.js";

const field = document.querySelector("#gameField");
const blockLayer = document.querySelector("#blockLayer");
const pokemon = document.querySelector("#pokemon");
const snake = document.querySelector("#snake");
const musicButton = document.querySelector("#musicButton");

const BLOCK_COUNT = 8;
const BLOCK_SIZE = { width: 72, height: 54 };
const START_CLEARANCE = 96;
const SNAKE_TICK_MS = 300;
const SNAKE_RESPAWN_PADDING = 72;

let position = { x: 0, y: 0 };
let snakePosition = { x: 0, y: 0 };
let blocks = [];
let snakeTimer;
let audioContext;
let musicTimer;
let isMusicPlaying = false;

function getAudioContext() {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  audioContext ??= new AudioContextConstructor();
  return audioContext;
}

function getBounds() {
  return {
    width: field.clientWidth,
    height: field.clientHeight,
  };
}

function getSpriteSize() {
  return {
    width: pokemon.offsetWidth,
    height: pokemon.offsetHeight,
  };
}

function getSnakeSize() {
  return {
    width: snake.offsetWidth,
    height: snake.offsetHeight,
  };
}

function render() {
  pokemon.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
  snake.style.transform = `translate3d(${snakePosition.x}px, ${snakePosition.y}px, 0)`;
}

function randomBetween(minimum, maximum) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function createStartSafeZone(bounds, sprite) {
  return {
    x: Math.round((bounds.width - sprite.width) / 2) - START_CLEARANCE,
    y: Math.round((bounds.height - sprite.height) / 2) - START_CLEARANCE,
    width: sprite.width + START_CLEARANCE * 2,
    height: sprite.height + START_CLEARANCE * 2,
  };
}

function createRandomBlock(bounds) {
  const width = randomBetween(52, BLOCK_SIZE.width);
  const height = randomBetween(42, BLOCK_SIZE.height);

  return {
    x: randomBetween(12, Math.max(12, bounds.width - width - 12)),
    y: randomBetween(12, Math.max(12, bounds.height - height - 12)),
    width,
    height,
  };
}

function createBlocks() {
  const bounds = getBounds();
  const sprite = getSpriteSize();
  const safeZone = createStartSafeZone(bounds, sprite);
  const nextBlocks = [];
  let attempts = 0;

  while (nextBlocks.length < BLOCK_COUNT && attempts < 300) {
    attempts += 1;
    const block = createRandomBlock(bounds);
    const hitsSafeZone = overlapsAnyBlock(safeZone, { width: safeZone.width, height: safeZone.height }, [block]);
    const hitsOtherBlock = overlapsAnyBlock(block, { width: block.width, height: block.height }, nextBlocks);

    if (!hitsSafeZone && !hitsOtherBlock) {
      nextBlocks.push(block);
    }
  }

  return nextBlocks;
}

function renderBlocks() {
  blockLayer.replaceChildren(
    ...blocks.map((block) => {
      const blockElement = document.createElement("span");
      blockElement.className = "block";
      blockElement.style.transform = `translate3d(${block.x}px, ${block.y}px, 0)`;
      blockElement.style.width = `${block.width}px`;
      blockElement.style.height = `${block.height}px`;
      return blockElement;
    }),
  );
}

function createSnakePosition() {
  const bounds = getBounds();
  const snakeSize = getSnakeSize();
  const pokemonSize = getSpriteSize();
  const maxX = Math.max(SNAKE_RESPAWN_PADDING, bounds.width - snakeSize.width - SNAKE_RESPAWN_PADDING);
  const maxY = Math.max(SNAKE_RESPAWN_PADDING, bounds.height - snakeSize.height - SNAKE_RESPAWN_PADDING);
  let attempts = 0;

  while (attempts < 200) {
    attempts += 1;
    const candidate = clampPosition(
      {
        x: randomBetween(SNAKE_RESPAWN_PADDING, maxX),
        y: randomBetween(SNAKE_RESPAWN_PADDING, maxY),
      },
      bounds,
      snakeSize,
    );
    const farEnough =
      Math.abs(candidate.x - position.x) > 220 ||
      Math.abs(candidate.y - position.y) > 160;

    if (
      farEnough &&
      !overlapsAnyBlock(candidate, snakeSize, blocks) &&
      !isCaught(candidate, snakeSize, position, pokemonSize)
    ) {
      return candidate;
    }
  }

  return clampPosition({ x: 24, y: 24 }, bounds, snakeSize);
}

function centerPokemon() {
  const bounds = getBounds();
  const sprite = getSpriteSize();

  position = clampPosition(
    {
      x: Math.round((bounds.width - sprite.width) / 2),
      y: Math.round((bounds.height - sprite.height) / 2),
    },
    bounds,
    sprite,
  );
  render();
}

function resetGame() {
  centerPokemon();
  blocks = createBlocks();
  renderBlocks();
  snakePosition = createSnakePosition();
  playCaughtSound();
  render();
}

function playTone(frequency, startTime, duration) {
  const context = getAudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.045, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

function playHitSound() {
  const context = getAudioContext();
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(180, now);
  oscillator.frequency.exponentialRampToValueAtTime(82, now + 0.18);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.11, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.24);
}

function playCaughtSound() {
  const context = getAudioContext();
  const now = context.currentTime;

  playTone(220, now, 0.12);
  playTone(146.83, now + 0.13, 0.18);
}

function scheduleMusicLoop() {
  const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46];
  let noteIndex = 0;

  musicTimer = window.setInterval(() => {
    const now = audioContext.currentTime;
    playTone(melody[noteIndex], now, 0.18);
    noteIndex = (noteIndex + 1) % melody.length;
  }, 220);
}

async function startMusic() {
  await getAudioContext().resume();
  scheduleMusicLoop();
  isMusicPlaying = true;
  musicButton.textContent = "Pause Music";
}

function stopMusic() {
  window.clearInterval(musicTimer);
  musicTimer = undefined;
  isMusicPlaying = false;
  musicButton.textContent = "Start Music";
}

musicButton.addEventListener("click", async () => {
  if (isMusicPlaying) {
    stopMusic();
    return;
  }

  await startMusic();
});

window.addEventListener("keydown", (event) => {
  if (!event.key.startsWith("Arrow")) {
    return;
  }

  event.preventDefault();
  const result = getMoveResult(position, event.key, getBounds(), getSpriteSize(), blocks);
  position = result.position;

  if (result.blocked) {
    playHitSound();
  }

  render();
});

window.addEventListener("resize", () => {
  position = clampPosition(position, getBounds(), getSpriteSize());
  snakePosition = clampPosition(snakePosition, getBounds(), getSnakeSize());
  render();
});

centerPokemon();
blocks = createBlocks();
renderBlocks();
snakePosition = createSnakePosition();
render();
snakeTimer = window.setInterval(() => {
  const result = getSnakeMoveResult(
    snakePosition,
    position,
    getBounds(),
    getSnakeSize(),
    blocks,
  );
  snakePosition = result.position;

  if (isCaught(snakePosition, getSnakeSize(), position, getSpriteSize())) {
    resetGame();
    return;
  }

  render();
}, SNAKE_TICK_MS);
