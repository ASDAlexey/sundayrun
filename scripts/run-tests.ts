import { spawn, type ChildProcess } from 'node:child_process';
import { rmSync } from 'node:fs';
import { availableParallelism, freemem, totalmem } from 'node:os';

/**
 * Entry point for `bun run test` and `bun run test:coverage`.
 *
 * Two things it does that `ng test` cannot do on its own.
 *
 * 1. Coverage is off unless asked for. Measured on this suite: 7 s without it against 93 s with it,
 *    so the edit loop must not pay for a report nobody reads. CI and the pre-push hook call
 *    `test:coverage`, which turns it back on together with the 100% gate.
 *
 * 2. A coverage run is split across several `ng test` processes — side by side on a big machine, one
 *    after another where the memory is not there for two. Past ~3 workers the limit is not
 *    the CPU but the one main thread of the process: it remaps every file's coverage out of the
 *    spec bundle back into the source, walks the untouched files and receives each worker's
 *    counters over RPC, all serially — the full run sits at ~175% CPU of the 1600% this machine
 *    has. The Angular unit-test builder takes no `--shard` flag, so the split is configured through
 *    `SPECS_SHARD_INDEX`/`SPECS_SHARD_TOTAL` in vitest-base.config.ts, each process writes
 *    `coverage/shard-<n>`, and scripts/merge-coverage.ts merges them and applies the gate.
 *
 * Overrides, all optional: `SPECS_PROCESSES` (how many `ng test` processes), `SPECS_PARALLEL` (how
 * many of them at a time), `SPECS_MAX_WORKERS` (Vitest workers inside one process), `SPECS_POOL`
 * (`threads` or `forks`).
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
// those side by side took the 4-CPU GitHub runner down with them — below this many CPUs the shards
// still happen, one at a time.
const MIN_SHARD_CPUS = 8;
// What a small machine splits the suite into. The whole suite in one process is what the 16 GB
// runner kept dying of: 255 spec files instrumented into one heap topped V8's 4 GB ceiling, and
// lifting the ceiling only moved the death to the machine, which took the process tree with it.
// A quarter of the files is ~2 GB live, and one shard at a time means only ever one of those plus
// its own report pass — the merge at the end is what sees the whole suite.
const SMALL_MACHINE_SHARDS = 4;
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

// GitHub renders ANSI in the log without giving the step a TTY, so colour is on unless NO_COLOR asks
// otherwise: a run that dies from the outside must not look like one more grey line among 250 green ones.
const paint = (text: string): string => (process.env['NO_COLOR'] ? text : `\x1b[1;31m${text}\x1b[0m`);

// The reading taken when the run dies is worthless on its own: the OS frees what it killed before
// anyone gets to look, so an out-of-memory death reports a nearly empty machine. The low-water mark
// is what tells one apart from a cancelled job.
const freeGb = (): number => freemem() / 1024 ** 3;

let lowestFreeGb = freeGb();

setInterval(() => {
  lowestFreeGb = Math.min(lowestFreeGb, freeGb());
}, 1000).unref();

const memoryNow = (): string => `${freeGb().toFixed(1)} GB free of ${Math.round(memoryGb)} GB, low-water ${lowestFreeGb.toFixed(1)} GB`;

const reportFailure = (headline: string, details: string[]): void => {
  console.error(paint(`\nERROR: ${headline}`));

  for (const detail of details) {
    console.error(paint(`       ${detail}`));
  }

  console.error('');
};

const detectProcesses = (): number => {
  if (!withCoverage) {
    // Nothing to split: without instrumentation the whole suite is a few seconds, and a second
    // bundle build would cost more than it saves.
    return 1;
  }

  if (cpuCount < MIN_SHARD_CPUS) {
    return SMALL_MACHINE_SHARDS;
  }

  const budget = Math.min(Math.floor(cpuCount / CPUS_PER_PROCESS), Math.floor(memoryGb / GB_PER_PROCESS));

  return Math.max(1, Math.min(MAX_PROCESSES, budget));
};

const processCount = Math.max(1, Number(process.env['SPECS_PROCESSES']) || detectProcesses());
const isSharded = processCount > 1;
// How many shards are allowed to run at once. A machine that has the CPUs for the split has the
// memory for it too; the small runner gets the same split spread over time instead.
const parallelism = Math.max(
  1,
  Math.min(processCount, Number(process.env['SPECS_PARALLEL']) || (cpuCount < MIN_SHARD_CPUS ? 1 : processCount)),
);

const spread = parallelism > 1 ? `x ${parallelism} at a time` : 'one at a time';

const shape = (): string => `${isSharded ? `${processCount} shards ${spread}, ` : ''}${WORKERS_PER_PROCESS} workers, ${cpuCount} CPU`;

const children = new Set<ChildProcess>();

let terminating = false;

// Bun's own epitaph for a killed run is `terminated by signal SIGTERM (Polite quit request)`, which
// names neither the sender nor the reason; the free-memory reading is what tells cancel from OOM.
const onSignal = (signal: NodeJS.Signals): void => {
  if (terminating) {
    return;
  }

  terminating = true;

  reportFailure(`the test run was terminated by ${signal} from the outside — every test that had run was still green`, [
    signal === 'SIGINT'
      ? 'Interrupted from the keyboard.'
      : 'Nobody inside the run sends this: the CI job was cancelled, hit a timeout, or the machine ran out of memory and took the process tree with it.',
    `Memory right now: ${memoryNow()}. This run: ${shape()}.`,
    'A low-water mark near zero means it was the memory — split the suite further in scripts/run-tests.ts.',
  ]);

  for (const child of children) {
    child.kill(signal);
  }

  process.exit(signal === 'SIGINT' ? 130 : 143);
};

process.on('SIGTERM', () => onSignal('SIGTERM'));
process.on('SIGINT', () => onSignal('SIGINT'));

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

    children.add(child);

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
      children.delete(child);

      if (label && (signal || code !== 0)) {
        process.stdout.write(`${label} exited with ${signal ? `signal ${signal}` : `code ${code}`}\n`);
      }

      if (signal && !terminating) {
        reportFailure(`${label ? `shard ${label}` : 'the test run'} was killed by ${signal} — no test failed, the process was taken down`, [
          signal === 'SIGKILL'
            ? 'The OS out-of-memory killer is the usual sender of this one.'
            : 'Something outside the suite sent it — a cancelled CI job, a timeout, or the OS under memory pressure.',
          `Memory right now: ${memoryNow()}. This run: ${shape()}.`,
        ]);
      }

      resolve(signal ? 1 : (code ?? 1));
    });
  });

if (withCoverage) {
  console.info(`[test] ${shape()}, ${Math.round(memoryGb)} GB RAM, coverage on`);
}

if (!isSharded) {
  process.exit(await runOne(process.env, undefined));
}

// Stale directories would be merged into the report as if they were part of this run.
rmSync('coverage', { recursive: true, force: true });

const shardEnv = (slot: number): NodeJS.ProcessEnv => ({
  ...process.env,
  SPECS_SHARD_INDEX: String(slot + 1),
  SPECS_SHARD_TOTAL: String(processCount),
  SPECS_MAX_WORKERS: process.env['SPECS_MAX_WORKERS'] ?? String(WORKERS_PER_PROCESS),
});

const codes = new Array<number>(processCount).fill(1);

let nextSlot = 0;

// One lane per shard allowed to run at once. Sequential lanes need no label — nothing else is
// writing to the terminal — so the shard announces itself and then prints as `ng test` always does.
const lane = async (): Promise<void> => {
  for (let slot = nextSlot++; slot < processCount; slot = nextSlot++) {
    if (parallelism === 1) {
      console.info(`[test] shard ${slot + 1}/${processCount}`);
    }

    codes[slot] = await runOne(shardEnv(slot), parallelism > 1 ? `[${slot + 1}/${processCount}]` : undefined);
  }
};

await Promise.all(Array.from({ length: parallelism }, () => lane()));

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
