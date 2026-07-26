import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * What a data page shows while its load runs: a chronometer sweep over a thin lane and one mono
 * caption naming what is loading. It replaces the Material spinner every page used to put inline
 * next to its text — a block box on a text baseline, which never lined up on a narrow screen and
 * read as a stray preloader. The page keeps its own `role="status"` wrapper; this is only its
 * content.
 */
@Component({
  selector: 'app-loading-state',
  templateUrl: './loading-state.html',
  styleUrl: './loading-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingState {
  /** The caption under the lane; each page names exactly what it is loading. */
  readonly label = input.required<string>();
}
