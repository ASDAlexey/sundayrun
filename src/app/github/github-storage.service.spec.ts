import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HTTP_UNAUTHORIZED } from '../core/github/github-api.constant';
import { EXPECTED_PDF_URL, PUBLISH_INPUT } from '../core/github/publish-event.mock';
import { statusResponse } from '../core/github/spec-utils/github-fetch-router';
import { AdminTokenService } from './admin-token.service';
import { PublishState } from './github-storage.enum';
import { GithubStorageService } from './github-storage.service';
import {
  CONTENTS_READS_PER_PUBLISH,
  NETWORK_ERROR_MESSAGE,
  STORED_TOKEN_MOCK,
  createPublishSuccessFetch,
} from './github-storage.service.mock';

describe('GithubStorageService', () => {
  const token = signal<string | null>(STORED_TOKEN_MOCK);

  let service: GithubStorageService;

  beforeEach(() => {
    token.set(STORED_TOKEN_MOCK);
    TestBed.configureTestingModule({
      providers: [{ provide: AdminTokenService, useValue: { token } }],
    });
    service = TestBed.inject(GithubStorageService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('publishes through the github core, exposing the publishing state and the sha-pinned pdf url, and resets afterwards', async () => {
    vi.stubGlobal('fetch', createPublishSuccessFetch());

    expect(service.state()).toBe(PublishState.idle);
    expect(service.publishedPdfUrl()).toBeNull();

    const publishing = service.publish(PUBLISH_INPUT);

    expect(service.state()).toBe(PublishState.publishing);

    await publishing;

    expect(service.state()).toBe(PublishState.success);
    expect(service.publishedPdfUrl()).toBe(EXPECTED_PDF_URL);

    service.reset();

    expect(service.state(), 'reset clears the stale state of the previous event').toBe(PublishState.idle);
    expect(service.publishedPdfUrl(), 'reset drops the previous pdf url').toBeNull();
  });

  it('ignores a second publish while one is already in flight', async () => {
    const pendingFetch = vi.fn(() => new Promise<Response>(() => undefined));

    vi.stubGlobal('fetch', pendingFetch);

    void service.publish(PUBLISH_INPUT);
    await service.publish(PUBLISH_INPUT);

    expect(service.state()).toBe(PublishState.publishing);
    expect(pendingFetch, 'the second call starts no second request cycle').toHaveBeenCalledTimes(CONTENTS_READS_PER_PUBLISH);
  });

  it('reports authError without a token or on 401 and error on any other failure', async () => {
    token.set(null);
    await service.publish(PUBLISH_INPUT);

    expect(service.state()).toBe(PublishState.authError);

    token.set(STORED_TOKEN_MOCK);
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(statusResponse(HTTP_UNAUTHORIZED))),
    );
    await service.publish(PUBLISH_INPUT);

    expect(service.state()).toBe(PublishState.authError);

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error(NETWORK_ERROR_MESSAGE))),
    );
    await service.publish(PUBLISH_INPUT);

    expect(service.state()).toBe(PublishState.error);
    expect(service.publishedPdfUrl()).toBeNull();
  });
});
