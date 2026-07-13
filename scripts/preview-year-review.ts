/**
 * Smoke test: runs the production year-review query against the local data/sundayrun.db through a
 * bun:sqlite executor and prints «Итоги года». Run: bun scripts/preview-year-review.ts [year]
 */
import { Database } from 'bun:sqlite';

import { createProtocolDrizzle } from '../src/app/core/sqlite/protocol-drizzle';
import { ProtocolDbValue } from '../src/app/core/sqlite/protocol-db-value.type';
import { selectFirstEventDateByYear, selectYearReview } from '../src/app/github/protocol-db-queries';

const db = new Database('data/sundayrun.db', { readonly: true });
const ddb = createProtocolDrizzle({
  queryValues: (sql, params) => Promise.resolve(db.prepare(sql).values(...(params as never[])) as ProtocolDbValue[][]),
});

const years = Object.keys(await selectFirstEventDateByYear(ddb)).sort((a, b) => b.localeCompare(a));
const year = process.argv[2] ?? years[0];
const review = await selectYearReview(ddb, year);

console.log(`Годы в архиве: ${years.join(', ')}`);
console.log(`\n=== Итоги ${review.year} ===`);
console.log(
  `забегов ${review.eventCount}, финишей ${review.finishCount}, участников ${review.finisherCount}, ` +
    `новичков ${review.newcomerCount}, ЛР ${review.personalRecordCount}`,
);
console.log(`медианы: М ${review.medianTimeMenMs}, Ж ${review.medianTimeWomenMs}`);
console.log('\nЛучшие М:');

for (const best of review.bestMen) {
  console.log(`  ${best.displayName} ${best.timeMs} (${best.slug})`);
}

console.log('\nЛучшие Ж:');

for (const best of review.bestWomen) {
  console.log(`  ${best.displayName} ${best.timeMs} (${best.slug})`);
}

console.log('\nСамые активные:');

for (const active of review.mostActive) {
  console.log(`  ${active.displayName} — ${active.finishCount}`);
}

console.log('\nБейджи:');

for (const group of review.badgeHolders) {
  console.log(`  ${group.badge}: ${group.holders.map((holder) => holder.displayName).join(', ')}`);
}

db.close();
