import { ChangeDetectionStrategy, Component, DOCUMENT, DestroyRef, computed, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

import { TimerRosterService } from '../../../state/timer-roster.service';
import { TimerStorage } from '../../../state/timer-storage.type';
import {
  TIMER_INSTALL_PROMPT_EVENT,
  TIMER_INSTALL_SETTLE_MS,
  TIMER_INSTALL_SSR_NOOP_STORAGE,
  TIMER_INSTALL_STORAGE_KEY,
  TIMER_STANDALONE_MEDIA,
} from './install-prompt.constant';
import { TimerInstallPromptEvent } from './install-prompt.interface';
import { formatRosterDate, isInstallPromptEvent } from './install-prompt.view';

/**
 * The two things a stopwatch has to say before the park: how to keep it on the home screen, and
 * whether it will actually start without a network (docs/TIMER.md §12).
 *
 * «Установить» is the browser's own dialog where there is one — Chromium hands it over through
 * `beforeinstallprompt`, whose mini-infobar is suppressed so the offer sits here, beside the
 * readiness badge. iOS never fires that event, so after a short wait the same block turns into the
 * «Поделиться → На экран „Домой“» line: the choice is made on what the browser did, never on a
 * user-agent string. Inside an installed app, and once the offer has been answered, it says nothing.
 *
 * «Готово к работе офлайн ✓» lights up on the two facts that make the screen survive: an active
 * service worker (`SwUpdate.isEnabled` plus `serviceWorker.ready` — the whole of what the package
 * offers) and a downloaded directory of athletes, dated, so «актуально на» is never a guess.
 */
@Component({
  selector: 'app-timer-install',
  templateUrl: './install-prompt.html',
  styleUrl: './install-prompt.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimerInstall {
  readonly #view = inject(DOCUMENT).defaultView;
  readonly #swUpdate = inject(SwUpdate);
  readonly #roster = inject(TimerRosterService);
  readonly #prompt = signal<TimerInstallPromptEvent | null>(null);
  readonly #answered = signal(this.#storage.getItem(TIMER_INSTALL_STORAGE_KEY) !== null);
  readonly #settled = signal(false);
  readonly #shellCached = signal(false);
  // Optional call, not carelessness: a browser (or a test environment) without `matchMedia` simply
  // cannot be an installed app, and must not take the whole block down over it.
  readonly #standalone = this.#view?.matchMedia?.(TIMER_STANDALONE_MEDIA).matches === true;

  /** Installed, or already asked once: either way the block has nothing left to offer. */
  readonly #silenced = computed(() => this.#standalone || this.#answered());

  protected readonly ready = computed(() => this.#shellCached() && this.#roster.cachedAtMs() !== null);

  /** The pending browser dialog, handed to the click so the handler never guesses at null. */
  protected readonly offer = computed(() => (this.#silenced() ? null : this.#prompt()));

  /** No dialog is coming and none ever will: the iOS instruction is the only way in. */
  protected readonly manual = computed(() => !this.#silenced() && this.#prompt() === null && this.#settled());

  protected readonly rosterDateText = computed(() => {
    const cachedAtMs = this.#roster.cachedAtMs();

    return cachedAtMs === null ? '' : formatRosterDate(cachedAtMs);
  });

  constructor() {
    const view = this.#view;
    const destroyRef = inject(DestroyRef);

    if (view === null) {
      return;
    }

    const onPrompt = (event: Event): void => {
      // The browser's own infobar goes away: the offer belongs beside the readiness badge, on the
      // one screen that has a reason to be installed.
      event.preventDefault();

      if (isInstallPromptEvent(event)) {
        this.#prompt.set(event);
      }
    };

    view.addEventListener(TIMER_INSTALL_PROMPT_EVENT, onPrompt);

    const settleId = view.setTimeout(() => this.#settled.set(true), TIMER_INSTALL_SETTLE_MS);

    void this.#checkShell(view);

    destroyRef.onDestroy(() => {
      view.removeEventListener(TIMER_INSTALL_PROMPT_EVENT, onPrompt);
      view.clearTimeout(settleId);
    });
  }

  /** Hands the visitor Chromium's install dialog; whatever they answer, the offer is done asking. */
  protected async onInstall(event: TimerInstallPromptEvent): Promise<void> {
    await event.prompt();

    const choice = await event.userChoice;

    this.#storage.setItem(TIMER_INSTALL_STORAGE_KEY, choice.outcome);
    this.#answered.set(true);
  }

  async #checkShell(view: Window): Promise<void> {
    if (!this.#swUpdate.isEnabled) {
      return;
    }

    try {
      const registration = await view.navigator.serviceWorker.ready;

      this.#shellCached.set(registration.active !== null);
    } catch {
      // A browser without a worker, or one that refused to register, leaves the badge dark.
    }
  }

  /** Live localStorage access, so specs can stub the global per scenario; absent during prerender. */
  get #storage(): TimerStorage {
    return typeof localStorage === 'undefined' ? TIMER_INSTALL_SSR_NOOP_STORAGE : localStorage;
  }
}
