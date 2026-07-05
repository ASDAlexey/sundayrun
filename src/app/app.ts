import { ChangeDetectionStrategy, Component, DOCUMENT, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { MAIN_CONTENT_ID } from './app.constant';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly #document = inject(DOCUMENT);

  /** `href="#main"` would resolve against `<base href>` and reload the app, so focus is moved manually. */
  skipToMain(event: Event): void {
    event.preventDefault();
    this.#document.getElementById(MAIN_CONTENT_ID)?.focus();
  }
}
