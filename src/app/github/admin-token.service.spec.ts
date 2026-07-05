import { TestBed } from '@angular/core/testing';

import { PROTOCOLS_REPO_API_URL } from '../core/github/github-api.constant';
import { jsonResponse } from '../core/github/spec-utils/github-fetch-router';
import { TokenCheck } from '../core/github/token-check.enum';
import { CHECKED_TOKEN, EXPECTED_CHECK_INIT, PUSH_REPO_RESPONSE } from '../core/github/token-check.mock';
import { ADMIN_TOKEN_STORAGE_KEY } from './admin-token.constant';
import { AdminTokenService } from './admin-token.service';
import { ADMIN_TOKEN_MOCK } from './admin-token.service.mock';

describe('AdminTokenService', () => {
  const getItem = vi.fn((): string | null => null);
  const setItem = vi.fn();
  const removeItem = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    getItem.mockReturnValue(null);
    vi.stubGlobal('localStorage', { getItem, setItem, removeItem });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('initializes from localStorage, clears and saves the token, deriving the admin flag', () => {
    getItem.mockReturnValue(ADMIN_TOKEN_MOCK);

    const service = TestBed.inject(AdminTokenService);

    expect(getItem).toHaveBeenCalledWith(ADMIN_TOKEN_STORAGE_KEY);
    expect(service.token()).toBe(ADMIN_TOKEN_MOCK);
    expect(service.isAdmin()).toBe(true);

    service.clear();

    expect(removeItem).toHaveBeenCalledWith(ADMIN_TOKEN_STORAGE_KEY);
    expect(service.token()).toBeNull();
    expect(service.isAdmin()).toBe(false);

    service.save(CHECKED_TOKEN);

    expect(setItem).toHaveBeenCalledWith(ADMIN_TOKEN_STORAGE_KEY, CHECKED_TOKEN);
    expect(service.token()).toBe(CHECKED_TOKEN);
    expect(service.isAdmin()).toBe(true);
  });

  it('starts without a stored token and validate delegates to the github token check', async () => {
    const service = TestBed.inject(AdminTokenService);

    expect(service.token()).toBeNull();
    expect(service.isAdmin()).toBe(false);

    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse(PUSH_REPO_RESPONSE)));

    vi.stubGlobal('fetch', fetchMock);

    await expect(service.validate(CHECKED_TOKEN)).resolves.toBe(TokenCheck.valid);
    expect(fetchMock).toHaveBeenCalledWith(PROTOCOLS_REPO_API_URL, EXPECTED_CHECK_INIT);
  });

  it('falls back to a noop storage during prerender where localStorage is absent', () => {
    vi.stubGlobal('localStorage', undefined);

    const service = TestBed.inject(AdminTokenService);

    expect(service.isAdmin()).toBe(false);

    service.save(CHECKED_TOKEN);

    expect(service.token()).toBe(CHECKED_TOKEN);

    service.clear();

    expect(service.token()).toBeNull();
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
  });
});
