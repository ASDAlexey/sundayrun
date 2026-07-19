import { writeFileSync } from 'node:fs';

/**
 * Increments the package.json patch version and prints the new value. CI runs this on a code push
 * to main (never on a data-only publication) before the build, so every shipped code change carries
 * a fresh version; `write-version.ts` then bakes it into the bundle. The version string is swapped
 * in place so the rest of the file keeps its exact formatting.
 */
const path = 'package.json';
const text = await Bun.file(path).text();

const match = text.match(/"version":\s*"(\d+)\.(\d+)\.(\d+)"/);

if (match === null) {
  throw new Error('package.json has no semver "version" field to bump');
}

const [needle, major, minor, patch] = match;
const next = `${major}.${minor}.${Number(patch) + 1}`;

writeFileSync(path, text.replace(needle, `"version": "${next}"`));
console.log(next);
