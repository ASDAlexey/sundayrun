import { defineConfig } from 'vitest/config';

// Advanced Vitest options merged by @angular/build:unit-test.
// Istanbul instruments the original TypeScript source (not Angular's compiled
// output), so coverage reflects authored code only — no generated dev-mode
// `ɵsetClassMetadata` guards leaking unreachable branches.
export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
