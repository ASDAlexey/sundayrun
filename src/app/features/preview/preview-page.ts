import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';

import { eventDatesFromHistory } from '../../core/history/event-dates';
import { AthletesHistory } from '../../core/models/athletes-history.type';
import { HistoryService } from '../../github/history.service';
import { ProtocolPager } from '../../shared/protocol-pager/protocol-pager';
import { ProtocolStateService } from '../../state/protocol-state.service';
import { EventForm } from './event-form/event-form';
import { ParticipantsTable } from './participants-table/participants-table';
import { HISTORY_SPINNER_DIAMETER, RESULT_ROUTE_COMMANDS } from './preview-page.constant';
import { HistoryNotesStatus, HistoryNotesStatusType } from './preview-page.enum';

/** The /preview page: participants editing plus the race event form before PDF generation, paging through the batch's drafts. */
@Component({
  selector: 'app-preview-page',
  imports: [EventForm, MatProgressSpinnerModule, ParticipantsTable, ProtocolPager],
  templateUrl: './preview-page.html',
  styleUrl: './preview-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewPage {
  readonly #store = inject(ProtocolStateService);
  readonly #history = inject(HistoryService);
  readonly #router = inject(Router);

  /** The loaded archive, kept so the auto notes can run once the drafts' dates are known. */
  readonly #loadedHistory = signal<AthletesHistory | null>(null);

  readonly canGenerate = this.#store.canGenerate;
  readonly draftCount = this.#store.draftCount;
  readonly unreadyDraftCount = this.#store.unreadyDraftCount;
  readonly hasDuplicateDates = this.#store.hasDuplicateDates;
  readonly unknownGenderCount = this.#store.unknownGenderCount;
  readonly hasUnverified = computed(() => this.unknownGenderCount() > 0);

  /** Other drafts of the batch still blocking the batch, beyond what this draft's own warning covers. */
  readonly otherUnreadyCount = computed(() => {
    const activeReady = this.#store.draftsReady()[this.#store.activeIndex()] ?? false;

    return this.unreadyDraftCount() - (activeReady ? 0 : 1);
  });

  readonly historyStatus = signal<HistoryNotesStatusType>(HistoryNotesStatus.idle);

  protected readonly historyStatuses = HistoryNotesStatus;

  protected readonly spinnerDiameter = HISTORY_SPINNER_DIAMETER;

  constructor() {
    // History loads with the page so the archive dates feed the positional race number, which is what
    // makes the (auto-numbered) event form valid — without it the event is never published and the
    // Generate button stays disabled.
    void this.#loadHistory();

    // Applies the auto notes once per draft as soon as its date is known: the store tracks which
    // drafts already ran, so gender fixes and date edits re-trigger this without ever overwriting a
    // manual note fix.
    effect(() => {
      const history = this.#loadedHistory();

      if (history !== null) {
        this.#store.applyAutoNotes(history);
      }
    });
  }

  async generate(): Promise<void> {
    await this.#router.navigate(RESULT_ROUTE_COMMANDS);
  }

  /** Loads the published history and feeds the event dates to the auto race number. */
  async #loadHistory(): Promise<void> {
    this.historyStatus.set(HistoryNotesStatus.loading);

    try {
      const history = await this.#history.loadHistory();

      this.#store.setPublishedEventDates(eventDatesFromHistory(history));
      this.#loadedHistory.set(history);
      this.historyStatus.set(HistoryNotesStatus.idle);
    } catch {
      this.historyStatus.set(HistoryNotesStatus.error);
    }
  }
}
