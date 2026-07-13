import { vi } from 'vitest';

/**
 * jsdom has no canvas context, so specs mock chart.js away. `progress-chart.ts` caches the
 * resolved Chart class in one bundle-wide `chartClassPromise`, so every spec that renders a
 * chart must mock chart.js to the SAME object — otherwise whichever spec loads a chart first
 * poisons the cache and the others construct a stranger's mock. Hence one shared instance here.
 */
const instance = { destroy: vi.fn(), resetZoom: vi.fn() };

export const chartJsMock = {
  // A `function` (not an arrow) so the chart component's `new Chart(...)` can construct it.
  Chart: Object.assign(
    vi.fn(function chartMock() {
      return instance;
    }),
    { register: vi.fn() },
  ),
  Filler: {},
  LinearScale: {},
  LineController: {},
  LineElement: {},
  PointElement: {},
  Tooltip: {},
};
