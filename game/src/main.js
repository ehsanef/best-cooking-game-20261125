// Golden Ladle — boot and the one loop. The world advances in fixed
// 1/60 s steps, the renderer paints what is there. Screens: title,
// play, paused, over. ?seed=N fixes the order pattern.
// ?shot=start|play|serve|end (with &seed=N) stages that scene instead
// of running the loop, paints it twice and sets window.__shotReady.
import { BEST_KEY, STEP, ZONES } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_BAD, EVENT_EXPIRE, EVENT_OVER, EVENT_PICK, EVENT_PLACE, EVENT_SERVE, EVENT_STATION_DONE, EVENT_WIN } from './world.js';
import { ACTION_CLEAR, ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { createSound } from './sound.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const sound = createSound();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off: the best score then lasts this visit only.
  }
}

function playSoundFor(events) {
  if (events & EVENT_SERVE) sound.serve();
  else if (events & EVENT_WIN) sound.win();
  else if (events & EVENT_OVER) sound.expire();
  else if (events & EVENT_EXPIRE) sound.expire();
  else if (events & EVENT_BAD) sound.bad();
  else if (events & EVENT_STATION_DONE) sound.ready();
  else if (events & EVENT_PICK) sound.pick();
  else if (events & EVENT_PLACE) sound.place();
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Serve the orders before their timers run out.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(world.state.won
      ? `Shift complete. Score ${world.state.score}. Best ${best}.`
      : `Shift over. Score ${world.state.score}. Best ${best}.`);
  }

  function handleClick(x, y) {
    sound.unlock();
    if (screen === SCREEN_TITLE) {
      if (x >= ZONES.start.x && x < ZONES.start.x + ZONES.start.w && y >= ZONES.start.y && y < ZONES.start.y + ZONES.start.h) startGame();
      return;
    }
    if (screen === SCREEN_OVER) {
      if (x >= ZONES.restart.x && x < ZONES.restart.x + ZONES.restart.w && y >= ZONES.restart.y && y < ZONES.restart.y + ZONES.restart.h) startGame();
      return;
    }
    if (screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
      return;
    }
    const events = world.click(x, y);
    playSoundFor(events);
    if (events & (EVENT_OVER | EVENT_WIN)) endGame();
    else if (events & EVENT_SERVE) announce(`Served! Score ${world.state.score}.`);
    else if (events & EVENT_EXPIRE) announce(`An order walked out. ${world.state.hearts} hearts left.`);
  }

  const input = createInput(canvas, handleClick, (index) => {
    sound.unlock();
    if (screen !== SCREEN_PLAY) return;
    playSoundFor(world.pickBin(index));
  });

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = sound.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_RESTART && (screen === SCREEN_OVER || screen === SCREEN_PLAY)) startGame();
    else if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
    if (actions & ACTION_CLEAR && screen === SCREEN_PLAY) {
      playSoundFor(world.clearPlate());
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) return;
    const events = world.step(STEP);
    playSoundFor(events);
    if (events & (EVENT_OVER | EVENT_WIN)) endGame();
    else if (events & EVENT_EXPIRE) announce(`An order walked out. ${world.state.hearts} hearts left.`);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  // For play-testing and screenshots: the live world, read-only from outside.
  window.__game = { world, get screen() { return screen; }, get best() { return best; } };

  announce('Golden Ladle. Press Space or click Start to cook.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
