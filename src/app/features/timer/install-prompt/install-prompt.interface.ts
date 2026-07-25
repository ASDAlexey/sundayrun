/** What the visitor answered in the browser's own install dialog. */
export interface TimerInstallChoice {
  outcome: string;
}

/**
 * The Chromium `beforeinstallprompt` event. It is not in the DOM lib, and casts are banned in this
 * project, so the shape it is used through is declared here and checked at runtime by
 * `isInstallPromptEvent` before anything is called on it.
 */
export interface TimerInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<TimerInstallChoice>;
}
