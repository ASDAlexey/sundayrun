import { Injectable, inject } from '@angular/core';

import { createQueryCache } from '../core/cache/query-cache';
import { YearReview } from '../core/history/year-review.interface';
import { createProtocolDrizzle } from '../core/sqlite/protocol-drizzle';
import { selectFirstEventDateByYear, selectYearReview } from './protocol-db-queries';
import { PROTOCOL_DB } from './protocol-db.token';

/** Anonymous reads behind the «Итоги года» page, over the same HTTP-range db as the other pages. */
@Injectable({ providedIn: 'root' })
export class YearReviewService {
  readonly #db = createProtocolDrizzle(inject(PROTOCOL_DB));
  // Session memo: a soft-navigated review carries no baked value and would re-run its selects.
  readonly #cache = createQueryCache();

  /** Years that held at least one race, newest first — the page's year switcher. */
  loadYears(): Promise<string[]> {
    return this.#cache('years', async () => {
      const firstDateByYear = await selectFirstEventDateByYear(this.#db);

      return Object.keys(firstDateByYear).sort((left, right) => right.localeCompare(left));
    });
  }

  /** The full review of one year: totals, medians, bests, most active and badge holders. */
  loadReview(year: string): Promise<YearReview> {
    return this.#cache(`review:${year}`, () => selectYearReview(this.#db, year));
  }
}
