import { Injectable, computed, signal } from '@angular/core';

import { DELETE_DURATIONS_STORAGE_KEY } from './delete-duration.constant';
import { readStoredDurations } from './duration-history';
import { PUBLISH_DURATIONS_MAX_ENTRIES, PUBLISH_DURATION_SSR_NOOP_STORAGE } from './publish-duration.constant';
import { PublishDurationStorage } from './publish-duration.type';

/**
 * Remembers how long recent deletions took from the «Точно удалить» click to the rebuilt archive
 * dropping the event, so the admin hints can promise a measured average instead of a hardcoded
 * «~2–3 минуты». localStorage-backed, mirroring `PublishDurationService`.
 */
@Injectable({ providedIn: 'root' })
export class DeleteDurationService {
  readonly #durations = signal<number[]>(
    readStoredDurations(this.#storage.getItem(DELETE_DURATIONS_STORAGE_KEY), PUBLISH_DURATIONS_MAX_ENTRIES),
  );

  /** The mean of the recorded durations; null until the first deletion is measured. */
  readonly averageMs = computed(() => {
    const durations = this.#durations();

    return durations.length === 0 ? null : Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length);
  });

  record(durationMs: number): void {
    const durations = [...this.#durations(), durationMs].slice(-PUBLISH_DURATIONS_MAX_ENTRIES);

    this.#storage.setItem(DELETE_DURATIONS_STORAGE_KEY, JSON.stringify(durations));
    this.#durations.set(durations);
  }

  /** Live localStorage access, so specs can stub the global per scenario; absent during prerender. */
  get #storage(): PublishDurationStorage {
    return typeof localStorage === 'undefined' ? PUBLISH_DURATION_SSR_NOOP_STORAGE : localStorage;
  }
}
