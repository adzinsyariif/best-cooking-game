# Ember & Thyme — Rush Hour Kitchen

[![bounty](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/adzinsyariif/best-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/adzinsyariif/best-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A complete, original cooking game for the [best cooking game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137) on make.fun. You are the only chef on shift in a small kitchen: orders pile up on the board, and you grab ingredients, chop them, grill them, build the plate and serve it hot — before patience runs out.

## How to play

Open `game/index.html` in a desktop browser (or serve `game/` with any static server). No network, no build step.

- **WASD / arrow keys** — move the chef
- **E / Space** — grab, chop (hold), cook, plate, serve; clicking a station near you does the same
- **M** — mute

## The loop

1. **Grab** an ingredient from the pantry crates along the top wall.
2. **Chop** vegetables on the board (hold E) or **grill** them on the stove — leave food in the pan too long and it burns.
3. **Plate** it on the plating counter. A plate holds up to 3 items.
4. **Serve** at the window when the plate matches an order ticket.

Five recipes combine the six ingredients in different ways: Garden Salad, Sunny Soup, Ember Skillet, Forest Stack and Cheesy Melt. Serving fast pays a patience bonus; chaining serves builds a combo multiplier. A lost order breaks the combo. The shift lasts 3 minutes — the last minute is **Rush Hour**, when orders arrive faster and wait less.

## Layout

- `game/` — the game: `index.html`, `css/style.css`, and `js/` split by job (`game.js` loop & interactions, `render.js` all drawing, `kitchen.js` floor plan, `orders.js` order board, `recipes.js` dishes, `player.js` the chef, `audio.js` synthesised sounds)
- `screenshots/` — 4 real renders of the game's own code
- `main.ts` — copies `game/` + `screenshots/` to the output dir and writes `dossier.json` with the vendored make.fun library
- `vendor/makefun-game.ts` — the kit's library, unchanged

All art is vector shapes drawn on canvas and all sounds are synthesised with WebAudio — there are no image or audio files to download, so the game plays fully offline.

## License

MIT — see [LICENSE](LICENSE).
