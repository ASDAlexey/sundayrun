/**
 * The Chromium `beforeinstallprompt` event. The DOM lib does not type it, so the one member the
 * button calls is declared here and checked at runtime by `isInstallPromptEvent` before use.
 */
export interface InstallPromptEvent extends Event {
  prompt(): Promise<unknown>;
}
