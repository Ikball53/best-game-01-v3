// Emberfall Saga — best-game-01 entry program (Node 22, standard library only).
//
// What this program does: it takes the finished game in this repository
// (game/ — static files a browser can serve with no network — and the
// screenshots/ the maker captured from the running game) and hands them to
// the grader by copying both folders into the output directory and writing
// the dossier.json summary there with the vendored make.fun library.
//
// Run it locally like this:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Inside the grader MAKEFUN_OUTPUT_DIR is unset, so /output is used.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const gameSrc = join(repoRoot, 'game');
const gameDst = join(outDir, 'game');
const shotsSrc = join(repoRoot, 'screenshots');
const shotsDst = join(outDir, 'screenshots');

mkdirSync(outDir, { recursive: true });
if (!existsSync(gameSrc)) {
  throw new Error('game/ not found beside main.ts: ' + gameSrc);
}
cpSync(gameSrc, gameDst, { recursive: true });
mkdirSync(shotsDst, { recursive: true });
if (existsSync(shotsSrc)) {
  cpSync(shotsSrc, shotsDst, { recursive: true });
}

// The gate's caps (reference/gate.json): the dossier text cap shapes the
// bytes; the other limits refuse anything the scorer would refuse outright
// (too many or too large screenshots, too many game files or bytes, or a
// game path longer than 1000 bytes).
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

writeFileSync(join(outDir, 'dossier.json'), dossier);
