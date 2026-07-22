import { writeFileSync } from 'node:fs';

/**
 * Increments the package.json version and prints the new value: `minor` bumps the minor and resets
 * the patch, anything else (or no argument) bumps the patch. CI picks the kind from the commit
 * messages shipped since the previous bump — a `feat:`/`feat(scope):` commit makes the release a
 * minor, otherwise it is a patch — and runs this on a code push to main (never on a data-only
 * publication) before the build; `write-version.ts` then bakes the number into the bundle. The
 * version string is swapped in place so the rest of the file keeps its exact formatting.
 */
const kind = Bun.argv[2] === 'minor' ? 'minor' : 'patch';
const path = 'package.json';
const text = await Bun.file(path).text();

const match = text.match(/"version":\s*"(\d+)\.(\d+)\.(\d+)"/);

if (match === null) {
  throw new Error('package.json has no semver "version" field to bump');
}

const [needle, major, minor, patch] = match;
const next = kind === 'minor' ? `${major}.${Number(minor) + 1}.0` : `${major}.${minor}.${Number(patch) + 1}`;

writeFileSync(path, text.replace(needle, `"version": "${next}"`));
console.log(next);
