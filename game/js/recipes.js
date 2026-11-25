// recipes.js — the ingredients and dishes of Ember & Thyme.
// Every dish is a set of prepared items; an item is an ingredient in a state:
//   raw -> chopped (at the board) -> cooked (on the stove). Bread goes raw -> cooked.
// Cheese is served as-is: no chopping, no cooking, straight onto the plate.

export const INGREDIENTS = {
  tomato:   { name: 'Tomato',   color: '#e5484d', dark: '#b02e33', chop: true,  cook: true,  cookTime: 4.0 },
  onion:    { name: 'Onion',    color: '#c9a0dc', dark: '#8e6bb0', chop: true,  cook: true,  cookTime: 4.0 },
  pepper:   { name: 'Pepper',   color: '#3fae5a', dark: '#2a7d3f', chop: true,  cook: true,  cookTime: 4.0 },
  mushroom: { name: 'Mushroom', color: '#d8c49a', dark: '#a98f62', chop: true,  cook: true,  cookTime: 5.0 },
  bread:    { name: 'Bread',    color: '#e0a458', dark: '#b57e35', chop: false, cook: true,  cookTime: 3.0 },
  cheese:   { name: 'Cheese',   color: '#f2c94c', dark: '#d9a91f', chop: false, cook: false, cookTime: 0 },
};

export const INGREDIENT_ORDER = ['tomato', 'onion', 'pepper', 'mushroom', 'bread', 'cheese'];

// A prepared item id looks like "tomato-chopped", "bread-cooked" or "cheese".
export function itemId(ingredient, state) {
  return state === 'raw' ? ingredient : `${ingredient}-${state}`;
}

export function itemLabel(id) {
  const [ing, state] = id.split('-');
  const base = INGREDIENTS[ing].name;
  if (!state) return base;
  return state === 'chopped' ? `Chopped ${base}` : `Grilled ${base}`;
}

export const RECIPES = [
  {
    id: 'garden-salad',
    name: 'Garden Salad',
    items: ['tomato-chopped', 'onion-chopped', 'pepper-chopped'],
    base: 120,
    blurb: 'Crisp, fresh, no stove needed.',
  },
  {
    id: 'sunny-soup',
    name: 'Sunny Soup',
    items: ['tomato-cooked', 'onion-cooked'],
    base: 140,
    blurb: 'Slow-simmered sunshine in a bowl.',
  },
  {
    id: 'ember-skillet',
    name: 'Ember Skillet',
    items: ['mushroom-cooked', 'pepper-cooked', 'bread-cooked'],
    base: 180,
    blurb: 'Smoky, sizzling, straight off the pan.',
  },
  {
    id: 'forest-stack',
    name: 'Forest Stack',
    items: ['mushroom-chopped', 'onion-chopped', 'cheese'],
    base: 150,
    blurb: 'Earthy mushrooms, sharp cheese.',
  },
  {
    id: 'cheesy-melt',
    name: 'Cheesy Melt',
    items: ['bread-cooked', 'cheese', 'tomato-chopped'],
    base: 160,
    blurb: 'Toasted bread, molten cheese.',
  },
];

// Two multisets match when they hold the same items in the same counts.
export function sameMultiset(a, b) {
  if (a.length !== b.length) return false;
  const count = new Map();
  for (const x of a) count.set(x, (count.get(x) || 0) + 1);
  for (const x of b) {
    const n = count.get(x) || 0;
    if (n === 0) return false;
    count.set(x, n - 1);
  }
  return true;
}

export function recipeForPlate(plateItems) {
  return RECIPES.find((r) => sameMultiset(r.items, plateItems)) || null;
}

export function pickRecipe(random) {
  return RECIPES[Math.floor(random() * RECIPES.length)];
}
