import { Component, computed, inject, signal } from '@angular/core';

import { InstallOffer } from './install-app.enum';
import { InstallPromptService } from './install-prompt.service';

/**
 * The «Установить приложение» offer at the top of the organiser panel: where the browser handed over
 * an install dialog (Android Chrome, desktop Chrome and Edge) the button opens it, and where none is
 * coming (every browser on iOS, Safari and Firefox on a desktop) the same button unfolds the two
 * taps that do it by hand. Inside an installed app the block renders nothing at all, so the panel
 * looks exactly as it did before.
 */
@Component({
  selector: 'app-install-app',
  templateUrl: './install-app.html',
  styleUrl: './install-app.scss',
})
export class InstallApp {
  readonly #installPrompt = inject(InstallPromptService);

  readonly offers = InstallOffer;
  readonly offer = this.#installPrompt.offer;
  readonly hintOpen = signal(false);

  /** Only the manual button owns a disclosure; the one that opens a dialog must stay silent about it. */
  readonly ariaExpanded = computed<boolean | null>(() => (this.offer() === InstallOffer.manual ? this.hintOpen() : null));

  async activate(): Promise<void> {
    if (this.offer() === InstallOffer.prompt) {
      await this.#installPrompt.install();

      return;
    }

    this.hintOpen.update((open) => !open);
  }
}
