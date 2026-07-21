import { DOCUMENT, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { PROTOCOLS_REPO_BRANCH, VERSION_JSON_PATH } from '../core/github/protocols-repo.constant';
import { DbSource } from '../core/sqlite/db-source.enum';
import { SERVER_PLATFORM_ID } from '../features/spec-utils/platform.mock';
import { settle } from '../features/spec-utils/settle';
import { CdnRefService } from './cdn-ref.service';
import { CdnRefServiceMock, cdnRefServiceMock } from './cdn-ref.service.mock';
import { DbFreshness } from './db-freshness.enum';
import { DbFreshnessService } from './db-freshness.service';
import {
  DB_FRESHNESS_NEXT_SHA_MOCK,
  DB_FRESHNESS_SHA_MOCK,
  pinnedDbProbeUrl,
  pointerResponse,
  probeResponse,
} from './db-freshness.service.mock';
import { DB_FRESHNESS_POLL_ATTEMPTS, DB_FRESHNESS_POLL_INTERVAL_MS, DB_FRESHNESS_PROBE_OPTIONS } from './db-freshness.service.constant';
import { DOCUMENT_MOCK } from './protocol-db.service.mock';

describe('DbFreshnessService', () => {
  const fetchMock = vi.fn();

  let cdnRef: CdnRefServiceMock;
  let service: DbFreshnessService;

  /** Answers the pinned-db probes per url and the second-opinion pointer read with one response. */
  const respond = (pointer: Error | Response, probes: (url: string) => Error | Response): void => {
    fetchMock.mockImplementation((url: unknown) => {
      const target = String(url);
      const response = target.includes(VERSION_JSON_PATH) ? pointer : probes(target);

      return response instanceof Error ? Promise.reject(response) : Promise.resolve(response.clone());
    });
  };

  /** The probe calls that hit the given sha's pinned db url — the pointer recheck is filtered out. */
  const probeCalls = (sha: string): number => fetchMock.mock.calls.filter(([url]) => String(url) === pinnedDbProbeUrl(sha)).length;

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers();
    cdnRef = cdnRefServiceMock(DB_FRESHNESS_SHA_MOCK);
    TestBed.configureTestingModule({
      providers: [
        { provide: CdnRefService, useValue: cdnRef },
        { provide: DOCUMENT, useValue: DOCUMENT_MOCK },
      ],
    });
    service = TestBed.inject(DbFreshnessService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('reports a served pinned db as fresh, memoizing the probe per ref and re-probing a pinned commit', async () => {
    respond(probeResponse(404), () => probeResponse(200));

    await expect(service.pinnedDbAvailable(DB_FRESHNESS_SHA_MOCK)).resolves.toBe(true);
    await expect(service.pinnedDbAvailable(DB_FRESHNESS_SHA_MOCK), 'the second lookup reuses the probe').resolves.toBe(true);
    expect(probeCalls(DB_FRESHNESS_SHA_MOCK)).toBe(1);
    expect(fetchMock).toHaveBeenCalledWith(pinnedDbProbeUrl(DB_FRESHNESS_SHA_MOCK), DB_FRESHNESS_PROBE_OPTIONS);
    expect(service.state()).toBe(DbFreshness.Fresh);

    await expect(service.pinnedDbAvailable(DB_FRESHNESS_NEXT_SHA_MOCK), 'a pinned commit re-probes').resolves.toBe(true);
    expect(probeCalls(DB_FRESHNESS_NEXT_SHA_MOCK)).toBe(1);
  });

  it('never probes the branch fallback ref — only the plain name exists for it', async () => {
    await expect(service.pinnedDbAvailable(PROTOCOLS_REPO_BRANCH)).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(service.state(), 'the fallback url is the correct data, so no banner').toBe(DbFreshness.Fresh);
  });

  it('treats a probe network failure as unavailable without a banner or poll', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(service.pinnedDbAvailable(DB_FRESHNESS_SHA_MOCK)).resolves.toBe(false);
    expect(service.state()).toBe(DbFreshness.Fresh);

    await vi.advanceTimersByTimeAsync(DB_FRESHNESS_POLL_INTERVAL_MS * 2);
    expect(fetchMock, 'no poll follows a network failure').toHaveBeenCalledTimes(1);
  });

  it('flips to updating on a 404, rides a transient poll failure, and offers the reload once the deploy lands', async () => {
    fetchMock
      .mockResolvedValueOnce(probeResponse(404))
      .mockRejectedValueOnce(new Error('blip'))
      .mockResolvedValueOnce(probeResponse(404))
      .mockResolvedValue(probeResponse(200));

    await expect(service.pinnedDbAvailable(DB_FRESHNESS_SHA_MOCK)).resolves.toBe(false);
    expect(service.state(), 'the deploy is in flight').toBe(DbFreshness.Updating);

    await vi.advanceTimersByTimeAsync(DB_FRESHNESS_POLL_INTERVAL_MS);
    expect(service.state(), 'a failed poll tick keeps waiting').toBe(DbFreshness.Updating);

    await vi.advanceTimersByTimeAsync(DB_FRESHNESS_POLL_INTERVAL_MS);
    expect(service.state(), 'a 404 tick keeps waiting').toBe(DbFreshness.Updating);

    await vi.advanceTimersByTimeAsync(DB_FRESHNESS_POLL_INTERVAL_MS);
    expect(service.state(), 'the sha-named copy appeared').toBe(DbFreshness.Updated);
    expect(cdnRef.noteFreshSha, 'the landed sha is remembered for the reload').toHaveBeenCalledWith(DB_FRESHNESS_SHA_MOCK);
    await expect(service.pinnedDbAvailable(DB_FRESHNESS_SHA_MOCK), 'the memo now serves the landed copy').resolves.toBe(true);

    await vi.advanceTimersByTimeAsync(DB_FRESHNESS_POLL_INTERVAL_MS * 2);
    expect(fetchMock, 'the poll stops once the deploy landed').toHaveBeenCalledTimes(4);
  });

  it('gives up quietly when the deploy never lands within the polling budget', async () => {
    fetchMock.mockResolvedValue(probeResponse(404));

    await expect(service.pinnedDbAvailable(DB_FRESHNESS_SHA_MOCK)).resolves.toBe(false);

    await vi.advanceTimersByTimeAsync(DB_FRESHNESS_POLL_INTERVAL_MS * (DB_FRESHNESS_POLL_ATTEMPTS + 1));
    expect(service.state(), 'the stale promise of fresh data is withdrawn').toBe(DbFreshness.Fresh);
    expect(fetchMock).toHaveBeenCalledTimes(DB_FRESHNESS_POLL_ATTEMPTS + 1);
  });

  it('a mid-poll pin supersedes the stale poll and heals the banner when the new copy is served', async () => {
    // The pointer recheck failing over the network must never break the probe flow either.
    respond(new Error('pointer offline'), (url) =>
      url === pinnedDbProbeUrl(DB_FRESHNESS_SHA_MOCK) ? probeResponse(404) : probeResponse(200),
    );

    await expect(service.pinnedDbAvailable(DB_FRESHNESS_SHA_MOCK)).resolves.toBe(false);
    expect(service.state()).toBe(DbFreshness.Updating);

    await expect(service.pinnedDbAvailable(DB_FRESHNESS_NEXT_SHA_MOCK)).resolves.toBe(true);
    expect(service.state(), 'the served re-pinned copy withdraws the banner').toBe(DbFreshness.Fresh);

    await vi.advanceTimersByTimeAsync(DB_FRESHNESS_POLL_INTERVAL_MS * 2);
    expect(probeCalls(DB_FRESHNESS_SHA_MOCK), 'the superseded poll never probes again').toBe(1);
    expect(service.state()).toBe(DbFreshness.Fresh);
  });

  it('the second opinion catches a stale session ref: banner, poll and the remembered fresh sha', async () => {
    // The session resolved an old pointer whose db is served, but the cache-busted pointer names a
    // newer commit whose deploy is still in flight — exactly the fresh-tab-misses-the-banner hole.
    let nextDbReady = false;

    respond(pointerResponse(DB_FRESHNESS_NEXT_SHA_MOCK), (url) =>
      url === pinnedDbProbeUrl(DB_FRESHNESS_NEXT_SHA_MOCK) ? probeResponse(nextDbReady ? 200 : 404) : probeResponse(200),
    );

    await expect(service.pinnedDbAvailable(DB_FRESHNESS_SHA_MOCK)).resolves.toBe(true);

    await vi.advanceTimersByTimeAsync(0);
    expect(service.state(), 'the newer commit’s deploy is in flight').toBe(DbFreshness.Updating);
    expect(cdnRef.noteFreshSha, 'the reload must resolve the fresh sha directly').toHaveBeenCalledWith(DB_FRESHNESS_NEXT_SHA_MOCK);

    nextDbReady = true;
    await vi.advanceTimersByTimeAsync(DB_FRESHNESS_POLL_INTERVAL_MS);
    expect(service.state(), 'the watched deploy landed').toBe(DbFreshness.Updated);
  });

  it('the second opinion over an already-landed newer commit offers the reload at once', async () => {
    respond(pointerResponse(DB_FRESHNESS_NEXT_SHA_MOCK), () => probeResponse(200));

    await expect(service.pinnedDbAvailable(DB_FRESHNESS_SHA_MOCK)).resolves.toBe(true);

    await vi.advanceTimersByTimeAsync(0);
    expect(service.state(), 'the session reads old data while fresh is served').toBe(DbFreshness.Updated);
    expect(cdnRef.noteFreshSha).toHaveBeenCalledWith(DB_FRESHNESS_NEXT_SHA_MOCK);
  });

  it('a second-opinion probe network failure keeps the quiet fresh state — no banner, no poll', async () => {
    respond(pointerResponse(DB_FRESHNESS_NEXT_SHA_MOCK), (url) =>
      url === pinnedDbProbeUrl(DB_FRESHNESS_NEXT_SHA_MOCK) ? new Error('offline') : probeResponse(200),
    );

    await expect(service.pinnedDbAvailable(DB_FRESHNESS_SHA_MOCK)).resolves.toBe(true);

    await vi.advanceTimersByTimeAsync(DB_FRESHNESS_POLL_INTERVAL_MS * 2);
    expect(service.state(), 'no definite answer — no promise of fresh data').toBe(DbFreshness.Fresh);
    expect(probeCalls(DB_FRESHNESS_NEXT_SHA_MOCK), 'and no poll either').toBe(1);
  });

  it('check() probes the session ref for pages that never query the db', async () => {
    // `settle` waits on a real macrotask, so this test opts out of the suite's fake timers.
    vi.useRealTimers();
    respond(probeResponse(404), () => probeResponse(200));

    service.check();
    await settle();

    expect(probeCalls(DB_FRESHNESS_SHA_MOCK)).toBe(1);
    expect(fetchMock).toHaveBeenCalledWith(pinnedDbProbeUrl(DB_FRESHNESS_SHA_MOCK), DB_FRESHNESS_PROBE_OPTIONS);
  });
});

describe('DbFreshnessService during prerender', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    TestBed.configureTestingModule({
      providers: [
        { provide: CdnRefService, useValue: cdnRefServiceMock(DB_FRESHNESS_SHA_MOCK) },
        { provide: PLATFORM_ID, useValue: SERVER_PLATFORM_ID },
      ],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('check() never probes, keeping the static build clean', async () => {
    TestBed.inject(DbFreshnessService).check();
    await settle();

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('DbFreshnessService reading a local db', () => {
  const fetchMock = vi.fn();
  const originalDbSource = environment.dbSource;

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    environment.dbSource = DbSource.Local;
    TestBed.configureTestingModule({
      providers: [{ provide: CdnRefService, useValue: cdnRefServiceMock(DB_FRESHNESS_SHA_MOCK) }],
    });
  });

  afterEach(() => {
    environment.dbSource = originalDbSource;
    vi.unstubAllGlobals();
  });

  it('check() never probes — the dev server db is always current', async () => {
    TestBed.inject(DbFreshnessService).check();
    await settle();

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
