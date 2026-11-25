// The screenshot scenes behind ?shot=start|play|serve|end.
// Each one builds its state with the real world rules — orders spawned,
// ingredients chopped and plated through the same functions a player
// uses — then freezes it, so the frame is what the game really looks
// like at that moment, and the same seed always gives the same frame.
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

export function stageShot(name, world) {
  const state = world.state;
  world.reset();
  if (name === 'play') {
    // Mid-shift: two orders on the board, one dish half built on the
    // plate, a patty sizzling on the grill, timer running.
    world.spawnOrder('burger');
    world.spawnOrder('salad');
    state.orders[0].timeLeft = 41;
    state.orders[1].timeLeft = 52;
    state.shiftLeft = 132;
    state.score = 340;
    state.coins = 17;
    state.combo = 2;
    state.served = 2;
    state.held = 'chopped-tomato';
    state.plate = ['bread', 'cooked-patty'];
    state.grill.item = 'patty';
    state.grill.progress = 1.8;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'serve') {
    // A plate ready to serve: the cheeseburger is complete, its order
    // glows, the serving window is lit.
    world.spawnOrder('burger');
    world.spawnOrder('sandwich');
    state.orders[0].timeLeft = 33;
    state.orders[1].timeLeft = 47;
    state.shiftLeft = 98;
    state.score = 620;
    state.coins = 28;
    state.combo = 3;
    state.served = 4;
    state.plate = ['bread', 'cooked-patty', 'cheese'];
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'end') {
    state.score = 1240;
    state.coins = 61;
    state.combo = 0;
    state.bestCombo = 5;
    state.served = 9;
    state.missed = 1;
    state.hearts = 2;
    state.shiftLeft = 0;
    state.won = true;
    state.over = true;
    state.stars = 3;
    return { screen: SCREEN_OVER, best: 1240 };
  }
  // start: the title screen over a fresh kitchen with one order up.
  state.shiftLeft = 180;
  return { screen: SCREEN_TITLE, best: 0 };
}
