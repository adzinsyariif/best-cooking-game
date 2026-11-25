// orders.js — the order board: tickets arrive, wait, and leave.
// A ticket is a recipe plus the patience it has left. Serving a matching plate
// pays base + a bonus for patience left, times the combo multiplier.
// Letting a ticket run out breaks the combo and costs points.

import { pickRecipe } from './recipes.js';

export const MAX_TICKETS = 4;

export class OrderBoard {
  constructor() {
    this.tickets = [];
    this.spawnTimer = 6; // first order arrives a few seconds in
    this.served = 0;
    this.failed = 0;
  }

  reset() {
    this.tickets = [];
    this.spawnTimer = 6;
    this.served = 0;
    this.failed = 0;
  }

  // How fast new tickets arrive, and how long they wait, at this point of
  // the shift (elapsed seconds of a 180 s shift). Pressure grows, chores don't.
  static pacing(elapsed) {
    const rush = elapsed >= 120;
    const t = Math.min(1, elapsed / 180);
    return {
      rush,
      spawnEvery: rush ? 11 : 19 - 7 * t,
      patience: rush ? 55 : 78 - 16 * t,
    };
  }

  update(dt, elapsed) {
    const pace = OrderBoard.pacing(elapsed);
    // Spawn a new ticket when the timer lapses and the board has room.
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      if (this.tickets.length < MAX_TICKETS) {
        this.tickets.push({
          recipe: pickRecipe(Math.random),
          patience: pace.patience,
          maxPatience: pace.patience,
          id: Math.random().toString(36).slice(2, 9),
          born: elapsed,
        });
      }
      this.spawnTimer = pace.spawnEvery * (0.85 + Math.random() * 0.3);
    }
    // Patience drains; expired tickets fail.
    let failedNow = 0;
    for (const t of this.tickets) t.patience -= dt;
    this.tickets = this.tickets.filter((t) => {
      if (t.patience <= 0) {
        failedNow++;
        this.failed++;
        return false;
      }
      return true;
    });
    return failedNow;
  }

  // Serve a plate: returns the ticket it matched, or null.
  servePlate(plateItems) {
    const idx = this.tickets.findIndex((t) =>
      t.recipe.items.length === plateItems.length &&
      t.recipe.items.every((item) => plateItems.includes(item)),
    );
    if (idx < 0) return null;
    const [ticket] = this.tickets.splice(idx, 1);
    this.served++;
    return ticket;
  }

  // Points for a served ticket at the current combo (1-based streak).
  static scoreFor(ticket, combo) {
    const patienceBonus = Math.round((ticket.patience / ticket.maxPatience) * 80);
    const mult = 1 + 0.25 * Math.min(combo - 1, 8);
    return Math.round((ticket.recipe.base + patienceBonus) * mult);
  }
}
