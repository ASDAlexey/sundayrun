import { Mock, vi } from 'vitest';

import { TIMER_INSTALL_PROMPT_EVENT } from './install-prompt.constant';

/** The `beforeinstallprompt` event as the spec drives it: a real event plus the two Chromium members. */
export interface InstallPromptEventMock extends Event {
  prompt: Mock;
  userChoice: Promise<{ outcome: string }>;
}

/** What the visitor tapped in the browser's dialog — the answer the hint writes down. */
export const INSTALL_OUTCOME = 'accepted';

/** When the cached directory was fetched, and how that instant has to read on screen. */
export const ROSTER_CACHED_AT_MS = Date.UTC(2026, 6, 26, 6, 5);
export const ROSTER_CACHED_DATE_TEXT = '26 июл 2026';

/** An event whose `prompt` is a spy and whose answer is already decided. */
export function installPromptEvent(): InstallPromptEventMock {
  return Object.assign(new Event(TIMER_INSTALL_PROMPT_EVENT, { cancelable: true }), {
    prompt: vi.fn(() => Promise.resolve()),
    userChoice: Promise.resolve({ outcome: INSTALL_OUTCOME }),
  });
}

/** A bare event of the same name: something else in the page fired it, and it must be ignored. */
export function foreignPromptEvent(): Event {
  return new Event(TIMER_INSTALL_PROMPT_EVENT, { cancelable: true });
}

/** `prompt` is there but is not callable — a shape no dialog can be asked of. */
export function nonCallablePromptEvent(): Event {
  return Object.assign(new Event(TIMER_INSTALL_PROMPT_EVENT, { cancelable: true }), { prompt: 'установить' });
}

/** Callable, but with no answer to wait for; the hint would never learn what was chosen. */
export function choicelessPromptEvent(): Event {
  return Object.assign(new Event(TIMER_INSTALL_PROMPT_EVENT, { cancelable: true }), { prompt: vi.fn() });
}

/** A worker that finished installing — the half of «готово офлайн» the package can actually report. */
export const ACTIVE_REGISTRATION = { active: {} };

/** A registration that is still installing: nothing is guaranteed to be in the cache yet. */
export const INSTALLING_REGISTRATION = { active: null };
