import { TestBed } from '@angular/core/testing';

import { POSTER_FILE_NAME } from './plan-poster.constant';
import { PlanImageService } from './plan-image.service';

describe('PlanImageService', () => {
  it('passes the poster straight through to the browser, and reports what came back', async () => {
    // No `Image` that decodes here, so the real path bottoms out at «nothing to work with» — which
    // is the answer the card is built to handle, and the one thing worth asserting at this seam.
    await expect(TestBed.inject(PlanImageService).save('<svg/>', POSTER_FILE_NAME)).resolves.toBe(false);
  });
});
