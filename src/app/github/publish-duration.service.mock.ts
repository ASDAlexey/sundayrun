import { WritableSignal, signal } from '@angular/core';
import { Mock, vi } from 'vitest';

import { DURATION_HISTORY_AVERAGE_MOCK } from './duration-history.mock';

/** Re-exported under the publish name: waiting-hint specs across features already read it from here. */
export const PUBLISH_DURATION_AVERAGE_MOCK = DURATION_HISTORY_AVERAGE_MOCK;

/** The mocked surface: the writable average drives waiting-hint specs, the spy records. */
interface PublishDurationServiceMock {
  averageMs: WritableSignal<number | null>;
  record: Mock<(durationMs: number) => void>;
}

/** Drop-in `PublishDurationService` — and `DeleteDurationService`, whose surface is identical. */
export function publishDurationServiceMock(averageMs: number | null = null): PublishDurationServiceMock {
  return {
    averageMs: signal(averageMs),
    record: vi.fn(),
  };
}
