// Moonlit Dock Heist — the entry program (Node 22, standard library only).
// It hands the game in: copies game/ and screenshots/ from beside this file
// into the output directory and writes /output/dossier.json with the vendored
// make.fun library, exactly as the kit's starter does. The output directory
// itself is never removed — only its entries are, because the grader's
// /output is a bind mount and removing it fails. Both runs write the same
// bytes: the copies are plain files and the dossier is deterministic.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail fast with a clear error instead of handing in a broken entry.
if (!existsSync(join(here, 'game', 'index.html'))) {
  throw new Error('game/index.html is missing: the game cannot be handed in');
}
if (!existsSync(join(here, 'screenshots'))) {
  throw new Error('screenshots/ is missing: the entry needs 3 or 4 screenshots');
}

// Create the output directory if it is missing, then empty only its entries.
mkdirSync(out, { recursive: true });
for (const entry of readdirSync(out)) {
  rmSync(join(out, entry), { recursive: true, force: true });
}

cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of
// game files in all, or a path under game/ over 1000 bytes: game/ counts
// beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
