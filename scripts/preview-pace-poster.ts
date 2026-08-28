/**
 * Smoke test: builds the saveable pace-plan poster for a 22:00 target and writes it as an SVG, so
 * the layout can be looked at without clicking through the site. Rasterising is the browser's job
 * and is not reproduced here — this checks the drawing, which is the part with the geometry in it.
 *
 * Run: bun scripts/preview-pace-poster.ts [out.svg]
 */
import { writeFileSync } from 'node:fs';

import '@angular/localize/init';

import { formatDuration } from '../src/app/core/time/duration';
import { planFromFinish } from '../src/app/core/pace/pace-plan';
import { PACE_PLAN_POINTS } from '../src/app/features/home/pace-plan/pace-plan.constant';
import { buildPlanPoster } from '../src/app/features/home/pace-plan/plan-poster';

const TARGET_MS = 22 * 60 * 1000;

const OUT = process.argv[2] ?? 'pace-poster.svg';

const plan = planFromFinish(TARGET_MS);

if (!plan) {
  throw new Error('planFromFinish rejected a target it should accept');
}

// The light theme's map tokens, copied from src/styles/_tokens.scss. In the app these are read off
// the live page; here there is no page to read.
const svg = buildPlanPoster({
  title: 'РАСКЛАДКА НА 5 КМ',
  finishText: formatDuration(plan.finishMs),
  paceText: `${formatDuration(plan.paceMs)} / км`,
  rows: PACE_PLAN_POINTS.map((point, index) => ({ ...point, time: formatDuration(plan.splits[index].ms) })),
  splits: new Map(plan.splits.map((split) => [split.meters, formatDuration(split.ms)])),
  footer: 'Воскресный забег · ПКиО им. Горького · 5 км',
  palette: {
    paper: '#fbfaf6',
    ink: '#1a1a1a',
    inkSoft: '#71736f',
    route: '#e8730a',
    routeCasing: '#b8560a',
    mark: '#d0342c',
    accent: '#1f5fd0',
    border: '#e3e1da',
  },
});

writeFileSync(OUT, svg);
console.log(`${OUT}: ${plan.splits.length} splits, ${svg.length} bytes`);
