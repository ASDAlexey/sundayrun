import { Service } from '@angular/core';

import { DELETE_DURATIONS_STORAGE_KEY } from './delete-duration.constant';
import { createDurationHistory } from './duration-history';

/**
 * Remembers how long recent deletions took from the «Точно удалить» click to the rebuilt archive
 * dropping the event, so the admin hints can promise a measured average instead of a hardcoded
 * «~2–3 минуты». Same history as `PublishDurationService`, kept under its own key.
 */
@Service()
export class DeleteDurationService {
  readonly #history = createDurationHistory(DELETE_DURATIONS_STORAGE_KEY);

  /** The mean of the recorded durations; null until the first deletion is measured. */
  readonly averageMs = this.#history.averageMs;

  record(durationMs: number): void {
    this.#history.record(durationMs);
  }
}
