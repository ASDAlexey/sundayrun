/** Token is missing, expired or lacks repo access (HTTP 401/403). */
export class GithubAuthError extends Error {}

/** Any other non-OK GitHub response; `status` keeps the HTTP status code. */
export class GithubRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
