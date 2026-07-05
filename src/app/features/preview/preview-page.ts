import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { HistoryService } from '../../github/history.service';
import { ProtocolStateService } from '../../state/protocol-state.service';
import { EventForm } from './event-form/event-form';
import { ParticipantsTable } from './participants-table/participants-table';
import { RESULT_ROUTE_COMMANDS } from './preview-page.constant';
import { HistoryNotesStatus, HistoryNotesStatusType } from './preview-page.enum';

/** The /preview page: participants editing plus the race event form before PDF generation. */
@Component({
  selector: 'app-preview-page',
  imports: [EventForm, ParticipantsTable],
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
  readonly canApplyHistoryNotes = computed(() => this.#eventDateIso() !== null && this.historyStatus() !== HistoryNotesStatus.loading);

  protected readonly historyStatuses = HistoryNotesStatus;

  /** Loads the published history and overwrites every note with the computed auto note. */
  async applyHistoryNotes(): Promise<void> {
    const dateIso = this.#eventDateIso();

    if (dateIso === null) {
      return;
    }

    this.historyStatus.set(HistoryNotesStatus.loading);

    try {
      this.#store.applyAutoNotes(await this.#history.loadHistory(), dateIso);
      this.historyStatus.set(HistoryNotesStatus.idle);
    } catch {
      this.historyStatus.set(HistoryNotesStatus.error);
    }
  }

  async generate(): Promise<void> {
    await this.#router.navigate(RESULT_ROUTE_COMMANDS);
  }
}
