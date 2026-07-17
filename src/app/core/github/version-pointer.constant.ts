import { SleepFn } from './version-pointer.type';

/** Pointer commit message template; append the event slug. */
export const VERSION_COMMIT_MESSAGE_PREFIX = 'Обновление указателя версии: ';

/** How many times the pointer commit is attempted before the publication is reported failed. */
export const VERSION_POINTER_MAX_ATTEMPTS = 3;

/** Backoff between pointer attempts — lets GitHub's branch ref converge after the data commit (ms). */
export const VERSION_POINTER_RETRY_DELAY_MS = 1_000;

/** Real timer used in production; specs inject an instant no-op so the retries never wait. */
export const DEFAULT_SLEEP: SleepFn = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
