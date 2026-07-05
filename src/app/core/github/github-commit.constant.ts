/** Thrown when the ref update was rejected on every attempt; the error's `status` keeps the last 409/422. */
export const COMMIT_RETRIES_EXHAUSTED_MESSAGE = 'GitHub commit failed: the branch ref update was rejected on every attempt';
