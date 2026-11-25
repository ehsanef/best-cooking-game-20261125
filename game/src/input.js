// Keyboard and mouse, turned into game actions. Clicks are scaled from
// the canvas's displayed size to its 1280x720 logical size, so the game
// plays the same at any window size.
import { BIN_ORDER, ZONES } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;
export const ACTION_MUTE = 8;
export const ACTION_CLEAR = 16;
export const ACTION_SERVE = 32;

export function createInput(canvas, onClick, onBin) {
  let actions = 0;
  const clicks = [];

  function scale(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    const p = scale(event);
    clicks.push(p);
    if (onClick) onClick(p.x, p.y);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === ' ' || key === 'enter') {
      actions |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (key === 'p' || key === 'escape') {
      actions |= ACTION_PAUSE;
    } else if (key === 'r') {
      actions |= ACTION_RESTART;
    } else if (key === 'm') {
      actions |= ACTION_MUTE;
    } else if (key === 'backspace') {
      actions |= ACTION_CLEAR;
    } else if (key >= '1' && key <= '6') {
      const index = Number(key) - 1;
      if (index < BIN_ORDER.length && onBin) onBin(index);
    }
  });

  return {
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
  };
}

export { ZONES };
