import { InstallPromptEvent } from './install-app.interface';

/**
 * `beforeinstallprompt` is not typed by the DOM lib and only Chromium fires it, so the event is
 * checked for the member it is used through instead of being asserted into shape.
 */
export function isInstallPromptEvent(event: Event): event is InstallPromptEvent {
  return 'prompt' in event && typeof event.prompt === 'function';
}
