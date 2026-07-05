import { GithubAuthError, GithubRequestError } from './github-errors';
import { ERROR_MESSAGE, ERROR_STATUS } from './github-errors.mock';

describe('github-errors', () => {
  it('builds Error subclasses; GithubRequestError keeps the HTTP status', () => {
    const authError = new GithubAuthError(ERROR_MESSAGE);
    const requestError = new GithubRequestError(ERROR_MESSAGE, ERROR_STATUS);

    expect(authError).toBeInstanceOf(Error);
    expect(authError.message).toBe(ERROR_MESSAGE);
    expect(requestError).toBeInstanceOf(Error);
    expect(requestError.message).toBe(ERROR_MESSAGE);
    expect(requestError.status).toBe(ERROR_STATUS);
  });
});
