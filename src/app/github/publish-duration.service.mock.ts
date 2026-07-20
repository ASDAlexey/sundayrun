import { WritableSignal, signal } from '@angular/core';
import { Mock, vi } from 'vitest';

/** Recorded click-to-live timings driving the average: 2:00 and 3:00 → 2:30. */
export const PUBLISH_DURATIONS_MOCK = [120_000, 180_000];

export const PUBLISH_DURATION_AVERAGE_MOCK = 150_000;

/** A pre-existing stored history entry the service must survive alongside garbage. */
export const PUBLISH_DURATIONS_STORED_RAW = JSON.stringify([120_000, 'garbage', -5, 180_000]);

export const PUBLISH_DURATIONS_MALFORMED_RAW = '{not json';

/** The mocked surface: the writable average drives waiting-hint specs, the spy records. */
interface PublishDurationServiceMock {
  averageMs: WritableSignal<number | null>;
  record: Mock<(durationMs: number) => void>;
}

/** Drop-in `PublishDurationService`: no storage; the writable average drives the hints. */
export function publishDurationServiceMock(averageMs: number | null = null): PublishDurationServiceMock {
  return {
    averageMs: signal(averageMs),
    record: vi.fn(),
  };
}
