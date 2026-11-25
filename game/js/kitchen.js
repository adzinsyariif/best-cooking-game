// kitchen.js — the floor plan of Ember & Thyme's kitchen.
// The canvas is 1280x720. The top 108 px are the order board (HUD, not floor).
// Counters run along the walls; the middle is open floor the chef walks on.
// A station is a rectangle with a kind and, for crates, an ingredient.
// The chef collides with every counter rect; interaction reaches a little
// past the counter's edge so the prompt feels generous.

import { INGREDIENT_ORDER } from './recipes.js';

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HUD_H = 108;

const COUNTER_H = 64;
const CRATE_W = 96;

function crateStations() {
  // Six ingredient crates along the top wall, under the order board.
  const total = INGREDIENT_ORDER.length * CRATE_W;
  const x0 = (VIEW_W - total) / 2;
  return INGREDIENT_ORDER.map((ing, i) => ({
    kind: 'crate',
    ingredient: ing,
    x: x0 + i * CRATE_W,
    y: HUD_H + 8,
    w: CRATE_W - 6,
    h: COUNTER_H,
    label: ing,
  }));
}

export function buildKitchen() {
  const stations = [
    ...crateStations(),
    // Chopping board, left wall.
    { kind: 'board', x: 16, y: 300, w: 110, h: 120, label: 'board' },
    // Stove with two burners, right wall.
    { kind: 'stove', burner: 0, x: VIEW_W - 126, y: 260, w: 110, h: 100, label: 'stove' },
    { kind: 'stove', burner: 1, x: VIEW_W - 126, y: 380, w: 110, h: 100, label: 'stove' },
    // Plating counter, bottom centre — plates live here.
    { kind: 'plates', x: 480, y: VIEW_H - 92, w: 320, h: 76, label: 'plates' },
    // Serving window, bottom right.
    { kind: 'window', x: 1010, y: VIEW_H - 92, w: 250, h: 76, label: 'window' },
    // Trash bin, bottom left.
    { kind: 'trash', x: 20, y: VIEW_H - 92, w: 110, h: 76, label: 'trash' },
    // Decorative sink, top-left corner (no interaction, adds kitchen read).
    { kind: 'sink', x: 16, y: HUD_H + 8, w: 130, h: COUNTER_H, label: 'sink' },
    // Decorative spice shelf, top-right corner.
    { kind: 'shelf', x: VIEW_W - 146, y: HUD_H + 8, w: 130, h: COUNTER_H, label: 'shelf' },
  ];
  // Everything the chef bumps into: all stations plus the room's edge.
  const solids = stations.map((s) => ({ x: s.x, y: s.y, w: s.w, h: s.h }));
  return { stations, solids };
}

export function stationByKind(kitchen, kind) {
  return kitchen.stations.filter((s) => s.kind === kind);
}

// Nearest station whose edge is within reach of the chef's centre.
export function nearestStation(kitchen, px, py, reach = 78) {
  let best = null;
  let bestD = Infinity;
  for (const s of kitchen.stations) {
    const cx = Math.max(s.x, Math.min(px, s.x + s.w));
    const cy = Math.max(s.y, Math.min(py, s.y + s.h));
    const d = Math.hypot(px - cx, py - cy);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return bestD <= reach ? { station: best, dist: bestD } : null;
}

// Push a moving circle out of solid rectangles (axis-separated, simple and stable).
export function collideSolids(solids, p, r) {
  for (const s of solids) {
    const nx = Math.max(s.x, Math.min(p.x, s.x + s.w));
    const ny = Math.max(s.y, Math.min(p.y, s.y + s.h));
    const dx = p.x - nx;
    const dy = p.y - ny;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r && d2 > 0.0001) {
      const d = Math.sqrt(d2);
      p.x = nx + (dx / d) * r;
      p.y = ny + (dy / d) * r;
    } else if (d2 <= 0.0001) {
      // Centre inside the rect: push out along the smallest overlap.
      const left = p.x - s.x;
      const right = s.x + s.w - p.x;
      const top = p.y - s.y;
      const bottom = s.y + s.h - p.y;
      const m = Math.min(left, right, top, bottom);
      if (m === left) p.x = s.x - r;
      else if (m === right) p.x = s.x + s.w + r;
      else if (m === top) p.y = s.y - r;
      else p.y = s.y + s.h + r;
    }
  }
  // Room bounds (floor area below the HUD).
  p.x = Math.max(24, Math.min(VIEW_W - 24, p.x));
  p.y = Math.max(HUD_H + 24, Math.min(VIEW_H - 24, p.y));
}
