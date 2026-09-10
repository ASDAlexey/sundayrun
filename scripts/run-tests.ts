import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { availableParallelism, totalmem } from 'node:os';

/**
 * Entry point for `bun run test` and `bun run test:coverage`.
 *
 * Two things it does that `ng test` cannot do on its own.
 *
 * 1. Coverage is off unless asked for. Measured on this suite: 7 s without it against 93 s with it,
 *    so the edit loop must not pay for a report nobody reads. CI and the pre-push hook call
 *    `test:coverage`, which turns it back on together with the 100% gate.
 *
 * 2. A coverage run is split across several `ng test` processes. Past ~3 workers the limit is not
 *    the CPU but the one main thread of the process: it remaps every file's coverage out of the
 *    spec bundle back into the source, walks the untouched files and receives each worker's
 *    counters over RPC, all serially — the full run sits at ~175% CPU of the 1600% this machine
 *    has. The Angular unit-test builder takes no `--shard` flag, so the split is configured through
 *    `SPECS_SHARD_INDEX`/`SPECS_SHARD_TOTAL` in vitest-base.config.ts, each process writes
 *    `coverage/shard-<n>`, and scripts/merge-coverage.ts merges them and applies the gate.
 *
 * Overrides, all optional: `SPECS_PROCESSES` (how many `ng test` processes), `SPECS_MAX_WORKERS`
 * (Vitest workers inside one process), `SPECS_POOL` (`threads` or `forks`).
 */
const ANGULAR_CLI = 'node_modules/@angular/cli/bin/ng.js';
// `node`, not `process.execPath`: this script runs under bun, which reports itself as Node 24.3.0,
// and the Angular 22 CLI guard demands 24.15 or newer and exits before it does anything. The `ng`
// shim resolves the same real Node through its shebang, so this is what `ng test` already used.
const NODE = 'node';

// Measured on this suite (16 CPU / 64 GB, coverage on, wall clock including the bundle build).
// The first row is what the split was originally tuned on, at 248 spec files and the `forks` pool:
//
//   processes x workers   1x2   1x3   1x4   1x6   2x6   4x4   6x2   8x2   12x2
//   wall                  83 s  82 s  81 s  82 s  61 s  60 s  50 s  49 s  57 s
//
// Re-measured at 255 files after vitest-base.config.ts moved sharded runs onto `threads`:
//
//   processes x workers   1x2   4x4   6x2   8x1   8x2   8x4   12x2
//   wall (threads)        80 s  50 s  40 s  45 s  40 s  48 s  50 s
//   wall (forks)                      —     52 s  51 s        50 s
//
// What the two tables agree on: processes are the lever and eight is where it flattens. What
// changed is why. On forks the run was main-thread bound and workers inside a process did nothing —
// 2 and 6 landed within a second. On threads the two workers of a process share one heap and one
// instrumentation pass, which is worth ~20%; a third and fourth worker start fighting over that
// heap and give it all back. The floor is not the CPU either way: the whole run averages about
// four of sixteen cores busy.
const CPUS_PER_PROCESS = 2;
const GB_PER_PROCESS = 3;
const MAX_PROCESSES = 8;
// A shard is a whole `ng test`: its own bundle, its own heap, its own report pass at the end. Two of
// those on the 4-CPU GitHub runner took the runner down with them, so small machines run unsplit.
const MIN_SHARD_CPUS = 8;
// Two: on the `threads` pool the pair shares one heap and one instrumentation pass, and a third
// worker starts costing more in contention than it returns (48 s against 40 s at four).
const WORKERS_PER_PROCESS = 2;

const args = process.argv.slice(2);
const isCI = !!process.env['CI'];
const hasCoverageFlag = args.some((arg) => arg === '--coverage' || arg.startsWith('--coverage='));
const withCoverage = hasCoverageFlag || isCI;
const passthrough = args.filter((arg) => arg !== '--coverage');

const cpuCount = availableParallelism();
const memoryGb = totalmem() / 1024 ** 3;

const detectProcesses = (): number => {
  if (!withCoverage) {
    // Nothing to split: without instrumentation the whole suite is a few seconds, and a second
    // bundle build would cost more than it saves.
    return 1;
  }

  if (cpuCount < MIN_SHARD_CPUS) {
    return 1;
  }

  const budget = Math.min(Math.floor(cpuCount / CPUS_PER_PROCESS), Math.floor(memoryGb / GB_PER_PROCESS));

  return Math.max(1, Math.min(MAX_PROCESSES, budget));
};

const processCount = Math.max(1, Number(process.env['SPECS_PROCESSES']) || detectProcesses());
const isSharded = processCount > 1;

/**
 * Runs one `ng test`. `label` is set only when several run side by side, where two processes
 * writing to one terminal would otherwise interleave mid-line.
 */
const runOne = (env: NodeJS.ProcessEnv, label: string | undefined): Promise<number> =>
  new Promise((resolve) => {
    const child = spawn(
      NODE,
      [
        ANGULAR_CLI,
        'test',
        '--watch=false',
        `--coverage=${withCoverage}`,
        // A shard's report is only ever read by merge-coverage.ts, so it writes the machine-readable
        // form and nothing else — the html report of a quarter of the suite is wasted work.
        ...(isSharded ? ['--coverage-reporters=json'] : []),
        ...passthrough,
      ],
      { stdio: label ? ['ignore', 'pipe', 'pipe'] : 'inherit', env },
    );

    if (label) {
      for (const stream of [child.stdout, child.stderr]) {
        let pending = '';

        stream?.setEncoding('utf8');
        stream?.on('data', (chunk: string) => {
          const lines = (pending + chunk).split('\n');

          pending = lines.pop() ?? '';
          process.stdout.write(lines.map((line) => `${label} ${line}\n`).join(''));
        });
        stream?.on('end', () => {
          if (pending) {
            process.stdout.write(`${label} ${pending}\n`);
          }
        });
      }
    }

    // A process killed from the outside writes nothing at all, so without this line the run just
    // ends with exit 1 and a quarter of the suite silently missing from the log and from
    // `coverage/shard-*`.
    child.on('exit', (code, signal) => {
      if (label && (signal || code !== 0)) {
        process.stdout.write(`${label} exited with ${signal ? `signal ${signal}` : `code ${code}`}\n`);
      }

      resolve(signal ? 1 : (code ?? 1));
    });
  });

if (!isSharded) {
  // Whole-suite coverage in one process on a small runner: forks give every worker its own
  // instrumented heap and the 4-CPU GitHub runner OOM-kills one — threads share it, like a shard.
  const sharedHeap = withCoverage && cpuCount < MIN_SHARD_CPUS;
  // One heap for the whole suite tops V8's ~4 GB default ceiling (the runner died at 4.1 GB):
  // lift old space to half the machine's RAM, capped at 8 GB.
  const heapMb = Math.max(4096, Math.min(8192, Math.floor((memoryGb / 2) * 1024)));
  const sharedEnv: NodeJS.ProcessEnv = {
    ...process.env,
    SPECS_POOL: 'threads',
    SPECS_MAX_WORKERS: String(WORKERS_PER_PROCESS),
    NODE_OPTIONS: `${process.env['NODE_OPTIONS'] ? `${process.env['NODE_OPTIONS']} ` : ''}--max-old-space-size=${heapMb}`,
  };
  process.exit(await runOne(sharedHeap ? sharedEnv : process.env, undefined));
}

// Stale directories would be merged into the report as if they were part of this run.
rmSync('coverage', { recursive: true, force: true });

console.info(
  `[test] ${processCount} processes x ${WORKERS_PER_PROCESS} workers, coverage on (${cpuCount} CPU, ${Math.round(memoryGb)} GB)`,
);

const codes = await Promise.all(
  Array.from({ length: processCount }, (_, slot) =>
    runOne(
      {
        ...process.env,
        SPECS_SHARD_INDEX: String(slot + 1),
        SPECS_SHARD_TOTAL: String(processCount),
        SPECS_MAX_WORKERS: process.env['SPECS_MAX_WORKERS'] ?? String(WORKERS_PER_PROCESS),
      },
      `[${slot + 1}/${processCount}]`,
    ),
  ),
);

const failed = codes.find((code) => code !== 0);

if (failed !== undefined) {
  process.exit(failed);
}

// The 100% gate: vitest-base.config.ts drops the thresholds on a sharded run because no single
// shard could ever meet them, so it lives in the merge instead.
process.exit(
  await new Promise<number>((resolve) => {
    spawn('bun', ['scripts/merge-coverage.ts'], { stdio: 'inherit' }).on('exit', (code, signal) => resolve(signal ? 1 : (code ?? 1)));
  }),
);
