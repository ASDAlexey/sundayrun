/**
 * A Coros endpoint answered with something other than success.
 *
 * Carries the raw `result` code so the sync layer can tell «token died, ask to reconnect» from
 * «this activity has no file», instead of treating every failure as a broken connection.
 */
export class CorosApiError extends Error {
  constructor(
    message: string,
    readonly result: string | undefined,
  ) {
    super(message);
    this.name = 'CorosApiError';
  }
}
