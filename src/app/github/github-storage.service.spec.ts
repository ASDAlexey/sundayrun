import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HTTP_UNAUTHORIZED } from '../core/github/github-api.constant';
import { PUBLISH_INPUT } from '../core/github/publish-event.mock';
import { statusResponse } from '../core/github/spec-utils/github-fetch-router';
import { AdminTokenService } from './admin-token.service';
import { DbFreshnessService } from './db-freshness.service';
import { dbFreshnessServiceMock } from './db-freshness.service.mock';
import { PublishState } from './github-storage.enum';
import { GithubStorageService } from './github-storage.service';
import {
  CONTENTS_READS_PER_PUBLISH,
  NETWORK_ERROR_MESSAGE,
  STORED_TOKEN_MOCK,
  createPublishSuccessFetch,
} from './github-storage.service.mock';
import { resetFakeSqlite3 } from '../core/sqlite/spec-utils/fake-sqlite3';

vi.mock('@sqlite.org/sqlite-wasm', async () => {
  const fake = await import('../core/sqlite/spec-utils/fake-sqlite3');

  return { default: () => Promise.resolve(fake.FAKE_SQLITE3) };
});

describe('GithubStorageService', () => {
  const token = signal<string | null>(STORED_TOKEN_MOCK);
  const dbFreshness = dbFreshnessServiceMock();

  let service: GithubStorageService;

  beforeEach(() => {
    resetFakeSqlite3();
    token.set(STORED_TOKEN_MOCK);
    dbFreshness.check.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: AdminTokenService, useValue: { token } },
        { provide: DbFreshnessService, useValue: dbFreshness },
      ],
    });
    service = TestBed.inject(GithubStorageService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('publishes through the github core, exposing the publishing state, and resets afterwards', async () => {
    vi.stubGlobal('fetch', createPublishSuccessFetch());

    expect(service.state()).toBe(PublishState.idle);

    await service.publish([]);

    expect(service.state(), 'an empty batch is a no-op').toBe(PublishState.idle);

    const publishing = service.publish([PUBLISH_INPUT]);

    expect(service.state()).toBe(PublishState.publishing);

    await publishing;

    expect(service.state()).toBe(PublishState.success);
    expect(dbFreshness.check, 'a success re-checks freshness so the shell banner tracks the deploy').toHaveBeenCalledTimes(1);

    service.reset();

    expect(service.state(), 'reset clears the stale state of the previous event').toBe(PublishState.idle);
  });

  it('ignores a second publish while one is already in flight', async () => {
    const pendingFetch = vi.fn(() => new Promise<Response>(() => undefined));

    vi.stubGlobal('fetch', pendingFetch);

    void service.publish([PUBLISH_INPUT]);
    await service.publish([PUBLISH_INPUT]);

    expect(service.state()).toBe(PublishState.publishing);
    expect(pendingFetch, 'the second call starts no second request cycle').toHaveBeenCalledTimes(CONTENTS_READS_PER_PUBLISH);
  });

  it('reports authError without a token or on 401 and error on any other failure', async () => {
    token.set(null);
    await service.publish([PUBLISH_INPUT]);

    expect(service.state()).toBe(PublishState.authError);

    token.set(STORED_TOKEN_MOCK);
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(statusResponse(HTTP_UNAUTHORIZED))),
    );
    await service.publish([PUBLISH_INPUT]);

    expect(service.state()).toBe(PublishState.authError);

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error(NETWORK_ERROR_MESSAGE))),
    );
    await service.publish([PUBLISH_INPUT]);

    expect(service.state()).toBe(PublishState.error);
  });
});
