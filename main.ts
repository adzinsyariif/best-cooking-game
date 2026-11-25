// main.ts — hands this entry in. Run on Node 22, standard library only.
// It copies this repository's game/ and screenshots/ into the output
// directory (MAKEFUN_OUTPUT_DIR, or /output in the grader) and writes
// /output/dossier.json with the vendored make.fun library, so the dossier
// is exactly what the scorer rebuilds from the same files.
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

// The grader runs this program twice and demands identical bytes, so start
// from a clean output directory every time — stale files must never leak in.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const gameSrc = join(repoRoot, 'game');
const shotsSrc = join(repoRoot, 'screenshots');

// Fail fast with a clear message instead of handing in a half-empty entry:
// the gate refuses an entry with no playable index.html or no screenshots.
if (!existsSync(join(gameSrc, 'index.html'))) {
  throw new Error('game/index.html is missing — nothing playable to hand in');
}
const shotNames = existsSync(shotsSrc)
  ? readdirSync(shotsSrc).filter((n) => !n.startsWith('.'))
  : [];
if (shotNames.length < 3 || shotNames.length > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shotNames.length}`);
}

cpSync(gameSrc, join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(shotsSrc)) {
  cpSync(shotsSrc, join(outDir, 'screenshots'), { recursive: true });
}

// Caps are the gate's own: only text_max_bytes shapes the dossier bytes;
// the rest make this program fail exactly where the scorer would refuse.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

// The dossier is the judge's whole view of the entry: never hand in an empty one.
if (!dossier || dossier.length < 1000) {
  throw new Error('buildDossier returned an unexpectedly short dossier');
}

writeFileSync(join(outDir, 'dossier.json'), dossier);
