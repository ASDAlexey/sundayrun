import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';

import { eventDatesFromHistory } from '../../core/history/event-dates';
import { HistoryService } from '../../github/history.service';
import { ProtocolStateService } from '../../state/protocol-state.service';
import { EventForm } from './event-form/event-form';
import { ParticipantsTable } from './participants-table/participants-table';
import { HISTORY_SPINNER_DIAMETER, RESULT_ROUTE_COMMANDS } from './preview-page.constant';
import { HistoryNotesStatus, HistoryNotesStatusType } from './preview-page.enum';

/** The /preview page: participants editing plus the race event form before PDF generation. */
@Component({
  selector: 'app-preview-page',
  imports: [EventForm, MatProgressSpinnerModule, ParticipantsTable],
  templateUrl: './preview-page.html',
  styleUrl: './preview-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewPage {
  readonly #store = inject(ProtocolStateService);
  readonly #history = inject(HistoryService);
  readonly #router = inject(Router);

  /** Auto notes are computed against the event date, which the form only publishes when valid. */
  readonly #eventDateIso = computed(() => this.#store.event()?.dateIso ?? null);

  readonly canGenerate = this.#store.canGenerate;
  readonly unknownGenderCount = this.#store.unknownGenderCount;
  readonly hasUnverified = computed(() => this.unknownGenderCount() > 0);
  readonly historyStatus = signal<HistoryNotesStatusType>(HistoryNotesStatus.idle);

  protected readonly historyStatuses = HistoryNotesStatus;

  protected readonly spinnerDiameter = HISTORY_SPINNER_DIAMETER;

  /** Notes are auto-applied once; a later date edit must not overwrite manual note fixes. */
  #notesApplied = false;

  constructor() {
    // The form publishes the prefilled event right after init, so the notes arrive with the page.
    effect(() => {
      const dateIso = this.#eventDateIso();

      if (dateIso !== null && !this.#notesApplied) {
        this.#notesApplied = true;
        void this.#applyHistoryNotes(dateIso);
      }
    });
  }

  async generate(): Promise<void> {
    await this.#router.navigate(RESULT_ROUTE_COMMANDS);
  }

  /** Loads the published history, applies the auto notes and feeds the event dates to the auto race number. */
  async #applyHistoryNotes(dateIso: string): Promise<void> {
    this.historyStatus.set(HistoryNotesStatus.loading);

    try {
      const history = await this.#history.loadHistory();

      this.#store.setPublishedEventDates(eventDatesFromHistory(history));
      this.#store.applyAutoNotes(history, dateIso);
      this.historyStatus.set(HistoryNotesStatus.idle);
    } catch {
      this.historyStatus.set(HistoryNotesStatus.error);
    }
  }
}
