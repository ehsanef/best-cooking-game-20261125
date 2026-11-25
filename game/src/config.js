// Golden Ladle — constants, ingredients and the three dishes on the menu.
// Nothing here touches the browser: the world and the renderer share it.
export const W = 1280;
export const H = 720;
export const STEP = 1 / 60;
export const SHIFT_SECONDS = 180;
export const ORDER_SECONDS = 60;
export const ORDER_SPAWN_SECONDS = 14;
export const MAX_ORDERS = 3;
export const MAX_HEARTS = 3;
export const BEST_KEY = 'golden-ladle-best';
export const CHOP_SECONDS = 1.6;
export const GRILL_SECONDS = 3.2;

// Every ingredient: its emoji, its colour, which station prepares it
// (null = ready to plate as it comes), and what it becomes after prep.
export const INGREDIENTS = {
  bread: { name: 'Bread', emoji: '🍞', color: '#e8b25c', prep: null, becomes: 'bread' },
  patty: { name: 'Patty', emoji: '🥩', color: '#c25b5b', prep: 'grill', becomes: 'cooked-patty' },
  lettuce: { name: 'Lettuce', emoji: '🥬', color: '#5da24a', prep: 'chop', becomes: 'chopped-lettuce' },
  tomato: { name: 'Tomato', emoji: '🍅', color: '#e05252', prep: 'chop', becomes: 'chopped-tomato' },
  cheese: { name: 'Cheese', emoji: '🧀', color: '#f2c94c', prep: null, becomes: 'cheese' },
  onion: { name: 'Onion', emoji: '🧅', color: '#c9a0dc', prep: 'chop', becomes: 'chopped-onion' },
  'cooked-patty': { name: 'Grilled Patty', emoji: '🍔', color: '#8a5a2b', prep: null, becomes: 'cooked-patty' },
  'chopped-lettuce': { name: 'Chopped Lettuce', emoji: '🥬', color: '#7cc46a', prep: null, becomes: 'chopped-lettuce' },
  'chopped-tomato': { name: 'Chopped Tomato', emoji: '🍅', color: '#f07878', prep: null, becomes: 'chopped-tomato' },
  'chopped-onion': { name: 'Chopped Onion', emoji: '🧅', color: '#d8b8e8', prep: null, becomes: 'chopped-onion' },
};

// The order bins appear in this order along the counter; keys 1-6 pick them.
export const BIN_ORDER = ['bread', 'patty', 'lettuce', 'tomato', 'cheese', 'onion'];

export const DISHES = {
  salad: {
    name: 'Garden Salad', emoji: '🥗', base: 100,
    needs: ['chopped-lettuce', 'chopped-tomato', 'chopped-onion'],
    blurb: 'Crisp, fresh, chopped to order',
  },
  burger: {
    name: 'Cheeseburger', emoji: '🍔', base: 140,
    needs: ['bread', 'cooked-patty', 'cheese'],
    blurb: 'Grilled patty, melted cheese',
  },
  sandwich: {
    name: 'Veggie Sandwich', emoji: '🥪', base: 120,
    needs: ['bread', 'chopped-lettuce', 'chopped-tomato', 'cheese'],
    blurb: 'Layers of garden goodness',
  },
};
export const DISH_IDS = ['salad', 'burger', 'sandwich'];

// Clickable rectangles, in canvas pixels. The renderer draws them; the
// input layer and the world both read the same table, so a click never
// lands somewhere the picture does not show.
export const ZONES = {
  chop: { x: 24, y: 176, w: 300, h: 128 },
  grill: { x: 24, y: 316, w: 300, h: 128 },
  plate: { x: 372, y: 176, w: 536, h: 268 },
  serve: { x: 956, y: 176, w: 300, h: 128 },
  trash: { x: 956, y: 316, w: 300, h: 128 },
  bins: { x: 24, y: 480, w: 1232, h: 118 },
  start: { x: 490, y: 520, w: 300, h: 64 },
  restart: { x: 490, y: 520, w: 300, h: 64 },
};
