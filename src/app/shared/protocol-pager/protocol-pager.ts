import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ProtocolStateService } from '../../state/protocol-state.service';
import { EMPTY_FILE_NAME } from './protocol-pager.constant';

/**
 * Pages through the drafts of a multi-protocol upload on /preview and /result: previous/next plus
 * one dot per draft, colored by readiness. Renders nothing for a single-file upload.
 */
@Component({
  selector: 'app-protocol-pager',
  templateUrl: './protocol-pager.html',
  styleUrl: './protocol-pager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProtocolPager {
  readonly #store = inject(ProtocolStateService);

  readonly count = this.#store.draftCount;
  readonly index = this.#store.activeIndex;
  readonly readiness = this.#store.draftsReady;
  readonly fileName = computed(() => this.#store.sourceFile()?.name ?? EMPTY_FILE_NAME);
  readonly isFirst = computed(() => this.index() === 0);
  readonly isLast = computed(() => this.index() === this.count() - 1);

  previous(): void {
    this.#store.selectDraft(this.index() - 1);
  }

  next(): void {
    this.#store.selectDraft(this.index() + 1);
  }

  select(index: number): void {
    this.#store.selectDraft(index);
  }
}
