import { $ } from 'bun';
import { copyFileSync } from 'node:fs';

/**
 * Serves a production build the way GitHub Pages does, so a local preview matches the deploy.
 * Mirrors the CI "Bundle sha-named db copy" step: the app resolves the published `version.json`
 * sha from jsDelivr and probes `data/sundayrun-<sha>.db` to tell whether the fresh db has landed —
 * a plain `bun run build` never writes that sha-named copy, so the probe 404s and the shell shows
 * the "results are updating" banner forever. Copying it here (using the local `data/version.json`
 * sha, which equals the published one on a clean checkout) makes the probe succeed and the banner
 * stay hidden, exactly as on the live site.
 */
const OUTPUT_DIR = 'dist/parkrun/browser';
const PORT = 8081;

const { sha } = (await Bun.file('data/version.json').json()) as { sha: string };

await $`bun run build`;

copyFileSync(`${OUTPUT_DIR}/data/sundayrun.db`, `${OUTPUT_DIR}/data/sundayrun-${sha}.db`);
console.log(`Bundled sha-named db copy: sundayrun-${sha}.db`);

await $`npx http-server ${OUTPUT_DIR} -p ${PORT} -c-1`;
