// CUTGLASS — Steal the Prism. Read the Patrols. (Node 22, standard library only)
//
// This program is the entrypoint the grader runs. It takes this repository's
// game/ folder — plain static files a desktop browser loads offline, no
// library and no network request — and its screenshots/, copies both into the
// output directory, and writes /output/dossier.json with the vendored
// make.fun library, the summary the judge reads.
//
// Serve the game locally first to play it: `node serve.ts` is not part of
// this entry; any static server over game/ works, for example
// `python3 -m http.server 8080 --directory game` and then
// http://localhost:8080. Outside the grader's container, MAKEFUN_OUTPUT_DIR
// stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The directory this file lives in, and where the grader wants the entry.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy the game and its screenshots whole; nothing here is generated, so two
// runs of this program over the same repository produce identical output.
// The dossier is built from the copied tree, never from the repository
// directly, so what the judge reads is exactly what was handed in.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps the scorer itself enforces: only the text cap shapes the dossier's
// bytes; the rest refuse an entry the scorer would refuse anyway (more than
// four screenshots, one over 256 KiB, a game/ over 993 files or 48 MiB, or a
// path under game/ over 1000 bytes). game/ shares /output's own 1000-entry
// cap with screenshots/ and dossier.json, so leave it room.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
