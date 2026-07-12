import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HTTP_NOT_FOUND } from '../core/github/github-api.constant';
import { GithubAuthError } from '../core/github/github-errors';
import { statusResponse } from '../core/github/spec-utils/github-fetch-router';
import { exportMemoryProtocolDbBytes } from '../core/sqlite/spec-utils/protocol-db-memory';
import { ADMIN_TOKEN_MOCK } from './admin-token.service.mock';
import { AdminTokenService } from './admin-token.service';
import { HistoryService } from './history.service';
import { EXPECTED_DB_URL, EXPECTED_HISTORY, EXPECTED_HISTORY_INIT, HISTORY_DB_SEED } from './history.service.mock';

vi.mock('@sqlite.org/sqlite-wasm', async () => {
  const real = await import('../core/sqlite/spec-utils/real-sqlite3');

  return { default: () => real.realSqlite3Init() };
});

describe('HistoryService', () => {
  const token = signal<string | null>(ADMIN_TOKEN_MOCK);
  const fetchMock = vi.fn();

  let service: HistoryService;

  beforeEach(() => {
    fetchMock.mockReset();
    token.set(ADMIN_TOKEN_MOCK);
    vi.stubGlobal('fetch', fetchMock);
    TestBed.configureTestingModule({ providers: [{ provide: AdminTokenService, useValue: { token } }] });
    service = TestBed.inject(HistoryService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('downloads protocol.db through the authorized Contents API and reassembles the history, treating a missing db as empty', async () => {
    const dbBytes = await exportMemoryProtocolDbBytes(HISTORY_DB_SEED);

    fetchMock.mockResolvedValueOnce(new Response(dbBytes.slice().buffer));

    await expect(service.loadHistory()).resolves.toEqual(EXPECTED_HISTORY);
    expect(fetchMock).toHaveBeenCalledWith(EXPECTED_DB_URL, EXPECTED_HISTORY_INIT);

    fetchMock.mockResolvedValueOnce(statusResponse(HTTP_NOT_FOUND));

    await expect(service.loadHistory(), 'protocol.db not published yet').resolves.toEqual({});
  });

  it('rejects with GithubAuthError without touching the network when the token is missing', async () => {
    token.set(null);

    await expect(service.loadHistory()).rejects.toBeInstanceOf(GithubAuthError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
