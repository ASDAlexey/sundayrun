import { WritableSignal, signal } from '@angular/core';
import { Mock, vi } from 'vitest';

import { pinnedProtocolDbPath } from '../core/github/protocol-db-path';
import { DbFreshness, DbFreshnessType } from './db-freshness.enum';
import { DB_BASE_URI_MOCK } from './protocol-db.service.mock';

/** A plausible pinned data commit — the probe only runs for full 40-char hex shas. */
export const DB_FRESHNESS_SHA_MOCK = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

/** The commit a mid-session publication pins, superseding the first sha's poll. */
export const DB_FRESHNESS_NEXT_SHA_MOCK = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

/** Mirrors the probe target: the sha-named db copy resolved against the deploy base href. */
export function pinnedDbProbeUrl(sha: string): string {
  return new URL(pinnedProtocolDbPath(sha), DB_BASE_URI_MOCK).href;
}

/** A HEAD answer with the given status; the probe only ever reads `ok`. */
export function probeResponse(status: number): Response {
  return new Response(null, { status });
}

/** The mocked surface: the state signal stays writable so specs can drive the banner. */
interface DbFreshnessServiceMock {
  state: WritableSignal<DbFreshnessType>;
  check: Mock<() => void>;
  pinnedDbAvailable: Mock<(ref: string) => Promise<boolean>>;
}

/** Drop-in `DbFreshnessService`: no probes; the writable state signal drives banner specs. */
export function dbFreshnessServiceMock(state: DbFreshnessType = DbFreshness.Fresh): DbFreshnessServiceMock {
  return {
    state: signal(state),
    check: vi.fn(),
    pinnedDbAvailable: vi.fn<(ref: string) => Promise<boolean>>().mockResolvedValue(true),
  };
}
