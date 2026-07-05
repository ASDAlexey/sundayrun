import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { GithubAuthError } from '../core/github/github-errors';
import { HTTP_NOT_FOUND } from '../core/github/github-api.constant';
import { VALID_HISTORY, VALID_HISTORY_TEXT } from '../core/github/history-file.mock';
import { statusResponse } from '../core/github/spec-utils/github-fetch-router';
import { ADMIN_TOKEN_MOCK } from './admin-token.service.mock';
import { AdminTokenService } from './admin-token.service';
import { HistoryService } from './history.service';
import { EXPECTED_ATHLETES_URL, EXPECTED_HISTORY_INIT } from './history.service.mock';

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

  it('loads athletes.json through the authorized Contents API and treats a missing file as an empty history', async () => {
    fetchMock.mockResolvedValueOnce(new Response(VALID_HISTORY_TEXT));

    await expect(service.loadHistory()).resolves.toEqual(VALID_HISTORY);
    expect(fetchMock).toHaveBeenCalledWith(EXPECTED_ATHLETES_URL, EXPECTED_HISTORY_INIT);

    fetchMock.mockResolvedValueOnce(statusResponse(HTTP_NOT_FOUND));

    await expect(service.loadHistory(), 'athletes.json not published yet').resolves.toEqual({});
  });

  it('rejects with GithubAuthError without touching the network when the token is missing', async () => {
    token.set(null);

    await expect(service.loadHistory()).rejects.toBeInstanceOf(GithubAuthError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
