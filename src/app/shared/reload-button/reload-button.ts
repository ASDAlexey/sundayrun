import { ChangeDetectionStrategy, Component, DOCUMENT, inject } from '@angular/core';

/**
 * A button that reloads the page, shown beside a load-failure message. With the JSON mirror gone, a
 * persistent `sundayrun.db` read failure surfaces as an error; reloading re-runs the read (the
 * prerendered HTML paints instantly, then the browser refetches), which is the visitor's retry.
 */
@Component({
  selector: 'app-reload-button',
  templateUrl: './reload-button.html',
  styleUrl: './reload-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReloadButton {
  readonly #document = inject(DOCUMENT);

  reload(): void {
    this.#document.defaultView?.location.reload();
  }
}
