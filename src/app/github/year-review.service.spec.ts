import { TestBed } from '@angular/core/testing';

import { createMemoryProtocolDb } from '../core/sqlite/spec-utils/protocol-db-memory';
import { EXPECTED_DB_YEAR_REVIEW, EXPECTED_REVIEW_YEARS, REVIEW_YEAR, YEAR_REVIEW_SEED } from './protocol-db-queries.mock';
import { PROTOCOL_DB } from './protocol-db.token';
import { YearReviewService } from './year-review.service';

describe('YearReviewService', () => {
  let close: (() => void) | null = null;

  afterEach(() => {
    close?.();
    close = null;
  });

  it('serves the year list newest first and one year’s full review off sundayrun.db', async () => {
    const memory = await createMemoryProtocolDb(YEAR_REVIEW_SEED);

    close = memory.close;
    TestBed.configureTestingModule({ providers: [{ provide: PROTOCOL_DB, useValue: memory.db }] });

    const service = TestBed.inject(YearReviewService);

    await expect(service.loadYears()).resolves.toEqual(EXPECTED_REVIEW_YEARS);
    await expect(service.loadReview(REVIEW_YEAR)).resolves.toEqual(EXPECTED_DB_YEAR_REVIEW);
  });
});
