// Golden Ladle — everything on screen, drawn on one canvas.
// The kitchen: a warm tiled wall, a wooden counter, an order board up
// top, the chopping board and grill on the left, the big plate in the
// middle, the serving window on the right, and the ingredient bins
// along the bottom. Screens: title, play, paused, over.
import { BIN_ORDER, DISHES, H, INGREDIENTS, W, ZONES } from './config.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight || '700'} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function emoji(ctx, str, x, y, size) {
  ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function timerColor(left, total) {
  const f = left / total;
  if (f > 0.5) return '#3fae5a';
  if (f > 0.25) return '#e8a13a';
  return '#d64545';
}

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function drawBackground() {
    ctx.fillStyle = '#f7ead2';
    ctx.fillRect(0, 0, W, H);
    // Tiled backsplash.
    ctx.fillStyle = '#f3d9a4';
    ctx.fillRect(0, 56, W, 112);
    ctx.strokeStyle = '#e0bd7e';
    ctx.lineWidth = 2;
    for (let x = 0; x <= W; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 56); ctx.lineTo(x, 168); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(0, 112); ctx.lineTo(W, 112); ctx.stroke();
    // Wooden counter and floor.
    ctx.fillStyle = '#a9743f';
    ctx.fillRect(0, 456, W, 24);
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(0, 480, W, 8);
    ctx.fillStyle = '#e9dcc3';
    ctx.fillRect(0, 606, W, 114);
    ctx.fillStyle = '#dcc9a3';
    for (let x = 0; x < W; x += 96) ctx.fillRect(x, 606, 2, 114);
  }

  function drawTopBar(state) {
    ctx.fillStyle = '#5b3a1e';
    ctx.fillRect(0, 0, W, 56);
    text(ctx, '🍳 Golden Ladle', 20, 29, 26, '#ffd98a', '800');
    text(ctx, 'Saffron Kitchen', 250, 30, 15, '#e8cba0');
    text(ctx, `Score ${state.score}`, 470, 29, 20, '#ffffff');
    text(ctx, `🪙 ${state.coins}`, 640, 29, 20, '#ffd94d');
    text(ctx, state.combo > 1 ? `🔥 Combo x${state.combo}` : 'Combo —', 760, 29, 18, state.combo > 1 ? '#ff9d5c' : '#cbb59a');
    text(ctx, `⏱ ${fmtTime(state.shiftLeft)}`, 950, 29, 22, state.shiftLeft < 30 ? '#ff8a7a' : '#ffffff', '800');
    const hearts = '❤️'.repeat(Math.max(0, state.hearts)) + '🤍'.repeat(Math.max(0, 3 - state.hearts));
    text(ctx, hearts, 1080, 29, 20, '#ffffff');
  }

  function drawOrders(state) {
    for (let i = 0; i < 3; i += 1) {
      const x = 24 + i * 416;
      const y = 64;
      const order = state.orders[i];
      rr(ctx, x, y, 400, 96, 12);
      ctx.fillStyle = order ? '#fffaf0' : '#efe3cb';
      ctx.fill();
      ctx.strokeStyle = order ? '#d8b26a' : '#d8c9a8';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (!order) {
        text(ctx, 'Next customer coming…', x + 200, y + 48, 16, '#a08a64', '600', 'center');
        continue;
      }
      const dish = DISHES[order.dish];
      const ready = state.plate.length > 0 && [...state.plate].sort().join() === [...dish.needs].sort().join();
      if (ready) {
        ctx.save();
        ctx.shadowColor = '#7cc46a';
        ctx.shadowBlur = 18;
        rr(ctx, x, y, 400, 96, 12);
        ctx.strokeStyle = '#3fae5a';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }
      emoji(ctx, order.customer, x + 34, y + 30, 30);
      text(ctx, `#${order.id}  ${dish.name}`, x + 62, y + 26, 19, '#3a2a12', '800');
      text(ctx, ready ? 'READY — click to serve!' : dish.blurb, x + 62, y + 50, 13, ready ? '#2e7d32' : '#7a6a4a', '700');
      let cx = x + 62;
      for (const need of dish.needs) {
        ctx.fillStyle = '#f3e6c8';
        ctx.beginPath(); ctx.arc(cx + 12, y + 76, 13, 0, Math.PI * 2); ctx.fill();
        emoji(ctx, INGREDIENTS[need].emoji, cx + 12, y + 77, 18);
        const done = state.plate.includes(need);
        if (done) {
          ctx.fillStyle = '#2e7d32';
          ctx.beginPath(); ctx.arc(cx + 22, y + 64, 7, 0, Math.PI * 2); ctx.fill();
          text(ctx, '✓', cx + 22, y + 64, 10, '#ffffff', '800', 'center');
        }
        cx += 34;
      }
      // Per-order timer.
      ctx.fillStyle = '#e5d5b3';
      rr(ctx, x + 250, y + 70, 130, 12, 6); ctx.fill();
      ctx.fillStyle = timerColor(order.timeLeft, 60);
      rr(ctx, x + 250, y + 70, Math.max(8, 130 * (order.timeLeft / 60)), 12, 6); ctx.fill();
      text(ctx, `${Math.ceil(order.timeLeft)}s`, x + 388, y + 52, 13, '#7a5a28', '700', 'right');
    }
  }

  function drawStation(state, kind) {
    const zone = kind === 'chop' ? ZONES.chop : ZONES.grill;
    const station = kind === 'chop' ? state.chop : state.grill;
    const busy = station.item && station.progress < station.duration;
    const done = station.item && station.progress >= station.duration;
    rr(ctx, zone.x, zone.y, zone.w, zone.h, 14);
    ctx.fillStyle = kind === 'chop' ? '#c89b62' : '#4a4a52';
    ctx.fill();
    ctx.strokeStyle = done ? '#3fae5a' : '#7a5a28';
    ctx.lineWidth = done ? 4 : 2;
    ctx.stroke();
    if (kind === 'chop') {
      text(ctx, '🔪 CHOPPING BOARD', zone.x + 16, zone.y + 22, 15, '#fff7e6', '800');
      emoji(ctx, '🥕', zone.x + 250, zone.y + 30, 26);
      if (station.item) emoji(ctx, INGREDIENTS[station.item].emoji, zone.x + 150, zone.y + 62, 40);
      else text(ctx, 'Lettuce · Tomato · Onion', zone.x + 150, zone.y + 68, 14, '#ffe9c4', '600', 'center');
    } else {
      text(ctx, '🔥 GRILL', zone.x + 16, zone.y + 22, 15, '#ffffff', '800');
      if (busy) emoji(ctx, '🔥', zone.x + 250, zone.y + 30, 26);
      if (station.item) emoji(ctx, INGREDIENTS[station.item].emoji, zone.x + 150, zone.y + 62, 40);
      else text(ctx, 'Patty — 3 seconds a side', zone.x + 150, zone.y + 68, 14, '#d8d8e0', '600', 'center');
    }
    if (station.item) {
      const f = station.progress / station.duration;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      rr(ctx, zone.x + 40, zone.y + 100, 220, 12, 6); ctx.fill();
      ctx.fillStyle = done ? '#3fae5a' : '#ffb03a';
      rr(ctx, zone.x + 40, zone.y + 100, Math.max(6, 220 * f), 12, 6); ctx.fill();
      text(ctx, done ? 'Ready — click to collect!' : busy ? 'Working…' : '', zone.x + 150, zone.y + 92, 13, done ? '#b8f0c0' : '#ffe9c4', '700', 'center');
    }
  }

  function drawPlate(state) {
    const zone = ZONES.plate;
    rr(ctx, zone.x, zone.y, zone.w, zone.h, 14);
    ctx.fillStyle = '#fffaf0';
    ctx.fill();
    ctx.strokeStyle = '#d8b26a';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, '🍽  YOUR PLATE — build the dish here', zone.x + 18, zone.y + 24, 15, '#7a5a28', '800');
    // The plate itself.
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(zone.x + 200, zone.y + 150, 150, 92, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d8c9a8'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#f3ead2';
    ctx.beginPath(); ctx.ellipse(zone.x + 200, zone.y + 150, 118, 68, 0, 0, Math.PI * 2); ctx.fill();
    if (state.plate.length === 0) {
      text(ctx, 'Empty plate', zone.x + 200, zone.y + 150, 18, '#b09a72', '600', 'center');
    } else {
      state.plate.forEach((id, i) => {
        const px = zone.x + 130 + (i % 3) * 70;
        const py = zone.y + 122 + Math.floor(i / 3) * 62;
        emoji(ctx, INGREDIENTS[id].emoji, px, py, 52);
      });
    }
    // What the plate still needs for the first order it could match.
    const match = state.orders.find((o) => state.plate.every((p) => DISHES[o.dish].needs.includes(p)));
    const target = match || state.orders[0];
    if (target) {
      const dish = DISHES[target.dish];
      const missing = dish.needs.filter((n) => !state.plate.includes(n));
      text(ctx, `${dish.name}: ${state.plate.length}/${dish.needs.length}`, zone.x + 400, zone.y + 110, 18, '#3a2a12', '800');
      text(ctx, missing.length === 0 ? 'Complete! Serve it!' : `Still needs: ${missing.map((m) => INGREDIENTS[m].name).join(', ')}`, zone.x + 400, zone.y + 140, 13, missing.length === 0 ? '#2e7d32' : '#7a6a4a', '700');
      text(ctx, dish.emoji, zone.x + 400, zone.y + 182, 40);
    }
    // Held item, in the chef's hand, bottom-left of the plate box.
    if (state.held) {
      ctx.fillStyle = '#5b3a1e';
      rr(ctx, zone.x + 16, zone.y + 214, 176, 40, 20); ctx.fill();
      emoji(ctx, INGREDIENTS[state.held].emoji, zone.x + 42, zone.y + 234, 26);
      text(ctx, INGREDIENTS[state.held].name, zone.x + 62, zone.y + 235, 13, '#ffffff', '700');
    }
  }

  function drawServeAndTrash(state) {
    const serve = ZONES.serve;
    const ready = state.orders.some((o) => [...state.plate].sort().join() === [...DISHES[o.dish].needs].sort().join());
    rr(ctx, serve.x, serve.y, serve.w, serve.h, 14);
    ctx.fillStyle = ready ? '#2e7d32' : '#8a6d3b';
    ctx.fill();
    if (ready) {
      ctx.save(); ctx.shadowColor = '#7cc46a'; ctx.shadowBlur = 20;
      rr(ctx, serve.x, serve.y, serve.w, serve.h, 14); ctx.strokeStyle = '#b8f0c0'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    }
    emoji(ctx, '🔔', serve.x + 150, serve.y + 46, 40);
    text(ctx, ready ? 'SERVE NOW!' : 'SERVING WINDOW', serve.x + 150, serve.y + 96, 18, '#ffffff', '800', 'center');
    const trash = ZONES.trash;
    rr(ctx, trash.x, trash.y, trash.w, trash.h, 14);
    ctx.fillStyle = '#7a4a3a';
    ctx.fill();
    ctx.strokeStyle = '#5b3a1e'; ctx.lineWidth = 2; ctx.stroke();
    emoji(ctx, '🗑️', trash.x + 150, trash.y + 46, 38);
    text(ctx, 'TRASH — clear plate', trash.x + 150, trash.y + 96, 15, '#ffe9d8', '800', 'center');
    text(ctx, `Served ${state.served} · Missed ${state.missed}`, trash.x + 150, trash.y + 118, 13, '#e8cba0', '600', 'center');
  }

  function drawBins(state) {
    const zone = ZONES.bins;
    text(ctx, 'INGREDIENTS — click to pick up  (keys 1–6)', 24, 472, 14, '#7a5a28', '800');
    const binW = zone.w / BIN_ORDER.length;
    BIN_ORDER.forEach((id, i) => {
      const x = zone.x + i * binW;
      const y = zone.y;
      const held = state.held === id;
      rr(ctx, x + 4, y, binW - 8, zone.h, 12);
      ctx.fillStyle = held ? '#ffe9a8' : '#fffaf0';
      ctx.fill();
      ctx.strokeStyle = held ? '#e8a13a' : '#d8b26a';
      ctx.lineWidth = held ? 4 : 2;
      ctx.stroke();
      emoji(ctx, INGREDIENTS[id].emoji, x + binW / 2, y + 40, 44);
      text(ctx, INGREDIENTS[id].name, x + binW / 2, y + 82, 15, '#3a2a12', '700', 'center');
      const hint = INGREDIENTS[id].prep === 'chop' ? 'chop it' : INGREDIENTS[id].prep === 'grill' ? 'grill it' : 'ready';
      text(ctx, `${i + 1} · ${hint}`, x + binW / 2, y + 102, 12, '#7a6a4a', '600', 'center');
    });
  }

  function drawHints() {
    text(ctx, 'Click a bin → chop or grill if it needs it → click the plate → serve at the window.   P pause · R restart · M mute · Backspace clear plate', 24, 640, 14, '#7a6a4a', '600');
    text(ctx, 'Golden Ladle — an original game. No network, no ads, just lunch rush.', 24, 668, 13, '#a08a64', '600');
  }

  function drawFlash(state) {
    if (!state.flash) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, state.flashTimer);
    const w = ctx.measureText(state.flash).width + 60;
    ctx.fillStyle = 'rgba(58,42,18,0.92)';
    rr(ctx, W / 2 - 320, 668, 640, 36, 18); ctx.fill();
    text(ctx, state.flash, W / 2, 686, 16, '#ffe9a8', '700', 'center');
    ctx.restore();
    void w;
  }

  function overlay(title, lines, button, best) {
    ctx.fillStyle = 'rgba(40,26,10,0.72)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fffaf0';
    rr(ctx, 290, 110, 700, 470, 20); ctx.fill();
    ctx.strokeStyle = '#d8b26a'; ctx.lineWidth = 3; ctx.stroke();
    text(ctx, title, 640, 170, 44, '#5b3a1e', '800', 'center');
    lines.forEach((line, i) => {
      text(ctx, line, 640, 240 + i * 34, 19, '#3a2a12', line.startsWith('★') ? '800' : '600', 'center');
    });
    if (button) {
      rr(ctx, ZONES.start.x, ZONES.start.y, ZONES.start.w, ZONES.start.h, 14);
      ctx.fillStyle = '#2e7d32'; ctx.fill();
      text(ctx, button, 640, ZONES.start.y + 32, 22, '#ffffff', '800', 'center');
    }
    if (best) text(ctx, best, 640, 610, 16, '#7a6a4a', '700', 'center');
  }

  function draw(state, screen, best) {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawTopBar(state);
    drawOrders(state);
    drawStation(state, 'chop');
    drawStation(state, 'grill');
    drawPlate(state);
    drawServeAndTrash(state);
    drawBins(state);
    drawHints();
    drawFlash(state);
    if (screen === SCREEN_TITLE) {
      overlay('🍳 Golden Ladle', [
        'Welcome to the Saffron Kitchen — lunch rush is on!',
        'Pick ingredients, chop and grill them, build each dish',
        'on the plate, and serve it before the customer walks out.',
        'Three dishes, one busy kitchen, 3 minutes a shift.',
        'Serve 8 dishes for a perfect day. Good luck, chef!',
      ], '▶  Start cooking', best > 0 ? `Best score so far: ${best}` : 'Your first shift — make it count!');
    } else if (screen === SCREEN_PAUSED) {
      overlay('Paused', ['Take a breath, chef.', 'Press P or click to carry on.'], null, null);
    } else if (screen === SCREEN_OVER) {
      const won = state.won;
      overlay(won ? '🎉 Shift complete!' : '😮‍💨 Shift over', [
        won ? `You served ${state.served} dishes and scored ${state.score}!` : `You served ${state.served} dishes — score ${state.score}.`,
        won ? '★'.repeat(state.stars) + '☆'.repeat(3 - state.stars) : 'Three customers walked out. The kitchen forgives — try again!',
        `Best combo x${state.bestCombo} · ${state.missed} missed · ${state.coins} coins earned`,
      ], '↻  Cook again (R)', best > 0 ? `Best score: ${best}` : null);
    }
  }

  return { draw };
}
