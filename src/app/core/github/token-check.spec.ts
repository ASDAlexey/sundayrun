import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED, PROTOCOLS_REPO_API_URL } from './github-api.constant';
import { jsonResponse, statusResponse } from './spec-utils/github-fetch-router';
import { checkGithubToken } from './token-check';
import { TokenCheck } from './token-check.enum';
import {
  CHECKED_TOKEN,
  EXPECTED_CHECK_INIT,
  NO_PERMISSIONS_REPO_RESPONSE,
  PUSH_REPO_RESPONSE,
  READ_ONLY_REPO_RESPONSE,
  SERVER_ERROR_STATUS,
} from './token-check.mock';

describe('checkGithubToken', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps push permission to valid, a read-only/permission-less OK and 401/403 to unauthorized, the rest to error', async () => {
    const pushable = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(jsonResponse(PUSH_REPO_RESPONSE)));
    const readOnly = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(jsonResponse(READ_ONLY_REPO_RESPONSE)));
    const noPermissions = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(jsonResponse(NO_PERMISSIONS_REPO_RESPONSE)));
    const unauthorized = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(statusResponse(HTTP_UNAUTHORIZED)));
    const forbidden = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(statusResponse(HTTP_FORBIDDEN)));
    const failing = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(statusResponse(SERVER_ERROR_STATUS)));
    const rejecting = vi.fn((_url: string, _init?: RequestInit) => Promise.reject(new Error()));

    await expect(checkGithubToken(CHECKED_TOKEN, pushable)).resolves.toBe(TokenCheck.valid);
    await expect(checkGithubToken(CHECKED_TOKEN, readOnly), 'public repo: 200 without push proves nothing').resolves.toBe(
      TokenCheck.unauthorized,
    );
    await expect(checkGithubToken(CHECKED_TOKEN, noPermissions)).resolves.toBe(TokenCheck.unauthorized);
    await expect(checkGithubToken(CHECKED_TOKEN, unauthorized)).resolves.toBe(TokenCheck.unauthorized);
    await expect(checkGithubToken(CHECKED_TOKEN, forbidden)).resolves.toBe(TokenCheck.unauthorized);
    await expect(checkGithubToken(CHECKED_TOKEN, failing)).resolves.toBe(TokenCheck.error);
    await expect(checkGithubToken(CHECKED_TOKEN, rejecting)).resolves.toBe(TokenCheck.error);
    expect(pushable).toHaveBeenCalledWith(PROTOCOLS_REPO_API_URL, EXPECTED_CHECK_INIT);
  });

  it('falls back to the global fetch by default', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse(PUSH_REPO_RESPONSE))),
    );

    await expect(checkGithubToken(CHECKED_TOKEN)).resolves.toBe(TokenCheck.valid);
  });
});
