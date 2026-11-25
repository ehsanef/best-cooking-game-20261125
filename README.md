# best-cooking-game-20261125

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/ehsanef/best-cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/ehsanef/best-cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Golden Ladle** — a complete, original cooking game set in the Saffron Kitchen. Lunch rush is on: orders appear on the board with a 60-second timer each. Pick ingredients from the counter, chop lettuce, tomato and onion on the chopping board, grill the patty, build each dish on the plate, and serve it at the window before the customer walks out.

Three dishes on the menu: Garden Salad, Cheeseburger and Veggie Sandwich. Score grows with speed and combo, three hearts stand between you and a ruined shift, and a 3-minute shift ends in a star rating. Keyboard (1–6 to pick ingredients, P pause, R restart, M mute, Backspace clear plate) and mouse both work. Everything is drawn and synthesized in code — no network requests, no copied art, music or names.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome and click **Start cooking**.

## How it plays

1. Click an ingredient bin (or press 1–6) to pick it up.
2. Raw ingredients need prep: lettuce, tomato and onion go on the chopping board; the patty goes on the grill. Click the station again when it is ready to collect it.
3. Click the plate to add what you are holding. The board shows what each order still needs.
4. When a plate matches an order exactly, the order glows green — click it, or the serving window, to serve. Serve fast for a time bonus and build your combo.
5. A missed order costs a heart. Lose all three hearts, or finish the 3-minute shift, and the day is rated in stars.

## Files

- `main.ts` — the entrypoint: copies `game/` and `screenshots/` to the output and writes `dossier.json`.
- `game/` — the playable game, plain static files: `index.html` plus ES modules under `game/src/` (world rules, renderer, input, sound, seeded random, screenshot staging).
- `screenshots/` — four real renders of the game's own code: title, mid-shift dish assembly, a plate ready to serve, and the shift-complete screen.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

---

<sub>Entered on [make.fun](https://make.fun/?ref=qzcjfqr9&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
