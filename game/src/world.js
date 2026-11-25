// Golden Ladle — the rules, with no drawing and no browser in it.
// The chef holds one ingredient at a time. Raw ingredients go to a
// station (chopping board or grill) to be prepared, prepared ones go on
// the plate, and a plate that matches an order exactly can be served
// at the window. Orders tick down; a missed order costs a heart.
// A shift lasts SHIFT_SECONDS; serve well and the day ends in stars.
import {
  BIN_ORDER, CHOP_SECONDS, DISHES, DISH_IDS, GRILL_SECONDS, INGREDIENTS,
  MAX_HEARTS, MAX_ORDERS, ORDER_SECONDS, ORDER_SPAWN_SECONDS, SHIFT_SECONDS,
  ZONES,
} from './config.js';

export const EVENT_PICK = 1;
export const EVENT_PLACE = 2;
export const EVENT_STATION_DONE = 4;
export const EVENT_SERVE = 8;
export const EVENT_BAD = 16;
export const EVENT_EXPIRE = 32;
export const EVENT_OVER = 64;
export const EVENT_WIN = 128;

function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}

function inRect(x, y, r) {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

export function createWorld(random) {
  const state = {
    score: 0, coins: 0, combo: 0, bestCombo: 0, served: 0, missed: 0,
    hearts: MAX_HEARTS, shiftLeft: SHIFT_SECONDS, elapsed: 0,
    spawnTimer: 2, orderSeq: 0, over: false, won: false, stars: 0,
    held: null, plate: [], orders: [],
    chop: { item: null, progress: 0, duration: CHOP_SECONDS },
    grill: { item: null, progress: 0, duration: GRILL_SECONDS },
    flash: '', flashTimer: 0,
  };

  function reset() {
    state.score = 0; state.coins = 0; state.combo = 0; state.bestCombo = 0;
    state.served = 0; state.missed = 0; state.hearts = MAX_HEARTS;
    state.shiftLeft = SHIFT_SECONDS; state.elapsed = 0; state.spawnTimer = 2;
    state.orderSeq = 0; state.over = false; state.won = false; state.stars = 0;
    state.held = null; state.plate = [];
    state.orders = []; state.chop = { item: null, progress: 0, duration: CHOP_SECONDS };
    state.grill = { item: null, progress: 0, duration: GRILL_SECONDS };
    state.flash = ''; state.flashTimer = 0;
    spawnOrder();
  }

  function spawnOrder(forceDish) {
    if (state.orders.length >= MAX_ORDERS) return null;
    const dish = forceDish || DISH_IDS[Math.floor(random() * DISH_IDS.length)];
    const order = {
      id: state.orderSeq + 1, dish, timeLeft: ORDER_SECONDS,
      customer: ['🧑‍🍳', '👩', '👨', '👵', '🧔', '👧'][state.orderSeq % 6],
    };
    state.orderSeq += 1;
    state.orders.push(order);
    return order;
  }

  function matchingOrder() {
    for (const order of state.orders) {
      if (sameSet(state.plate, DISHES[order.dish].needs)) return order;
    }
    return null;
  }

  function setFlash(text) {
    state.flash = text;
    state.flashTimer = 1.6;
  }

  function pickBin(index) {
    if (state.over || state.won) return 0;
    const id = BIN_ORDER[index];
    if (!id) return 0;
    state.held = id;
    return EVENT_PICK;
  }

  function clickStation(kind) {
    const station = kind === 'chop' ? state.chop : state.grill;
    if (state.held) {
      const ing = INGREDIENTS[state.held];
      if (ing.prep !== kind) {
        setFlash(`${ing.name} does not go on the ${kind === 'chop' ? 'chopping board' : 'grill'}`);
        return EVENT_BAD;
      }
      if (station.item) {
        setFlash('That station is busy');
        return EVENT_BAD;
      }
      station.item = state.held;
      station.progress = 0;
      state.held = null;
      return EVENT_PLACE;
    }
    if (station.item && station.progress >= station.duration) {
      state.held = INGREDIENTS[station.item].becomes;
      station.item = null;
      station.progress = 0;
      return EVENT_STATION_DONE;
    }
    return 0;
  }

  function clickPlate() {
    if (!state.held) return 0;
    const ing = INGREDIENTS[state.held];
    if (ing.prep) {
      setFlash(`${ing.name} needs the ${ing.prep === 'chop' ? 'chopping board' : 'grill'} first`);
      return EVENT_BAD;
    }
    if (state.plate.includes(state.held)) {
      setFlash('That is already on the plate');
      return EVENT_BAD;
    }
    state.plate.push(state.held);
    state.held = null;
    return EVENT_PLACE;
  }

  function serveOrder(orderId) {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return 0;
    if (!sameSet(state.plate, DISHES[order.dish].needs)) {
      setFlash('The plate does not match that order yet');
      return EVENT_BAD;
    }
    const dish = DISHES[order.dish];
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    const timeBonus = Math.round(order.timeLeft) * 2;
    const gained = Math.round((dish.base + timeBonus) * (1 + 0.1 * (state.combo - 1)));
    state.score += gained;
    state.coins += 5 + state.combo;
    state.served += 1;
    state.orders = state.orders.filter((o) => o.id !== orderId);
    state.plate = [];
    setFlash(`Served ${dish.name}! +${gained}  (combo x${state.combo})`);
    return EVENT_SERVE;
  }

  function serveReady() {
    const order = matchingOrder();
    if (!order) {
      setFlash(state.plate.length === 0 ? 'Build a dish on the plate first' : 'No order matches this plate');
      return EVENT_BAD;
    }
    return serveOrder(order.id);
  }

  function clearPlate() {
    if (state.plate.length === 0 && !state.held) return 0;
    state.plate = [];
    state.held = null;
    setFlash('Plate cleared');
    return EVENT_PLACE;
  }

  // A click at canvas coordinates. Returns event flags for sound/announce.
  function click(x, y) {
    if (state.over || state.won) return 0;
    // Order tickets first: clicking one serves it when the plate matches.
    const boardY = 64, boardH = 96;
    if (y >= boardY && y < boardY + boardH) {
      for (let i = 0; i < state.orders.length; i += 1) {
        const r = { x: 24 + i * 416, y: boardY, w: 400, h: boardH };
        if (inRect(x, y, r)) return serveOrder(state.orders[i].id);
      }
    }
    if (inRect(x, y, ZONES.chop)) return clickStation('chop');
    if (inRect(x, y, ZONES.grill)) return clickStation('grill');
    if (inRect(x, y, ZONES.plate)) return clickPlate();
    if (inRect(x, y, ZONES.serve)) return serveReady();
    if (inRect(x, y, ZONES.trash)) return clearPlate();
    if (inRect(x, y, ZONES.bins)) {
      const binW = ZONES.bins.w / BIN_ORDER.length;
      const index = Math.floor((x - ZONES.bins.x) / binW);
      if (index >= 0 && index < BIN_ORDER.length) return pickBin(index);
    }
    return 0;
  }

  function finish(won) {
    state.won = won;
    state.over = true;
    state.stars = won ? (state.missed === 0 ? 3 : state.served >= 8 ? 3 : state.served >= 5 ? 2 : 1) : 0;
    return won ? EVENT_WIN : EVENT_OVER;
  }

  function step(dt) {
    let events = 0;
    if (state.over || state.won) return events;
    state.elapsed += dt;
    state.shiftLeft = Math.max(0, state.shiftLeft - dt);
    if (state.flashTimer > 0) {
      state.flashTimer -= dt;
      if (state.flashTimer <= 0) state.flash = '';
    }
    for (const station of [state.chop, state.grill]) {
      if (station.item && station.progress < station.duration) {
        station.progress = Math.min(station.duration, station.progress + dt);
      }
    }
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnOrder();
      state.spawnTimer = ORDER_SPAWN_SECONDS;
    }
    for (const order of [...state.orders]) {
      order.timeLeft -= dt;
      if (order.timeLeft <= 0) {
        state.orders = state.orders.filter((o) => o.id !== order.id);
        state.missed += 1;
        state.combo = 0;
        state.hearts -= 1;
        setFlash(`Order #${order.id} walked out — a heart lost`);
        events |= EVENT_EXPIRE;
        if (state.hearts <= 0) {
          events |= finish(false);
          return events;
        }
      }
    }
    if (state.shiftLeft <= 0) {
      events |= finish(state.served > 0);
    }
    return events;
  }

  reset();
  return {
    state, reset, step, click, pickBin, clickStation, clickPlate,
    serveReady, serveOrder, clearPlate, spawnOrder, matchingOrder,
  };
}
