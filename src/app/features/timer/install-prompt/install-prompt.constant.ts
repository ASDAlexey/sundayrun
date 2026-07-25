import { TimerStorage } from '../../../state/timer-storage.type';

/** localStorage key remembering that the install hint was answered — it never asks twice. */
export const TIMER_INSTALL_STORAGE_KEY = 'sundayrun.timer.install.v1';

/** The Chromium-only event that offers the install dialog; absent on iOS by design. */
export const TIMER_INSTALL_PROMPT_EVENT = 'beforeinstallprompt';

/** True inside an installed app — where there is nothing left to install. */
export const TIMER_STANDALONE_MEDIA = '(display-mode: standalone)';

/**
 * How long the hint waits for `beforeinstallprompt` before deciding the browser will never fire it
 * (iOS, or an install that already happened in another tab). Chromium fires it right after the load
 * event, so a second is generous; the wait only exists so the iOS instruction never flashes over a
 * browser that was about to offer the real button.
 */
export const TIMER_INSTALL_SETTLE_MS = 1200;

/** Prerender has no localStorage and nothing to install, so a stub of the used subset suffices. */
export const TIMER_INSTALL_SSR_NOOP_STORAGE: TimerStorage = {
  getItem: () => null,
  setItem: () => undefined,
};
