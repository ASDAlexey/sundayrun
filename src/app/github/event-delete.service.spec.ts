import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DELETE_SLUG } from '../core/github/delete-event.mock';
import { HTTP_UNAUTHORIZED } from '../core/github/github-api.constant';
import { statusResponse } from '../core/github/spec-utils/github-fetch-router';
import { resetFakeSqlite3 } from '../core/sqlite/spec-utils/fake-sqlite3';
import { AdminTokenService } from './admin-token.service';
import { EventDeleteService } from './event-delete.service';
import { EVENT_DELETE_NETWORK_ERROR_MESSAGE, EVENT_DELETE_STORED_TOKEN, createEventDeleteFetch } from './event-delete.service.mock';
import { PublishState } from './github-storage.enum';

vi.mock('@sqlite.org/sqlite-wasm', async () => {
  const fake = await import('../core/sqlite/spec-utils/fake-sqlite3');

  return { default: () => Promise.resolve(fake.FAKE_SQLITE3) };
});

describe('EventDeleteService', () => {
  const token = signal<string | null>(EVENT_DELETE_STORED_TOKEN);

  let service: EventDeleteService;

  beforeEach(() => {
    resetFakeSqlite3();
    token.set(EVENT_DELETE_STORED_TOKEN);
    TestBed.configureTestingModule({
      providers: [{ provide: AdminTokenService, useValue: { token } }],
    });
    service = TestBed.inject(EventDeleteService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('deletes through the github core, exposing the flow state, and ignores a second delete in flight', async () => {
    const fetchMock = createEventDeleteFetch();

    vi.stubGlobal('fetch', fetchMock);

    expect(service.state()).toBe(PublishState.idle);

    const deleting = service.delete(DELETE_SLUG);

    expect(service.state()).toBe(PublishState.publishing);

    await service.delete(DELETE_SLUG);

    expect(service.state(), 'the second call starts no second commit cycle').toBe(PublishState.publishing);

    await deleting;

    expect(service.state()).toBe(PublishState.success);
  });

  it('reports authError without a token or on 401 and error on any other failure', async () => {
    token.set(null);
    await service.delete(DELETE_SLUG);

    expect(service.state()).toBe(PublishState.authError);

    token.set(EVENT_DELETE_STORED_TOKEN);
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(statusResponse(HTTP_UNAUTHORIZED))),
    );
    await service.delete(DELETE_SLUG);

    expect(service.state()).toBe(PublishState.authError);

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error(EVENT_DELETE_NETWORK_ERROR_MESSAGE))),
    );
    await service.delete(DELETE_SLUG);

    expect(service.state()).toBe(PublishState.error);
  });
});
