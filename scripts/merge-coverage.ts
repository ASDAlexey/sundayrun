import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import libCoverage from 'istanbul-lib-coverage';
import libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';

/**
 * Merges the per-shard istanbul reports written by `scripts/run-tests.ts` and applies the 100%
 * gate to the merged result. A shard sees a quarter of the suite and could never reach 100% on its
 * own, so `vitest-base.config.ts` drops the thresholds as soon as `SPECS_SHARD_TOTAL` is set and
 * the gate moves here — this script is the only thing that fails a sharded run on coverage.
 *
 * Why this is not a plain `coverageMap.merge()` over every shard: istanbul merges two entries of
 * the same file by matching statement/function/branch *locations* and keeps every location it
 * cannot match on the other side (`mergeProp` in istanbul-lib-coverage/lib/file-coverage.js). That
 * is only correct when both entries describe the file the same way, and under the Angular
 * unit-test builder they often do not — a file a shard executed is instrumented inside the spec
 * bundle and remapped back to the source through the bundle's source map, while the same file in a
 * shard whose tests never touched it goes through the separate "uncovered files" pass
 * (`?vitest-uncovered-coverage=true`), which instruments the source directly. The two produce
 * different location maps, and a naive merge unions them: the denominators inflate and the
 * percentages drop for reasons nobody can act on.
 *
 * So the entries of a file are grouped by the shape of their maps. The shape that carries
 * execution data wins and defines the denominator; entries of that shape are summed directly
 * (identical maps, so it is exact), and hits recorded under a different shape are projected onto it
 * by location. The result matches a single-process run file for file.
 */
type FileEntry = libCoverage.FileCoverageData;

const METRICS = ['statements', 'branches', 'functions', 'lines'] as const;
const THRESHOLD = 100;
const COVERAGE_DIR = path.resolve('coverage');
const MERGED_DIR = path.join(COVERAGE_DIR, 'parkrun');

const readShards = (): { name: string; data: Record<string, FileEntry> }[] => {
  let names: string[];

  try {
    names = readdirSync(COVERAGE_DIR)
      .filter((name) => name.startsWith('shard-'))
      .sort();
  } catch {
    throw new Error(`Coverage directory not found: ${COVERAGE_DIR}`);
  }

  const shards: { name: string; data: Record<string, FileEntry> }[] = [];

  for (const name of names) {
    const file = path.join(COVERAGE_DIR, name, 'coverage-final.json');

    if (!existsSync(file)) {
      throw new Error(`${file} not found — the shard did not finish, or the \`json\` coverage reporter is off`);
    }

    shards.push({ name, data: JSON.parse(readFileSync(file, 'utf8')) as Record<string, FileEntry> });
  }

  if (shards.length === 0) {
    throw new Error(`No shard-* directories in ${COVERAGE_DIR}`);
  }

  return shards;
};

/** Identity of the *shape* of a file entry: same maps means the same instrumentation of the same source. */
const shapeOf = (entry: FileEntry): string =>
  createHash('sha1')
    .update(JSON.stringify([entry.statementMap, Object.values(entry.fnMap).map(functionIdentityOf), entry.branchMap]))
    .digest('hex');

const sumHits = (entry: FileEntry): number => {
  let hits = 0;

  for (const value of Object.values(entry.s ?? {})) {
    hits += value;
  }

  for (const value of Object.values(entry.f ?? {})) {
    hits += value;
  }

  for (const counters of Object.values(entry.b ?? {})) {
    for (const value of counters) {
      hits += value;
    }
  }

  return hits;
};

type ShapeGroup = { hits: number; entries: FileEntry[] };

const groupByFileAndShape = (shards: { data: Record<string, FileEntry> }[]): Map<string, Map<string, ShapeGroup>> => {
  const files = new Map<string, Map<string, ShapeGroup>>();

  for (const shard of shards) {
    for (const [file, entry] of Object.entries(shard.data)) {
      const shapes = files.get(file) ?? new Map<string, ShapeGroup>();
      const shape = shapeOf(entry);
      const group = shapes.get(shape) ?? { hits: 0, entries: [] };

      group.hits += sumHits(entry);
      group.entries.push(entry);
      shapes.set(shape, group);
      files.set(file, shapes);
    }
  }

  return files;
};

/**
 * Identity of one statement / function / branch inside a file. Everything that describes the item
 * goes in, not just its `loc` — after the remap out of the spec bundle a file can hold several
 * distinct branches reported at the same source position (three nested `??` on one line is enough),
 * and istanbul's own merge keys branches by `loc` alone and collapses them. That is why the union
 * below is written out here instead of leaving it to `coverageMap.addFileCoverage`.
 */
const identityOf = (item: unknown): string => JSON.stringify(item);

/**
 * Identity of one function — everything about it except the name it was reported under.
 *
 * The name is the one part of an fnMap entry that depends on the shard rather than on the source.
 * An unnamed function is `(anonymous_N)` with `N` counted over everything *that shard*
 * instrumented, and a named one collides with same-named functions elsewhere in the bundle and
 * comes back as `text`, `text2`, `toBestView2` — again per shard. Left in the identity, one
 * function looks like as many functions as there are shards, all but one of them with zero hits:
 * the 61 functions of `protocol-state.service.ts` were counted as 341, and the suite's function
 * coverage read 65% against a denominator twice the real one. Position is identity enough — two
 * functions cannot be declared at the same place in one file. Statements and branches carry no
 * name, which is why only the functions metric fell through the floor.
 */
const functionIdentityOf = ({ name: _name, ...item }: { name?: string }): string => identityOf(item);

/**
 * Unions entries that carry execution data into the map a single-process run would have produced.
 *
 * They all come from the same instrumentation family — the file compiled into the spec bundle and
 * remapped back to the source — and differ only in how much of the file the shard happened to load,
 * so an item present in several of them is the same item and its counters add up.
 */
const unionEntries = (entries: FileEntry[]): FileEntry => {
  const statements = new Map<string, { item: unknown; hits: number }>();
  const functions = new Map<string, { item: unknown; hits: number }>();
  const branches = new Map<string, { item: unknown; hits: number[] }>();

  for (const entry of entries) {
    for (const [key, item] of Object.entries(entry.statementMap)) {
      const identity = identityOf(item);
      const known = statements.get(identity);

      statements.set(identity, { item, hits: (known?.hits ?? 0) + entry.s[key] });
    }

    for (const [key, item] of Object.entries(entry.fnMap)) {
      const identity = functionIdentityOf(item);
      const known = functions.get(identity);

      functions.set(identity, { item, hits: (known?.hits ?? 0) + entry.f[key] });
    }

    for (const [key, item] of Object.entries(entry.branchMap)) {
      const identity = identityOf(item);
      const known = branches.get(identity);
      const hits = known?.hits ?? entry.b[key].map(() => 0);

      branches.set(identity, { item, hits: hits.map((value, index) => value + entry.b[key][index]) });
    }
  }

  const indexed = <T>(items: Iterable<{ item: unknown; hits: T }>): [Record<string, never>, Record<string, T>] => {
    const map: Record<string, never> = {};
    const counters: Record<string, T> = {};
    let index = 0;

    for (const { item, hits } of items) {
      map[index] = item as never;
      counters[index] = hits;
      index += 1;
    }

    return [map, counters];
  };

  const [statementMap, s] = indexed(statements.values());
  const [fnMap, f] = indexed(functions.values());
  const [branchMap, b] = indexed(branches.values());

  return { path: entries[0].path, statementMap, fnMap, branchMap, s, f, b };
};

const shards = readShards();
const map = libCoverage.createCoverageMap({});
const files = groupByFileAndShape(shards);

let unionised = 0;

for (const [file, shapes] of files) {
  const groups = [...shapes.values()];
  const executed = groups.filter((group) => group.hits > 0);

  if (executed.length === 0) {
    // Nothing anywhere ran this file, so every shape is the untouched-files pass over the same
    // source. Take the richest map so the denominator stays the full one.
    const richest = groups.reduce((best, group) =>
      Object.keys(group.entries[0].statementMap).length > Object.keys(best.entries[0].statementMap).length ? group : best,
    );

    map.addFileCoverage({ ...unionEntries(richest.entries), path: file });
    continue;
  }

  if (executed.length > 1) {
    unionised += 1;
  }

  // Zero-hit shapes are the untouched-files pass, which instruments the source directly and
  // describes the same code differently. Unioning those in is what inflates the denominators, so
  // they are dropped whenever anything actually ran the file.
  map.addFileCoverage({ ...unionEntries(executed.flatMap((group) => group.entries)), path: file });
}

mkdirSync(MERGED_DIR, { recursive: true });

const context = libReport.createContext({ dir: MERGED_DIR, coverageMap: map });

reports.create('html').execute(context);
reports.create('json').execute(context);

const summary = map.getCoverageSummary();
const failures: string[] = [];

console.info(`Merged ${files.size} files from ${shards.length} shards (${unionised} loaded differently across shards)`);
console.info('\n=============================== Coverage summary ===============================');

for (const metric of METRICS) {
  const { pct, covered, total } = summary.data[metric];

  console.info(`${(metric.charAt(0).toUpperCase() + metric.slice(1)).padEnd(13)}: ${pct}% ( ${covered}/${total} )`);

  if (pct < THRESHOLD) {
    failures.push(`${metric} ${pct}% < ${THRESHOLD}%`);
  }
}

console.info('================================================================================');

if (failures.length > 0) {
  console.error(`ERROR: coverage thresholds not met: ${failures.join(', ')}`);
  process.exit(1);
}

console.info(`Report written to ${MERGED_DIR}`);
