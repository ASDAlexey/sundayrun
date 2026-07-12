import { Injectable, computed, signal } from '@angular/core';

import { historyBeforeDate } from '../core/history/athletes-rollup';
import { toAutoNoteInput } from '../core/history/auto-note-input';
import { buildEventAutoNotes } from '../core/history/event-auto-notes';
import { mergeAutoNote } from '../core/history/note-merge';
import { AthletesHistory } from '../core/models/athletes-history.type';
import { GenderConfidence, GenderSource, GenderType } from '../core/models/gender.enum';
import { Participant } from '../core/models/participant.interface';
import { RaceEvent } from '../core/models/race-event.interface';
import { buildProtocolRows } from '../core/protocol/protocol-builder';
import { parseDateFromFileName } from '../core/time/file-name-date';
import { importParticipants } from '../core/xlsx/import-participants';
import { SourceFile } from './source-file.interface';

/** Single source of truth for the imported race: participants, event metadata and readiness flags. */
@Injectable({ providedIn: 'root' })
export class ProtocolStateService {
  readonly #participants = signal<Participant[]>([]);
  readonly #event = signal<RaceEvent | null>(null);
  readonly #sourceFile = signal<SourceFile | null>(null);
  readonly #suggestedDateIso = signal<string | null>(null);
  readonly #publishedEventDates = signal<string[] | null>(null);

  readonly participants = this.#participants.asReadonly();
  readonly event = this.#event.asReadonly();
  readonly sourceFile = this.#sourceFile.asReadonly();
  readonly suggestedDateIso = this.#suggestedDateIso.asReadonly();

  /** Dates of every published event (null until the history loads) — the base of the auto race number. */
  readonly publishedEventDates = this.#publishedEventDates.asReadonly();

  readonly protocolRows = computed(() => buildProtocolRows(this.#participants()));
  readonly hasParticipants = computed(() => this.#participants().length > 0);
  readonly unknownGenderCount = computed(() => this.#participants().filter((participant) => participant.gender === null).length);
  readonly canGenerate = computed(() => this.hasParticipants() && this.unknownGenderCount() === 0 && this.#event() !== null);

  importFile(name: string, bytes: Uint8Array): void {
    this.#participants.set(importParticipants(bytes));
    this.#sourceFile.set({ name, bytes });
    this.#suggestedDateIso.set(parseDateFromFileName(name));
  }

  setGender(id: number, gender: GenderType): void {
    this.#updateParticipant(id, (participant) => ({
      ...participant,
      gender,
      genderConfidence: GenderConfidence.high,
      genderSource: GenderSource.manual,
    }));
  }

  setNote(id: number, note: string): void {
    this.#updateParticipant(id, (participant) => ({ ...participant, note }));
  }

  setEvent(event: RaceEvent): void {
    this.#event.set(event);
  }

  setPublishedEventDates(dates: string[]): void {
    this.#publishedEventDates.set(dates);
  }

  /**
   * Recomputes every participant's auto note from the published history (personal record, year
   * best among the same gender, first participation); manual note text is kept after the auto
   * part (see `mergeAutoNote`). The history is first cut to the events strictly before
   * `dateIso`, so a re-publication never compares results against their own previous
   * publication and a back-dated import never compares against future results.
   */
  applyAutoNotes(history: AthletesHistory, dateIso: string): void {
    const priorHistory = historyBeforeDate(history, dateIso);

    this.#participants.update((participants) => {
      const autoNotes = buildEventAutoNotes(
        participants.map((participant) => toAutoNoteInput(participant, dateIso)),
        priorHistory,
        dateIso,
      );

      return participants.map((participant, index) => ({ ...participant, note: mergeAutoNote(autoNotes[index], participant.note) }));
    });
  }

  reset(): void {
    this.#participants.set([]);
    this.#event.set(null);
    this.#sourceFile.set(null);
    this.#suggestedDateIso.set(null);
    this.#publishedEventDates.set(null);
  }

  #updateParticipant(id: number, change: (participant: Participant) => Participant): void {
    this.#participants.update((participants) =>
      participants.map((participant) => (participant.id === id ? change(participant) : participant)),
    );
  }
}
