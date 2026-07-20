import { Injectable, computed, signal } from '@angular/core';

import {
  PUBLISH_DURATIONS_MAX_ENTRIES,
  PUBLISH_DURATIONS_STORAGE_KEY,
  PUBLISH_DURATION_SSR_NOOP_STORAGE,
} from './publish-duration.constant';
import { PublishDurationStorage } from './publish-duration.type';

/**
 * Remembers how long recent publications took from the «Опубликовать» click to the deploy landing
 * on the site, so the waiting hints can promise a measured average instead of a hardcoded
 * «~2–3 минуты». localStorage-backed: the history belongs to the organiser's device.
 */
@Injectable({ providedIn: 'root' })
export class PublishDurationService {
  readonly #durations = signal<number[]>(readStored(this.#storage.getItem(PUBLISH_DURATIONS_STORAGE_KEY)));

  /** The mean of the recorded durations; null until the first publication is measured. */
  readonly averageMs = computed(() => {
    const durations = this.#durations();

    return durations.length === 0 ? null : Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length);
  });

  record(durationMs: number): void {
    const durations = [...this.#durations(), durationMs].slice(-PUBLISH_DURATIONS_MAX_ENTRIES);

    this.#storage.setItem(PUBLISH_DURATIONS_STORAGE_KEY, JSON.stringify(durations));
    this.#durations.set(durations);
  }

  /** Live localStorage access, so specs can stub the global per scenario; absent during prerender. */
  get #storage(): PublishDurationStorage {
    return typeof localStorage === 'undefined' ? PUBLISH_DURATION_SSR_NOOP_STORAGE : localStorage;
  }
}

/** A hand-edited or truncated value degrades to «no history» instead of breaking the page. */
function readStored(raw: string | null): number[] {
  if (raw === null) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed.filter(isPlausibleDuration).slice(-PUBLISH_DURATIONS_MAX_ENTRIES);
    }
  } catch {
    // Fall through: broken JSON and a wrong shape degrade the same way.
  }

  return [];
}

function isPlausibleDuration(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
