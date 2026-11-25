// render.js — everything the eye sees, drawn with Canvas 2D vector shapes.
// No image files: every ingredient, plate, counter and the chef are drawn
// from code, so the game is a few static files and nothing to download.

import { INGREDIENTS } from './recipes.js';
import { VIEW_W, VIEW_H, HUD_H } from './kitchen.js';

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 255) * f)));
  const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 255) * f)));
  const b = Math.min(255, Math.max(0, Math.round((n & 255) * f)));
  return `rgb(${r},${g},${b})`;
}

// ---- food icons -----------------------------------------------------------

export function drawFoodIcon(ctx, id, cx, cy, size) {
  const [ing, state] = id.split('-');
  const def = INGREDIENTS[ing];
  if (!def) return;
  const s = size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  if (state === 'chopped') {
    // A little pile of cut pieces.
    const piece = (dx, dy, rot) => {
      ctx.save();
      ctx.translate(dx * s, dy * s);
      ctx.rotate(rot);
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.arc(-s * 0.12, -s * 0.12, s * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    piece(-0.45, 0.15, 0.3);
    piece(0.35, -0.25, 1.2);
    piece(0.3, 0.45, 2.1);
    piece(-0.15, -0.5, 0.9);
    ctx.restore();
    return;
  }
  const cooked = state === 'cooked';
  const burnt = state === 'burnt';
  const body = burnt ? '#2b2b2b' : cooked ? shade(def.color, 0.82) : def.color;
  const dark = burnt ? '#171717' : def.dark;

  if (ing === 'tomato') {
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, s * 0.08, s * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cooked ? '#7fb069' : '#4e9a3d';
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.5;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * s * 0.35, -s * 0.62 + Math.sin(a) * s * 0.18, s * 0.3, s * 0.14, a, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ing === 'onion') {
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = s * 0.1;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#7fb069';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.85, s * 0.16, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (ing === 'pepper') {
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.1, s * 0.7, s * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.05, s * 0.34, s * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4e9a3d';
    ctx.fillRect(-s * 0.1, -s * 1.05, s * 0.2, s * 0.35);
  } else if (ing === 'mushroom') {
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, -s * 0.1, s * 0.8, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f5ead0';
    ctx.fillRect(-s * 0.22, -s * 0.15, s * 0.44, s * 0.85);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(-s * 0.3, -s * 0.55, s * 0.14, 0, Math.PI * 2);
    ctx.arc(s * 0.28, -s * 0.35, s * 0.11, 0, Math.PI * 2);
    ctx.fill();
  } else if (ing === 'bread') {
    ctx.fillStyle = body;
    roundRect(ctx, -s * 0.9, -s * 0.45, s * 1.8, s * 0.9, s * 0.45);
    ctx.fill();
    ctx.strokeStyle = dark;
    ctx.lineWidth = s * 0.09;
    ctx.beginPath();
    ctx.moveTo(-s * 0.45, -s * 0.35);
    ctx.lineTo(-s * 0.2, s * 0.3);
    ctx.moveTo(0, -s * 0.4);
    ctx.lineTo(s * 0.25, s * 0.28);
    ctx.moveTo(s * 0.45, -s * 0.35);
    ctx.lineTo(s * 0.65, s * 0.2);
    ctx.stroke();
  } else if (ing === 'cheese') {
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-s * 0.85, s * 0.55);
    ctx.lineTo(s * 0.85, s * 0.55);
    ctx.lineTo(s * 0.85, -s * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(-s * 0.25, s * 0.15, s * 0.13, 0, Math.PI * 2);
    ctx.arc(s * 0.35, s * 0.3, s * 0.1, 0, Math.PI * 2);
    ctx.arc(s * 0.1, -s * 0.05, s * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  if (cooked) {
    // Browned edges: a few dark speckles.
    ctx.fillStyle = 'rgba(90,50,10,0.55)';
    ctx.beginPath();
    ctx.arc(-s * 0.4, s * 0.3, s * 0.1, 0, Math.PI * 2);
    ctx.arc(s * 0.35, -s * 0.3, s * 0.12, 0, Math.PI * 2);
    ctx.arc(s * 0.1, s * 0.5, s * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }
  if (!burnt) {
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.arc(-s * 0.3, -s * 0.35, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// A white plate, optionally holding food items arranged on it.
export function drawPlate(ctx, x, y, r, items = []) {
  ctx.fillStyle = '#e8e8e8';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.78, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9c9c9';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.78, 0, Math.PI * 2);
  ctx.stroke();
  const spots = [[-0.3, -0.2], [0.32, -0.25], [0, 0.32]];
  items.forEach((id, i) => {
    const [dx, dy] = spots[i % spots.length];
    drawFoodIcon(ctx, id, x + dx * r, y + dy * r, r * 0.72);
  });
}

// ---- kitchen floor and counters -------------------------------------------

export function drawKitchen(ctx, kitchen, game, time) {
  // Floor: warm checker tiles.
  const tile = 64;
  for (let ty = 0; ty < 11; ty++) {
    for (let tx = 0; tx < 20; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? '#c98f5f' : '#bd8252';
      ctx.fillRect(tx * tile, HUD_H + ty * tile, tile, tile);
    }
  }
  // Wall band under the HUD.
  ctx.fillStyle = '#8e5a3b';
  ctx.fillRect(0, HUD_H, VIEW_W, 10);
  // A worn rug in the middle of the floor, for warmth.
  ctx.fillStyle = '#a34d2d';
  ctx.beginPath();
  ctx.ellipse(VIEW_W / 2, 420, 168, 74, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8b04b';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(VIEW_W / 2, 420, 152, 62, 0, 0, Math.PI * 2);
  ctx.stroke();

  for (const s of kitchen.stations) {
    drawStation(ctx, s, game, time);
  }
}

function drawStation(ctx, s, game, time) {
  const highlight = game.nearStation === s;
  ctx.save();
  if (highlight) {
    ctx.shadowColor = '#ffd166';
    ctx.shadowBlur = 22;
  }
  if (s.kind === 'crate') {
    ctx.fillStyle = '#7a4a2b';
    roundRect(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    ctx.fillStyle = '#9c6b42';
    roundRect(ctx, s.x + 5, s.y + 5, s.w - 10, s.h - 14, 6);
    ctx.fill();
    drawFoodIcon(ctx, s.ingredient, s.x + s.w / 2, s.y + 26, 34);
    ctx.fillStyle = '#fff8ec';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(INGREDIENTS[s.ingredient].name, s.x + s.w / 2, s.y + s.h - 6);
  } else if (s.kind === 'board') {
    ctx.fillStyle = '#5d3a22';
    roundRect(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.fill();
    ctx.fillStyle = '#e8c99a';
    roundRect(ctx, s.x + 10, s.y + 12, s.w - 20, s.h - 24, 8);
    ctx.fill();
    ctx.fillStyle = '#3d2716';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CHOP', s.x + s.w / 2, s.y + 26);
    const item = game.boardState.item;
    if (item) drawFoodIcon(ctx, item, s.x + s.w / 2, s.y + s.h / 2 + 12, 44);
    if (game.boardState.chopProgress > 0 && game.boardState.chopProgress < 1) {
      drawProgressRing(ctx, s.x + s.w / 2, s.y + s.h / 2 + 12, 34, game.boardState.chopProgress, '#e5484d');
    }
  } else if (s.kind === 'stove') {
    ctx.fillStyle = '#3a3a44';
    roundRect(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.fill();
    const bx = s.x + s.w / 2;
    const by = s.y + s.h / 2;
    const burner = game.stove[s.burner];
    const on = burner && burner.item;
    ctx.fillStyle = on ? '#ff7b2f' : '#22222a';
    ctx.beginPath();
    ctx.arc(bx, by, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#55555f';
    ctx.beginPath();
    ctx.arc(bx, by, 22, 0, Math.PI * 2);
    ctx.fill();
    if (burner && burner.item) {
      drawFoodIcon(ctx, burner.item, bx, by, 34);
      const total = INGREDIENTS[burner.item.split('-')[0]].cookTime;
      const p = Math.min(1, burner.progress / total);
      drawProgressRing(ctx, bx, by, 38, p, burner.burnt ? '#222' : '#ffb703');
      if (burner.burnt) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BURNT!', bx, by - 46);
      }
    }
    ctx.fillStyle = '#cfcfd8';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STOVE', s.x + s.w / 2, s.y + 14);
  } else if (s.kind === 'plates') {
    ctx.fillStyle = '#6b4a2f';
    roundRect(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.fill();
    ctx.fillStyle = '#8a6242';
    roundRect(ctx, s.x + 6, s.y + 6, s.w - 12, s.h - 12, 8);
    ctx.fill();
    // Stack of clean plates on the left, the working plate in the middle.
    for (let i = 0; i < 3; i++) drawPlate(ctx, s.x + 34, s.y + s.h / 2 - i * 3, 15);
    if (game.plate) {
      drawPlate(ctx, s.x + s.w / 2 + 30, s.y + s.h / 2, 30, game.plate.items);
      if (game.plate.items.length > 0) {
        ctx.fillStyle = '#fff8ec';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${game.plate.items.length} on plate`, s.x + s.w - 12, s.y + 22);
      }
    }
    ctx.fillStyle = '#fff8ec';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('PLATING', s.x + 70, s.y + 22);
  } else if (s.kind === 'window') {
    ctx.fillStyle = '#2f6b4f';
    roundRect(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    roundRect(ctx, s.x + 8, s.y + 8, s.w - 16, 26, 6);
    ctx.fill();
    ctx.fillStyle = '#3d2716';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ SERVE ★', s.x + s.w / 2, s.y + 27);
    if (game.windowPlate) {
      drawPlate(ctx, s.x + 62, s.y + 50, 17, game.windowPlate.items);
      ctx.fillStyle = '#eaffea';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('READY!', s.x + s.w - 62, s.y + 56);
    } else {
      ctx.fillStyle = '#cfe8d8';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('bring a finished plate', s.x + s.w / 2, s.y + s.h - 8);
    }
  } else if (s.kind === 'trash') {
    ctx.fillStyle = '#4a4a52';
    roundRect(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.fill();
    ctx.fillStyle = '#33333a';
    roundRect(ctx, s.x + 18, s.y + 14, s.w - 36, s.h - 26, 6);
    ctx.fill();
    ctx.fillStyle = '#e8e8e8';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TRASH', s.x + s.w / 2, s.y + s.h - 8);
  } else if (s.kind === 'sink') {
    ctx.fillStyle = '#7a8a99';
    roundRect(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    ctx.fillStyle = '#aeb9c4';
    roundRect(ctx, s.x + 12, s.y + 10, s.w - 24, s.h - 20, 6);
    ctx.fill();
    ctx.fillStyle = '#5a6a78';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SINK', s.x + s.w / 2, s.y + s.h - 6);
  } else if (s.kind === 'shelf') {
    ctx.fillStyle = '#7a4a2b';
    roundRect(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    const cols = ['#e5484d', '#f2c94c', '#3fae5a'];
    cols.forEach((c, i) => {
      ctx.fillStyle = c;
      roundRect(ctx, s.x + 14 + i * 38, s.y + 16, 26, 30, 5);
      ctx.fill();
    });
    ctx.fillStyle = '#fff8ec';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPICES', s.x + s.w / 2, s.y + s.h - 6);
  }
  ctx.restore();
}

function drawProgressRing(ctx, x, y, r, p, color) {
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
  ctx.stroke();
}

// ---- the chef -------------------------------------------------------------

export function drawChef(ctx, chef, time) {
  const bob = chef.moving ? Math.sin(chef.walkPhase) * 2 : Math.sin(time * 2) * 1;
  ctx.save();
  ctx.translate(chef.x, chef.y + bob * 0.4);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body (apron).
  ctx.fillStyle = '#f4f1ea';
  roundRect(ctx, -15, -6, 30, 30, 10);
  ctx.fill();
  ctx.fillStyle = '#e5484d';
  ctx.fillRect(-15, 8, 30, 5);
  // Head.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(0, -14, 12, 0, Math.PI * 2);
  ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-7, -24, 8, 0, Math.PI * 2);
  ctx.arc(0, -27, 9, 0, Math.PI * 2);
  ctx.arc(7, -24, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-12, -26, 24, 6);
  // Eyes look toward facing.
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(chef.facing * 4 - 4, -15, 1.8, 0, Math.PI * 2);
  ctx.arc(chef.facing * 4 + 4, -15, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Carried item floats above the hat.
  if (chef.carrying) {
    const cy = -44;
    if (chef.carrying.kind === 'plate') {
      drawPlate(ctx, 0, cy, 15, chef.carrying.items);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(0, cy, 17, 0, Math.PI * 2);
      ctx.fill();
      drawFoodIcon(ctx, chef.carrying.id, 0, cy, 26);
    }
  }
  ctx.restore();
}

// ---- order board (HUD) ----------------------------------------------------

export function drawHUD(ctx, game) {
  // Board background.
  ctx.fillStyle = '#2b2118';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = '#3a2d20';
  ctx.fillRect(0, HUD_H - 6, VIEW_W, 6);
  // Title + score, left.
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('EMBER & THYME', 18, 30);
  ctx.fillStyle = '#fff8ec';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(`Score ${game.score}`, 18, 56);
  ctx.fillStyle = game.combo > 1 ? '#ff9f1c' : '#b8a88f';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(game.combo > 1 ? `COMBO x${game.combo}` : 'no combo yet', 18, 78);
  ctx.fillStyle = '#b8a88f';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`Served ${game.board.served}  •  Lost ${game.board.failed}`, 18, 98);

  // Order tickets, centre.
  const tw = 168;
  const th = 84;
  const gap = 10;
  const totalW = 4 * tw + 3 * gap;
  const x0 = (VIEW_W - totalW) / 2;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#b8a88f';
  ctx.fillText('ORDER BOARD', x0, 14);
  game.board.tickets.forEach((t, i) => {
    const x = x0 + i * (tw + gap);
    const y = 20;
    const frac = Math.max(0, t.patience / t.maxPatience);
    const urgent = frac < 0.3;
    ctx.fillStyle = urgent ? '#7a2e2e' : '#f7ead2';
    roundRect(ctx, x, y, tw, th, 8);
    ctx.fill();
    ctx.fillStyle = '#2b2118';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(t.recipe.name, x + 10, y + 18);
    // Required items with checkmarks for what the plate already holds.
    t.recipe.items.forEach((item, j) => {
      const ix = x + 16 + j * 34;
      const iy = y + 40;
      const done = game.plate && game.plate.items.includes(item);
      ctx.globalAlpha = done ? 0.35 : 1;
      drawFoodIcon(ctx, item, ix, iy, 26);
      ctx.globalAlpha = 1;
      if (done) {
        ctx.strokeStyle = '#2a9d3f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ix - 7, iy);
        ctx.lineTo(ix - 2, iy + 6);
        ctx.lineTo(ix + 8, iy - 6);
        ctx.stroke();
      }
    });
    // Patience bar.
    ctx.fillStyle = '#d8c9ae';
    roundRect(ctx, x + 10, y + th - 16, tw - 20, 8, 4);
    ctx.fill();
    ctx.fillStyle = urgent ? '#e5484d' : '#3fae5a';
    roundRect(ctx, x + 10, y + th - 16, (tw - 20) * frac, 8, 4);
    ctx.fill();
  });
  for (let i = game.board.tickets.length; i < 4; i++) {
    const x = x0 + i * (tw + gap);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.setLineDash([5, 5]);
    roundRect(ctx, x, 20, tw, th, 8);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('waiting…', x + tw / 2, 20 + th / 2 + 4);
  }

  // Shift timer, right.
  const remain = Math.max(0, game.shiftLength - game.elapsed);
  const mm = Math.floor(remain / 60);
  const ss = Math.floor(remain % 60).toString().padStart(2, '0');
  const rush = game.elapsed >= 120;
  ctx.textAlign = 'right';
  ctx.fillStyle = rush ? '#ff6b6b' : '#fff8ec';
  ctx.font = `bold ${rush ? 30 : 26}px system-ui, sans-serif`;
  ctx.fillText(`${mm}:${ss}`, VIEW_W - 18, 36);
  ctx.fillStyle = '#b8a88f';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(rush ? '⚡ RUSH HOUR ⚡' : 'shift timer', VIEW_W - 18, 58);
  ctx.fillText('WASD move • E interact', VIEW_W - 18, 78);
  ctx.fillText('M mute', VIEW_W - 18, 96);
}

// ---- particles, floating text, prompts ------------------------------------

export function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawFloaters(ctx, floaters) {
  ctx.textAlign = 'center';
  for (const f of floaters) {
    ctx.globalAlpha = Math.max(0, f.life / f.maxLife);
    ctx.fillStyle = f.color;
    ctx.font = `bold ${f.size}px system-ui, sans-serif`;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

export function drawPrompt(ctx, game) {
  if (!game.nearStation || !game.promptText) return;
  const s = game.nearStation;
  const cx = Math.min(Math.max(s.x + s.w / 2, 130), VIEW_W - 130);
  // Below the station, unless that would run off the canvas — then above it.
  const below = s.y + s.h + 26;
  const cy = below > VIEW_H - 12 ? s.y - 16 : below;
  ctx.font = 'bold 15px system-ui, sans-serif';
  const w = ctx.measureText(game.promptText).width + 28;
  ctx.fillStyle = 'rgba(20,14,8,0.85)';
  roundRect(ctx, cx - w / 2, cy - 16, w, 26, 13);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.textAlign = 'center';
  ctx.fillText(game.promptText, cx, cy + 3);
}

// ---- title and game-over screens ------------------------------------------

export function drawTitle(ctx, time) {
  ctx.fillStyle = 'rgba(30,18,10,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const bob = Math.sin(time * 1.6) * 6;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillText('EMBER & THYME', VIEW_W / 2, 210 + bob * 0.3);
  ctx.fillStyle = '#fff8ec';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText('— Rush Hour Kitchen —', VIEW_W / 2, 252);
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillStyle = '#e8dcc4';
  const lines = [
    'You are the only chef on shift. Orders pile up on the board —',
    'grab ingredients, chop them, grill them, plate the dish, serve it hot.',
    '',
    'WASD / arrows — move      E — grab, chop, cook, plate, serve',
    'Click a station — same as E      M — mute',
    '',
    'Chop veg on the board, grill on the stove, build the plate,',
    'serve at the window before patience runs out. Burnt food goes in the trash.',
    'The last minute is RUSH HOUR: orders come faster. Chain serves for combos!',
  ];
  lines.forEach((l, i) => ctx.fillText(l, VIEW_W / 2, 300 + i * 26));
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('Press ENTER or click to start the shift', VIEW_W / 2, 560 + Math.sin(time * 3) * 4);
}

export function drawGameOver(ctx, game) {
  ctx.fillStyle = 'rgba(30,18,10,0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.fillText('SHIFT OVER!', VIEW_W / 2, 200);
  ctx.fillStyle = '#fff8ec';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText(`Final score: ${game.score}`, VIEW_W / 2, 260);
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillStyle = '#e8dcc4';
  ctx.fillText(`Dishes served: ${game.board.served}    •    Orders lost: ${game.board.failed}`, VIEW_W / 2, 300);
  ctx.fillText(`Best combo: x${game.bestCombo}`, VIEW_W / 2, 332);
  const verdict =
    game.score >= 1500 ? 'A kitchen legend is born. The regulars will talk about this shift for weeks.'
      : game.score >= 900 ? 'A solid shift — the pass stayed hot and the plates kept flying.'
      : game.score >= 400 ? 'The kitchen survived. Barely. The lunch rush forgives no one.'
      : 'Rough shift, chef. The orders won this time — come back hungrier.';
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText(verdict, VIEW_W / 2, 380);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('Press R to cook again', VIEW_W / 2, 450);
}
