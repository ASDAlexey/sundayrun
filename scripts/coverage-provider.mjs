// Coverage provider module: plain @vitest/coverage-istanbul, minus the payload `isolate: false`
// adds. Wired up as `coverage.provider: 'custom'` in vitest-base.config.ts.
//
// istanbul keeps its counters in one `globalThis.__VITEST_COVERAGE__` per worker, keyed by module
// path, and Vitest ships that whole object to the main process after every single test file
// (`takeCoverage()` in @vitest/coverage-istanbul/dist/index.js, sent over RPC by
// `onAfterSuiteRun`). The Angular unit-test builder runs with `isolate: false` by default, so that
// object holds every module the worker has ever loaded: the payload grows with the run and the
// main process spends its time deserialising it instead of the workers spending it running tests.
// Measured here on 248 spec files: 99 s with coverage against 7 s without, at 172% CPU of 1600.
//
// Vitest zeroes every counter before each file (`startCoverage()`, vitest#6935 / vitest#6957), so
// an entry that is all zeros contributed nothing to the file being reported and does not need to
// be sent. Dropping those puts the payload back to the size it has under isolation.
//
// This cannot lose a module. An entry appears in `__VITEST_COVERAGE__` the first time the module
// executes a statement — the instrumenter's `cov_*()` preamble registers it and immediately
// increments a counter — so every module is reported at least once with its full
// statement/function/branch maps, and the merge in the main process unions the entries. Modules no
// test ever loads are handled where they always were, by the uncovered-files pass.
//
// Upstream fixes the same bottleneck differently in Vitest 5 (vitest#10781: write the JSON in the
// worker, pass only the filename over RPC). Delete this module on that upgrade.

import istanbul from '@vitest/coverage-istanbul';

/**
 * Whether the file ran during the test file being reported.
 *
 * Files with no counters at all (a module with nothing executable in it) are kept: they carry no
 * data either way, and keeping them makes this a strict filter on "ran nothing", not on "has
 * nothing".
 *
 * @param {{ s?: Record<string, number>, f?: Record<string, number>, b?: Record<string, number[]> }} fileCoverage
 * @returns {boolean}
 */
function wasExecuted(fileCoverage) {
  let hasCounters = false;

  for (const key in fileCoverage.s) {
    hasCounters = true;

    if (fileCoverage.s[key] > 0) {
      return true;
    }
  }

  for (const key in fileCoverage.f) {
    hasCounters = true;

    if (fileCoverage.f[key] > 0) {
      return true;
    }
  }

  for (const key in fileCoverage.b) {
    for (const hits of fileCoverage.b[key]) {
      hasCounters = true;

      if (hits > 0) {
        return true;
      }
    }
  }

  return !hasCounters;
}

export default {
  startCoverage(options) {
    return istanbul.startCoverage(options);
  },

  takeCoverage(options) {
    const coverage = istanbul.takeCoverage(options);

    if (!coverage) {
      return coverage;
    }

    const executed = {};

    for (const path in coverage) {
      if (wasExecuted(coverage[path])) {
        executed[path] = coverage[path];
      }
    }

    return executed;
  },

  getProvider() {
    return istanbul.getProvider();
  },
};
