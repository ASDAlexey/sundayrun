import { Injectable, inject } from '@angular/core';

import { YearReview } from '../core/history/year-review.interface';
import { createProtocolDrizzle } from '../core/sqlite/protocol-drizzle';
import { selectFirstEventDateByYear, selectYearReview } from './protocol-db-queries';
import { PROTOCOL_DB } from './protocol-db.token';

/** Anonymous reads behind the «Итоги года» page, over the same HTTP-range db as the other pages. */
@Injectable({ providedIn: 'root' })
export class YearReviewService {
  readonly #db = createProtocolDrizzle(inject(PROTOCOL_DB));

  /** Years that held at least one race, newest first — the page's year switcher. */
  async loadYears(): Promise<string[]> {
    const firstDateByYear = await selectFirstEventDateByYear(this.#db);

    return Object.keys(firstDateByYear).sort((left, right) => right.localeCompare(left));
  }

  /** The full review of one year: totals, medians, bests, most active and badge holders. */
  loadReview(year: string): Promise<YearReview> {
    return selectYearReview(this.#db, year);
  }
}
