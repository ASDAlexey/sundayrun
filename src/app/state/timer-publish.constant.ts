import { TimerPublishState, TimerPublishStateType } from '../core/timer/timer-session.enum';
import { TimerPublishStep, TimerPublishStepType } from './timer-publish.enum';

/**
 * The coarse status each step reports. Everything between «Сохранить» and the landed deploy is one
 * `pending`, so the same map doubles as the re-entry guard: a pending publication refuses a second
 * click.
 */
export const TIMER_PUBLISH_STATE_BY_STEP: Record<TimerPublishStepType, TimerPublishStateType> = {
  [TimerPublishStep.idle]: TimerPublishState.local,
  [TimerPublishStep.notes]: TimerPublishState.pending,
  [TimerPublishStep.committing]: TimerPublishState.pending,
  [TimerPublishStep.deploying]: TimerPublishState.pending,
  [TimerPublishStep.done]: TimerPublishState.published,
  [TimerPublishStep.failed]: TimerPublishState.failed,
};

/**
 * The failure texts. They are stored inside the session (`publish.error`) and read back from
 * localStorage days later, so they are plain sentences rather than translatable template nodes —
 * the site's source locale is ru and the message has to survive a round trip through JSON.
 */
export const TIMER_PUBLISH_ARCHIVE_ERROR = 'Не удалось прочитать архив — проверьте интернет и повторите.';
export const TIMER_PUBLISH_AUTH_ERROR = 'Нет доступа к GitHub: токен отсутствует или истёк.';
export const TIMER_PUBLISH_COMMIT_ERROR = 'Не удалось отправить забег. Замер цел, ничего не потеряно.';
export const TIMER_PUBLISH_EMPTY_ERROR = 'Не удалось собрать забег для публикации — откройте «Проверить перед публикацией».';
