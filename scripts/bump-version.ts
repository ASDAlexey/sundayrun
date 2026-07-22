import { writeFileSync } from 'node:fs';

/**
 * Increments the package.json version and prints the new value: `major` zeroes the minor and patch,
 * `minor` zeroes the patch, anything else (or no argument) bumps the patch. CI picks the kind from
 * the commit messages shipped since the previous bump — a `type!:` bang or a `BREAKING CHANGE`
 * footer makes the release a major, a `feat:`/`feat(scope):` commit a minor, otherwise it is a
 * patch — and runs this on a code push to main (never on a data-only publication) before the
 * build; `write-version.ts` then bakes the number into the bundle. The version string is swapped
 * in place so the rest of the file keeps its exact formatting.
 */
const kind = Bun.argv[2] === 'major' || Bun.argv[2] === 'minor' ? Bun.argv[2] : 'patch';
const path = 'package.json';
const text = await Bun.file(path).text();

const match = text.match(/"version":\s*"(\d+)\.(\d+)\.(\d+)"/);

if (match === null) {
  throw new Error('package.json has no semver "version" field to bump');
}

const [needle, major, minor, patch] = match;
const bumped: Record<string, string> = {
  major: `${Number(major) + 1}.0.0`,
  minor: `${major}.${Number(minor) + 1}.0`,
  patch: `${major}.${minor}.${Number(patch) + 1}`,
};
const next = bumped[kind];

writeFileSync(path, text.replace(needle, `"version": "${next}"`));
console.log(next);
