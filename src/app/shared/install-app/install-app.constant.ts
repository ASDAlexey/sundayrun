/**
 * Chromium (Android Chrome, desktop Chrome/Edge) fires this instead of installing on its own once
 * the manifest and the service worker check out; holding on to the event is the only way to open the
 * install dialog later, from a button of ours.
 */
export const INSTALL_PROMPT_EVENT = 'beforeinstallprompt';

/** Fired the moment the app lands on the home screen — the offer has nothing left to give. */
export const APP_INSTALLED_EVENT = 'appinstalled';

/** True inside an installed window — where there is nothing left to install. */
export const STANDALONE_MEDIA_QUERY = '(display-mode: standalone)';

/**
 * How long the offer waits for `beforeinstallprompt` before deciding no dialog is coming (iOS fires
 * it never, Chromium right after the load event). Only then does the button switch to the
 * do-it-by-hand instruction, so a real install dialog is never talked over. The wait starts at app
 * start, so by the time /admin opens it is long over.
 */
export const INSTALL_SETTLE_MS = 1200;
