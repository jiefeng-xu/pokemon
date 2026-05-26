# Pokemon Movement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static browser game where a Pokemon moves around a full-window field with arrow keys and generated background music starts from a user button.

**Architecture:** Static HTML/CSS/JS keeps the first version lightweight. Pure movement logic lives in `movement.js` and browser wiring lives in `game.js`, so later gameplay challenges can build on a testable core.

**Tech Stack:** HTML, CSS, JavaScript ES modules, Node's built-in test runner.

---

### Task 1: Movement Core

**Files:**
- Create: `movement.js`
- Create: `tests/movement.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `tests/movement.test.mjs` with tests for arrow-key movement and boundary clamping.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/movement.test.mjs`

Expected: FAIL because `movement.js` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create `movement.js` exporting `MOVE_STEP`, `movePosition`, and `clampPosition`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/movement.test.mjs`

Expected: PASS.

### Task 2: Browser Game Screen

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `game.js`

- [ ] **Step 1: Create the static page**

Create the HUD, field, Pokemon element, and music button in `index.html`.

- [ ] **Step 2: Add the full-window visual layout**

Create `styles.css` with a responsive full-window field and a visible Pokemon sprite.

- [ ] **Step 3: Wire browser interactions**

Create `game.js` to listen for arrow keys, move within bounds, render position, recenter safely on resize, and toggle music after button click.

- [ ] **Step 4: Verify in browser**

Run: `python3 -m http.server 8000`

Open: `http://localhost:8000`

Expected: Arrow keys move the Pokemon, it stays inside the field, and the music control changes state after click.
