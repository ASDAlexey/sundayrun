import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

// Advanced Vitest options merged by @angular/build:unit-test.
// Istanbul instruments the original TypeScript source (not Angular's compiled
// output), so coverage reflects authored code only — no generated dev-mode
// `ɵsetClassMetadata` guards leaking unreachable branches.

// The builder takes no --pool/--maxWorkers/--shard flags, so the knobs live here. Every one of them
// is an env override with a working default, which is what lets scripts/run-tests.ts split the run
// across processes without a second config file.
const poolOverride = process.env['SPECS_POOL'];
const maxWorkers = Number(process.env['SPECS_MAX_WORKERS']) || undefined;

// One slice of the suite, set per process by scripts/run-tests.ts. Vitest wants `i/N` with i from 1.
const shardIndex = Number(process.env['SPECS_SHARD_INDEX']) || 0;
const shardTotal = Number(process.env['SPECS_SHARD_TOTAL']) || 0;
const isSharded = shardIndex > 0 && shardTotal > 1;

/**
 * `threads` for a sharded (coverage) run, `forks` for a plain one — and either one overridable.
 *
 * The choice flipped when the run was split across processes. A single process measured 118 s on
 * threads against 93 s on forks, because every worker thread instruments the shared chunks inside
 * one V8 heap; the note that used to stand here recorded that. Split eight ways, the same heap is
 * what pays off — each process instruments its chunks once for both of its workers instead of once
 * per worker — and the whole run comes to ~41 s on threads against ~51 s on forks (16 CPU / 64 GB,
 * 255 spec files, best of three each). Two workers per process is where that stops: four measured
 * 48–50 s on threads, back at the forks number.
 *
 * A plain run has one process and one instrumentation-free pass, so it keeps the pool that was
 * measured faster for exactly that shape — 6.1 s against 6.6 s, which is noise, and no reason to
 * make one config line mean two things.
 */
const pool = poolOverride === 'threads' || poolOverride === 'forks' ? poolOverride : isSharded ? 'threads' : 'forks';

// Each slice writes its own report, which scripts/merge-coverage.ts then merges and gates. A
// single-process run keeps the plain directory the builder would have used.
const coverageDir = isSharded ? `./coverage/shard-${shardIndex}` : './coverage/parkrun';

// The 100% gate belongs to the whole suite: a slice sees a fraction of it and could never reach
// 100%, so sharded runs report without thresholds and merge-coverage.ts applies them once.
const thresholds = { statements: 100, branches: 100, functions: 100, lines: 100 };

export default defineConfig({
  test: {
    pool,
    ...(maxWorkers ? { maxWorkers } : {}),
    ...(isSharded ? { shard: `${shardIndex}/${shardTotal}` } : {}),
    // Билдер сам выбирает happy-dom, раз он установлен. В отличие от jsdom он реально ходит
    // в сеть за src иностранных iframe: спека протокола показывает PDF по внешнему url, и без
    // этого прогон упирается в DNS и сыплет NetworkError в лог.
    environmentOptions: {
      happyDOM: {
        settings: {
          navigation: { disableChildFrameNavigation: true },
        },
      },
    },
    coverage: {
      // istanbul, not v8: the 100% gate is calibrated against istanbul's branch counting, and it
      // instruments the original TypeScript source rather than Angular's compiled output.
      // It is reached through `custom` only to trim the per-file RPC payload that the builder's
      // `isolate: false` default inflates — scripts/coverage-provider.mjs delegates everything else
      // to @vitest/coverage-istanbul, so `provider.name` in the report still reads `istanbul`.
      provider: 'custom',
      customProviderModule: fileURLToPath(new URL('./scripts/coverage-provider.mjs', import.meta.url)),
      reportsDirectory: coverageDir,
      // The AOT signal-query transform leaves a dead source mapping on the `viewChild`
      // locator argument, which istanbul misreads as one uncovered statement/function
      // that no test can ever hit. Vitest 4 checks the global threshold over ALL files
      // (glob-threshold entries no longer exempt them), so the file sits outside the
      // instrumented pool; its spec still runs and everything authored is exercised.
      exclude: [
        // Loaded inside the worker, so without this the provider instruments itself into its own
        // report and drags the 100% gate down.
        '**/scripts/**',
        '**/src/app/features/athlete/progress-chart.ts',
        '**/src/app/features/athlete/badge-catalog/badge-catalog.ts',
        '**/src/app/features/home/home-page.ts',
      ],
      ...(isSharded ? {} : { thresholds }),
    },
  },
});
