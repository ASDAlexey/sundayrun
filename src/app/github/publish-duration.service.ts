import { Service } from '@angular/core';

import { createDurationHistory } from './duration-history';
import { PUBLISH_DURATIONS_STORAGE_KEY } from './publish-duration.constant';

/**
 * Remembers how long recent publications took from the «Опубликовать» click to the deploy landing
 * on the site, so the waiting hints can promise a measured average instead of a hardcoded
 * «~2–3 минуты». localStorage-backed: the history belongs to the organiser's device.
 */
@Service()
export class PublishDurationService {
  readonly #history = createDurationHistory(PUBLISH_DURATIONS_STORAGE_KEY);

  /** The mean of the recorded durations; null until the first publication is measured. */
  readonly averageMs = this.#history.averageMs;

  record(durationMs: number): void {
    this.#history.record(durationMs);
  }
}
