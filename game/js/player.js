// player.js — the chef: movement, facing, and the one thing they carry.
// The chef carries at most one thing: a raw ingredient, a chopped ingredient,
// a cooked ingredient, or a whole plate (a plate is itself a carried item
// whose contents are the dish being built).

export class Chef {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 20;
    this.speed = 285;
    this.facing = 1; // 1 = right, -1 = left
    this.carrying = null; // { kind: 'item', id } or { kind: 'plate', items: [] }
    this.moving = false;
    this.walkPhase = 0;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.carrying = null;
    this.moving = false;
    this.walkPhase = 0;
  }

  update(dt, keys, solids, collide) {
    let mx = 0;
    let my = 0;
    if (keys.has('arrowleft') || keys.has('a')) mx -= 1;
    if (keys.has('arrowright') || keys.has('d')) mx += 1;
    if (keys.has('arrowup') || keys.has('w')) my -= 1;
    if (keys.has('arrowdown') || keys.has('s')) my += 1;
    this.moving = mx !== 0 || my !== 0;
    if (this.moving) {
      const len = Math.hypot(mx, my);
      mx /= len;
      my /= len;
      if (mx !== 0) this.facing = mx > 0 ? 1 : -1;
      this.x += mx * this.speed * dt;
      this.y += my * this.speed * dt;
      this.walkPhase += dt * 11;
    }
    collide(solids, this, this.r);
  }

  get handsEmpty() {
    return this.carrying === null;
  }

  get carriedLabel() {
    if (!this.carrying) return '';
    if (this.carrying.kind === 'plate') {
      return this.carrying.items.length === 0 ? 'Empty Plate' : `Plate (${this.carrying.items.length} items)`;
    }
    return this.carrying.id;
  }
}
