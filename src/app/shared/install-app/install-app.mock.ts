import { Mock, vi } from 'vitest';

import { APP_INSTALLED_EVENT, INSTALL_PROMPT_EVENT } from './install-app.constant';

/** The `beforeinstallprompt` event as the specs drive it: a real event plus the Chromium member. */
export interface InstallPromptEventMock extends Event {
  prompt: Mock;
}

/** An event whose `prompt` is a spy, so the spec can see the dialog being asked for. */
export function installPromptEvent(): InstallPromptEventMock {
  return Object.assign(new Event(INSTALL_PROMPT_EVENT, { cancelable: true }), { prompt: vi.fn(() => Promise.resolve()) });
}

/** A bare event of the same name: something else in the page fired it, and it must be ignored. */
export function foreignPromptEvent(): Event {
  return new Event(INSTALL_PROMPT_EVENT, { cancelable: true });
}

/** What the browser fires once the app is on the home screen. */
export function appInstalledEvent(): Event {
  return new Event(APP_INSTALLED_EVENT);
}

/** A browser tab (`false`) or an installed app window (`true`) — jsdom answers everything «false». */
export function stubStandalone(matches: boolean): void {
  vi.stubGlobal('matchMedia', () => ({ matches }));
}
