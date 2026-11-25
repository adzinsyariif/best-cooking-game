// game.js — Ember & Thyme: Rush Hour Kitchen. Main loop, state machine,
// interactions between chef and stations, particles, and the demo scenes
// (?scene=cover|rush|serve) that stage a rich mid-game moment for screenshots.
// The game is a single canvas; every file it loads lives under game/.

import { INGREDIENTS, RECIPES, itemId, recipeForPlate } from './recipes.js';
import { buildKitchen, nearestStation, collideSolids, VIEW_W, VIEW_H } from './kitchen.js';
import { OrderBoard } from './orders.js';
import { Chef } from './player.js';
import { SoundBank } from './audio.js';
import {
  drawKitchen, drawChef, drawHUD, drawParticles, drawFloaters, drawPrompt,
  drawTitle, drawGameOver,
} from './render.js';

const SHIFT_LENGTH = 180; // 3-minute shift
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const kitchen = buildKitchen();
const sounds = new SoundBank();

const game = {
  state: 'title', // title | playing | over
  score: 0,
  combo: 0,
  bestCombo: 0,
  elapsed: 0,
  shiftLength: SHIFT_LENGTH,
  chef: new Chef(VIEW_W / 2, 430),
  board: new OrderBoard(),
  // Chopping board: { item: 'tomato' | null, chopProgress: 0..1, chopping: bool }
  boardState: { item: null, chopProgress: 0 },
  // Stove burners: [{ item: 'tomato-chopped' | null, progress, burnt }]
  stove: [{ item: null, progress: 0, burnt: false }, { item: null, progress: 0, burnt: false }],
  // The working plate on the plating counter: { items: [] } | null
  plate: null,
  // A finished plate parked at the serving window (visual "ready to serve").
  windowPlate: null,
  nearStation: null,
  promptText: '',
  particles: [],
  floaters: [],
  keys: new Set(),
  interactHeld: false,
  lastTickSecond: -1,
  startedAt: 0,
};

function resetShift() {
  game.score = 0;
  game.combo = 0;
  game.bestCombo = 0;
  game.elapsed = 0;
  game.chef.reset(VIEW_W / 2, 430);
  game.board.reset();
  game.boardState = { item: null, chopProgress: 0 };
  game.stove = [{ item: null, progress: 0, burnt: false }, { item: null, progress: 0, burnt: false }];
  game.plate = null;
  game.windowPlate = null;
  game.particles = [];
  game.floaters = [];
  game.lastTickSecond = -1;
  game.startedAt = performance.now();
}

function addFloater(text, x, y, color = '#ffd166', size = 22) {
  game.floaters.push({ text, x, y, color, size, life: 1.4, maxLife: 1.4 });
}

function burst(x, y, color, n = 10, speed = 120) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.8);
    game.particles.push({
      x, y,
      vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40,
      size: 2 + Math.random() * 3, color,
      life: 0.6 + Math.random() * 0.4, maxLife: 1,
    });
  }
}

function steam(x, y) {
  game.particles.push({
    x: x + (Math.random() - 0.5) * 16, y,
    vx: (Math.random() - 0.5) * 8, vy: -34 - Math.random() * 20,
    size: 3 + Math.random() * 3, color: 'rgba(255,255,255,0.85)',
    life: 0.9, maxLife: 0.9,
  });
}

// ---- interactions ---------------------------------------------------------

function promptFor(station) {
  const c = game.chef;
  const hand = c.carrying;
  switch (station.kind) {
    case 'crate': return hand ? '' : `E — Grab ${INGREDIENTS[station.ingredient].name}`;
    case 'board': {
      if (game.boardState.item) {
        // A raw item stays on the board until it is chopped (hold E);
        // a chopped item can be picked back up.
        return game.boardState.item.includes('-') ? 'E — Take it' : 'Hold E — Chop!';
      }
      if (hand && hand.kind === 'item') {
        const ing = hand.id.split('-')[0];
        return INGREDIENTS[ing].chop ? 'E — Put on board' : 'Can\'t chop this';
      }
      return 'Chopping board';
    }
    case 'stove': {
      const b = game.stove[station.burner];
      if (b.item) return b.burnt ? 'E — Bin the burnt food' : (hand ? '' : 'E — Take from pan');
      if (hand && hand.kind === 'item') {
        const ing = hand.id.split('-')[0];
        return INGREDIENTS[ing].cook ? 'E — Into the pan' : 'Can\'t grill this';
      }
      return 'Stove';
    }
    case 'plates': {
      if (hand && hand.kind === 'plate') return game.plate ? '' : 'E — Set plate down';
      if (hand && hand.kind === 'item') return game.plate ? 'E — Add to plate' : 'Take a plate first';
      if (game.plate) return 'E — Pick up plate';
      return 'E — Take a clean plate';
    }
    case 'window': {
      if (hand && hand.kind === 'plate') {
        const match = recipeForPlate(hand.items);
        return match ? `E — Serve ${match.name}!` : 'E — Serve (no order matches)';
      }
      return 'Serving window';
    }
    case 'trash': return hand ? 'E — Throw away' : 'Trash';
    default: return '';
  }
}

function interact() {
  if (game.state !== 'playing' || !game.nearStation) return;
  const s = game.nearStation;
  const c = game.chef;
  const hand = c.carrying;

  if (s.kind === 'crate') {
    if (hand) return;
    c.carrying = { kind: 'item', id: s.ingredient };
    sounds.pickup();
    burst(s.x + s.w / 2, s.y + 20, INGREDIENTS[s.ingredient].color, 6, 60);
    return;
  }
  if (s.kind === 'board') {
    if (game.boardState.item) {
      if (!hand && game.boardState.item.includes('-')) {
        // Only a finished (chopped) item can be picked back up; a raw
        // item stays put until the player holds E and chops it.
        c.carrying = { kind: 'item', id: game.boardState.item };
        game.boardState.item = null;
        game.boardState.chopProgress = 0;
        sounds.pickup();
      }
      return;
    }
    if (hand && hand.kind === 'item') {
      const ing = hand.id.split('-')[0];
      if (hand.id.includes('-')) return; // only raw veg goes on the board
      if (!INGREDIENTS[ing].chop) { sounds.error(); return; }
      game.boardState.item = hand.id;
      game.boardState.chopProgress = 0;
      c.carrying = null;
      sounds.place();
    }
    return;
  }
  if (s.kind === 'stove') {
    const b = game.stove[s.burner];
    if (b.item) {
      if (b.burnt) {
        b.item = null; b.progress = 0; b.burnt = false;
        sounds.place();
        addFloater('binned', s.x + s.w / 2, s.y - 8, '#b8a88f', 16);
        return;
      }
      if (!hand) {
        const ing = b.item.split('-')[0];
        c.carrying = { kind: 'item', id: itemId(ing, 'cooked') };
        b.item = null; b.progress = 0;
        sounds.pickup();
      }
      return;
    }
    if (hand && hand.kind === 'item') {
      const [ing, state] = hand.id.split('-');
      if (state === 'cooked' || state === 'burnt') { sounds.error(); return; }
      if (!INGREDIENTS[ing].cook) { sounds.error(); return; }
      b.item = hand.id;
      b.progress = 0;
      b.burnt = false;
      c.carrying = null;
      sounds.sizzleStart();
      sounds.place();
    }
    return;
  }
  if (s.kind === 'plates') {
    if (hand && hand.kind === 'plate') {
      if (!game.plate) { game.plate = hand; c.carrying = null; sounds.place(); }
      return;
    }
    if (hand && hand.kind === 'item') {
      if (!game.plate) { sounds.error(); return; }
      if (game.plate.items.length >= 3) { sounds.error(); return; }
      game.plate.items.push(hand.id);
      c.carrying = null;
      sounds.place();
      burst(s.x + s.w / 2, s.y + s.h / 2, '#ffd166', 8, 70);
      return;
    }
    if (!hand) {
      if (game.plate) { c.carrying = game.plate; game.plate = null; sounds.pickup(); }
      else { c.carrying = { kind: 'plate', items: [] }; sounds.pickup(); }
    }
    return;
  }
  if (s.kind === 'window') {
    if (hand && hand.kind === 'plate') {
      const match = recipeForPlate(hand.items);
      if (!match) { sounds.error(); addFloater('No order wants this!', s.x + s.w / 2, s.y - 10, '#ff6b6b', 17); return; }
      const ticket = game.board.servePlate(hand.items);
      if (!ticket) { sounds.error(); return; }
      game.combo += 1;
      game.bestCombo = Math.max(game.bestCombo, game.combo);
      const pts = OrderBoard.scoreFor(ticket, game.combo);
      game.score += pts;
      c.carrying = null;
      sounds.serve();
      addFloater(`+${pts}  ${match.name}!`, s.x + s.w / 2, s.y - 12, '#ffd166', 24);
      if (game.combo > 1) addFloater(`COMBO x${game.combo}`, s.x + s.w / 2, s.y - 40, '#ff9f1c', 18);
      burst(s.x + s.w / 2, s.y + 20, '#ffd166', 16, 160);
    }
    return;
  }
  if (s.kind === 'trash') {
    if (hand) { c.carrying = null; sounds.place(); addFloater('trashed', s.x + s.w / 2, s.y - 8, '#b8a88f', 15); }
  }
}

// Chopping happens while E is held near a loaded board.
function updateChopping(dt) {
  const b = game.boardState;
  if (!b.item || game.state !== 'playing') return;
  const nearBoard = game.nearStation && game.nearStation.kind === 'board';
  if (nearBoard && game.interactHeld) {
    b.chopProgress += dt / 1.1;
    if (Math.random() < dt * 14) {
      const s = game.nearStation;
      burst(s.x + s.w / 2, s.y + s.h / 2 + 10, '#e8c99a', 2, 50);
      if (Math.random() < 0.4) sounds.chop();
    }
    if (b.chopProgress >= 1) {
      const ing = b.item.split('-')[0];
      b.item = itemId(ing, 'chopped');
      b.chopProgress = 0;
      sounds.chop();
      burst(game.nearStation.x + game.nearStation.w / 2, game.nearStation.y + 60, INGREDIENTS[ing].color, 10, 90);
    }
  }
}

// Stove burners cook over time; left too long, food burns.
function updateStove(dt) {
  for (const b of game.stove) {
    if (!b.item || b.burnt) continue;
    b.progress += dt;
    const total = INGREDIENTS[b.item.split('-')[0]].cookTime;
    if (Math.random() < dt * 6) {
      const st = kitchen.stations.find((s) => s.kind === 'stove' && game.stove.indexOf(b) === s.burner);
      if (st) steam(st.x + st.w / 2, st.y + st.h / 2 - 10);
    }
    if (b.progress > total * 2.2) {
      b.burnt = true;
      b.item = itemId(b.item.split('-')[0], 'burnt');
      sounds.error();
    }
  }
}

// ---- demo scenes (for screenshots) ----------------------------------------
// These seed a real mid-game state through the same objects the game plays
// with — the screenshots are renders of the game's own code, mid-shift.

function seedTicket(recipeId, patienceFrac) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  const patience = 78 * patienceFrac;
  return { recipe, patience, maxPatience: 78, id: Math.random().toString(36).slice(2, 9), born: 0 };
}

function applyScene(name) {
  resetShift();
  game.state = 'playing';
  if (name === 'cover') {
    game.elapsed = 73; // 1:47 left on the shift clock
    game.score = 340;
    game.combo = 2;
    game.bestCombo = 2;
    game.board.tickets = [
      seedTicket('garden-salad', 0.55),
      seedTicket('sunny-soup', 0.8),
      seedTicket('ember-skillet', 0.35),
    ];
    game.board.served = 3;
    // Dish mid-assembly on the plating counter (2 of 3 for the salad).
    game.plate = { items: ['tomato-chopped', 'onion-chopped'] };
    // A finished plate parked at the window, ready to serve.
    game.windowPlate = { items: ['tomato-cooked', 'onion-cooked'] };
    // Mushroom grilling on burner 0, pepper chopped on the board.
    game.stove[0] = { item: 'mushroom-chopped', progress: 2.6, burnt: false };
    game.boardState = { item: 'pepper-chopped', chopProgress: 0 };
    // Chef by the plating counter, holding the last salad ingredient.
    game.chef.x = 640;
    game.chef.y = 585;
    game.chef.carrying = { kind: 'item', id: 'pepper-chopped' };
    game.nearStation = kitchen.stations.find((s) => s.kind === 'plates');
  } else if (name === 'rush') {
    game.elapsed = 132; // rush hour: 48 seconds left
    game.score = 1180;
    game.combo = 4;
    game.bestCombo = 4;
    game.board.tickets = [
      seedTicket('ember-skillet', 0.25),
      seedTicket('cheesy-melt', 0.4),
      seedTicket('forest-stack', 0.6),
      seedTicket('sunny-soup', 0.18),
    ];
    game.board.served = 9;
    game.plate = { items: ['bread-cooked', 'cheese'] };
    game.stove[0] = { item: 'mushroom-chopped', progress: 4.2, burnt: false };
    game.stove[1] = { item: 'pepper-chopped', progress: 1.1, burnt: false };
    game.boardState = { item: 'tomato', chopProgress: 0.55 };
    game.chef.x = 1080;
    game.chef.y = 330;
    game.chef.carrying = { kind: 'item', id: 'tomato-chopped' };
    game.nearStation = kitchen.stations.find((s) => s.kind === 'stove' && s.burner === 0);
  } else if (name === 'serve') {
    game.elapsed = 41;
    game.score = 520;
    game.combo = 3;
    game.bestCombo = 3;
    game.board.tickets = [
      seedTicket('sunny-soup', 0.7),
      seedTicket('forest-stack', 0.5),
    ];
    game.board.served = 4;
    game.plate = { items: ['tomato-cooked', 'onion-cooked'] };
    game.windowPlate = { items: ['tomato-cooked', 'onion-cooked'] };
    game.chef.x = 1060;
    game.chef.y = 560;
    game.chef.carrying = { kind: 'plate', items: ['tomato-cooked', 'onion-cooked'] };
    game.nearStation = kitchen.stations.find((s) => s.kind === 'window');
  }
  game.promptText = promptFor(game.nearStation) || '';
}

// ---- main loop ------------------------------------------------------------

let lastTime = performance.now();

function update(dt) {
  if (game.state !== 'playing') return;
  game.elapsed += dt;
  const remain = game.shiftLength - game.elapsed;
  const sec = Math.ceil(remain);
  if (sec <= 10 && sec !== game.lastTickSecond && sec > 0) {
    game.lastTickSecond = sec;
    sounds.tick();
  }
  if (game.elapsed >= 120 && game.elapsed - dt < 120) {
    sounds.rush();
    addFloater('⚡ RUSH HOUR — orders come faster! ⚡', VIEW_W / 2, 200, '#ff6b6b', 26);
  }
  if (game.elapsed >= game.shiftLength) {
    game.state = 'over';
    sounds.gameOver();
    return;
  }
  const failed = game.board.update(dt, game.elapsed);
  if (failed > 0) {
    game.combo = 0;
    game.score = Math.max(0, game.score - 50 * failed);
    sounds.error();
    addFloater(`Order lost! -${50 * failed}`, VIEW_W / 2, 180, '#ff6b6b', 22);
  }
  game.chef.update(dt, game.keys, kitchen.solids, collideSolids);
  const near = nearestStation(kitchen, game.chef.x, game.chef.y);
  game.nearStation = near ? near.station : null;
  game.promptText = game.nearStation ? promptFor(game.nearStation) : '';
  updateChopping(dt);
  updateStove(dt);
  // Particles and floaters age.
  for (const p of game.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 60 * dt;
  }
  game.particles = game.particles.filter((p) => p.life > 0);
  for (const f of game.floaters) {
    f.life -= dt;
    f.y -= 28 * dt;
  }
  game.floaters = game.floaters.filter((f) => f.life > 0);
}

function render(time) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (game.state === 'title') {
    drawKitchen(ctx, kitchen, game, time);
    drawHUD(ctx, game);
    drawTitle(ctx, time / 1000);
    return;
  }
  drawKitchen(ctx, kitchen, game, time);
  drawChef(ctx, game.chef, time / 1000);
  drawParticles(ctx, game.particles);
  drawFloaters(ctx, game.floaters);
  drawHUD(ctx, game);
  drawPrompt(ctx, game);
  if (game.state === 'over') drawGameOver(ctx, game);
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  render(now);
  requestAnimationFrame(frame);
}

// ---- input ----------------------------------------------------------------

const KEYMAP = {
  arrowup: 'arrowup', arrowdown: 'arrowdown', arrowleft: 'arrowleft', arrowright: 'arrowright',
  w: 'w', a: 'a', s: 's', d: 'd',
};

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (KEYMAP[k]) {
    game.keys.add(KEYMAP[k]);
    e.preventDefault();
  }
  if (k === 'e' && !e.repeat) {
    game.interactHeld = true;
    sounds.ensure();
    interact();
  }
  // Space is a second interact key, so the whole loop is playable one-handed.
  if (k === ' ' && !e.repeat) {
    game.interactHeld = true;
    sounds.ensure();
    interact();
    e.preventDefault();
  }
  if (k === 'enter' && game.state === 'title') {
    sounds.ensure();
    resetShift();
    game.state = 'playing';
  }
  if (k === 'r' && game.state === 'over') {
    resetShift();
    game.state = 'playing';
  }
  if (k === 'm') sounds.muted = !sounds.muted;
});

window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (KEYMAP[k]) game.keys.delete(KEYMAP[k]);
  if (k === 'e' || k === ' ') game.interactHeld = false;
});

canvas.addEventListener('mousedown', (e) => {
  sounds.ensure();
  if (game.state === 'title') {
    resetShift();
    game.state = 'playing';
    return;
  }
  if (game.state === 'over') {
    resetShift();
    game.state = 'playing';
    return;
  }
  // Clicking a station within reach interacts with it (same as E).
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (VIEW_W / rect.width);
  const my = (e.clientY - rect.top) * (VIEW_H / rect.height);
  const near = nearestStation(kitchen, game.chef.x, game.chef.y);
  if (near) {
    const s = near.station;
    if (mx >= s.x - 10 && mx <= s.x + s.w + 10 && my >= s.y - 10 && my <= s.y + s.h + 10) {
      game.interactHeld = true;
      interact();
      game.interactHeld = false;
    }
  }
});

// Debug/test hook: the play-test reads state through window.GAME.
window.GAME = game;
window.GAME_UTILS = { resetShift, applyScene, interact };

// Start: a ?scene= cover/rush/serve stages a mid-game moment;
// anything else starts on the title screen.
const scene = new URLSearchParams(location.search).get('scene');
if (scene === 'cover' || scene === 'rush' || scene === 'serve') {
  applyScene(scene);
} else {
  resetShift();
}
requestAnimationFrame(frame);
