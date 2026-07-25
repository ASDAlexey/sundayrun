import { ISO_DATE_LENGTH } from '../../../core/history/notables.constant';
import { formatRussianDateCompact } from '../../../core/time/russian-date';
import { TimerInstallPromptEvent } from './install-prompt.interface';

/**
 * `beforeinstallprompt` is not typed by the DOM lib and only Chromium fires it, so the event is
 * checked for the two members it is used through instead of being asserted into shape.
 */
export function isInstallPromptEvent(event: Event): event is TimerInstallPromptEvent {
  return 'prompt' in event && typeof event.prompt === 'function' && 'userChoice' in event;
}

/** When the cached directory was fetched, as «26 июл 2026» — the «актуально на» line of the badge. */
export function formatRosterDate(cachedAtMs: number): string {
  return formatRussianDateCompact(new Date(cachedAtMs).toISOString().slice(0, ISO_DATE_LENGTH));
}
