import { computed, signal } from '@angular/core';

import { DURATION_HISTORY_MAX_ENTRIES, DURATION_HISTORY_SSR_NOOP_STORAGE } from './duration-history.constant';
import { DurationHistory } from './duration-history.interface';
import { DurationHistoryStorage } from './duration-history.type';

/**
 * One localStorage-backed «how long did the last few of these take» history. Publishing and deleting
 * measure the same click-to-live wait under two different keys, so the behaviour lives here once and
 * the two services stay wrappers around the key they own — the copies used to drift apart.
 */
export function createDurationHistory(storageKey: string): DurationHistory {
  const durations = signal(readStoredDurations(liveStorage().getItem(storageKey), DURATION_HISTORY_MAX_ENTRIES));

  return {
    averageMs: computed(() => {
      const history = durations();

      return history.length === 0 ? null : Math.round(history.reduce((sum, duration) => sum + duration, 0) / history.length);
    }),
    record(durationMs: number): void {
      const history = [...durations(), durationMs].slice(-DURATION_HISTORY_MAX_ENTRIES);

      liveStorage().setItem(storageKey, JSON.stringify(history));
      durations.set(history);
    },
  };
}

/** Resolved per access, not captured once: specs swap the global per scenario, prerender has none. */
function liveStorage(): DurationHistoryStorage {
  return typeof localStorage === 'undefined' ? DURATION_HISTORY_SSR_NOOP_STORAGE : localStorage;
}

/** A hand-edited or truncated stored value degrades to «no history» instead of breaking the page. */
function readStoredDurations(raw: string | null, maxEntries: number): number[] {
  if (raw === null) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed.filter(isPlausibleDuration).slice(-maxEntries);
    }
  } catch {
    // Fall through: broken JSON and a wrong shape degrade the same way.
  }

  return [];
}

function isPlausibleDuration(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
