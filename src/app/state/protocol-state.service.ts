import { Injectable, computed, signal } from '@angular/core';

import { eventNumberForDate } from '../core/github/archive-index';
import { PublishEventInput } from '../core/github/publish-event.interface';
import { historyBeforeDate, applyEventToHistory, removeEventFromHistory } from '../core/history/athletes-rollup';
import { toAutoNoteInput } from '../core/history/auto-note-input';
import { DraftRows } from '../core/history/draft-priors.interface';
import { buildEventAutoNotes } from '../core/history/event-auto-notes';
import { mergeAutoNote } from '../core/history/note-merge';
import { toEventResults } from '../core/github/results-file';
import { AthletesHistory } from '../core/models/athletes-history.type';
import { GenderConfidence, GenderSource, GenderType } from '../core/models/gender.enum';
import { Participant } from '../core/models/participant.interface';
import { RaceEvent } from '../core/models/race-event.interface';
import { buildProtocolRows } from '../core/protocol/protocol-builder';
import { RACE_EVENT_DEFAULTS } from '../core/protocol/race-event-defaults.constant';
import { parseDateFromFileName } from '../core/time/file-name-date';
import { isoToday } from '../core/time/iso-today';
import { importParticipants } from '../core/xlsx/import-participants';
import { ProtocolDraft } from './protocol-draft.interface';
import { SourceFile } from './source-file.interface';

/**
 * Single source of truth for the imported race protocols. A drop can carry several workbooks at
 * once; each becomes a draft, the pages page through them via `activeIndex`, and the whole batch is
 * published together. The single-draft accessors (`participants`, `event`, …) always read the
 * active draft, so the editing components stay draft-agnostic.
 */
@Injectable({ providedIn: 'root' })
export class ProtocolStateService {
  readonly #drafts = signal<ProtocolDraft[]>([]);
  readonly #activeIndex = signal(0);
  readonly #publishedEventDates = signal<string[] | null>(null);

  readonly #activeDraft = computed(() => this.#drafts()[this.#activeIndex()] ?? null);

  readonly drafts = this.#drafts.asReadonly();
  readonly activeIndex = this.#activeIndex.asReadonly();
  readonly draftCount = computed(() => this.#drafts().length);

  readonly participants = computed(() => this.#activeDraft()?.participants ?? []);
  readonly event = computed(() => this.#activeDraft()?.event ?? null);
  readonly sourceFile = computed(() => this.#activeDraft()?.sourceFile ?? null);
  readonly suggestedDateIso = computed(() => this.#activeDraft()?.suggestedDateIso ?? null);

  /** Dates of every published event (null until the history loads) — the base of the auto race number. */
  readonly publishedEventDates = this.#publishedEventDates.asReadonly();

  /**
   * The auto race number's date base for the ACTIVE draft: the published archive plus the other
   * drafts of this batch — an earlier sibling shifts the number exactly as an archived event would.
   */
  readonly activeNumberingDates = computed<string[] | null>(() => {
    const published = this.#publishedEventDates();

    return published === null ? null : numberingDates(published, this.#drafts(), this.#activeIndex());
  });

  readonly protocolRows = computed(() => buildProtocolRows(this.participants()));
  readonly hasParticipants = computed(() => this.participants().length > 0);
  readonly unknownGenderCount = computed(() => this.participants().filter((participant) => participant.gender === null).length);

  /** Per-draft readiness: participants imported, every gender known, requisites set. */
  readonly draftsReady = computed(() => this.#drafts().map((draft) => isDraftReady(draft)));

  /** Drafts of the batch still needing attention (unverified genders or missing requisites). */
  readonly unreadyDraftCount = computed(() => this.draftsReady().filter((ready) => !ready).length);

  /** Two drafts on one date would overwrite each other in the archive, so the batch is blocked. */
  readonly hasDuplicateDates = computed(() => {
    const dates = this.#drafts().flatMap((draft) => (draftDateIso(draft) === null ? [] : [draftDateIso(draft)]));

    return new Set(dates).size !== dates.length;
  });

  readonly canGenerate = computed(() => this.draftCount() > 0 && this.draftsReady().every(Boolean) && !this.hasDuplicateDates());

  importFile(name: string, bytes: Uint8Array): void {
    this.importFiles([{ name, bytes }]);
  }

  /** Imports the whole drop as drafts, ordered by the date parsed from the file name (undated last). */
  importFiles(files: SourceFile[]): void {
    const drafts = files.map(
      (file): ProtocolDraft => ({
        participants: importParticipants(file.bytes),
        event: null,
        sourceFile: file,
        suggestedDateIso: parseDateFromFileName(file.name, isoToday()),
        notesApplied: false,
      }),
    );

    drafts.sort(byDraftDate);
    this.#drafts.set(drafts);
    this.#activeIndex.set(0);
    this.#autoFillEvents();
  }

  selectDraft(index: number): void {
    if (index >= 0 && index < this.#drafts().length) {
      this.#activeIndex.set(index);
    }
  }

  setGender(id: number, gender: GenderType): void {
    this.#updateParticipant(id, (participant) => ({
      ...participant,
      gender,
      genderConfidence: GenderConfidence.high,
      genderSource: GenderSource.manual,
    }));
  }

  setEvent(event: RaceEvent): void {
    this.#updateActiveDraft((draft) => ({ ...draft, event }));
    // A date change shifts the positional numbers of every later draft in the batch.
    this.#renumberDrafts();
  }

  setPublishedEventDates(dates: string[]): void {
    this.#publishedEventDates.set(dates);
    this.#autoFillEvents();
  }

  /**
   * Recomputes every draft's auto notes from the published history (personal record, year best
   * among the same gender, first participation); manual note text is kept after the auto part
   * (see `mergeAutoNote`). Drafts are replayed in date order on top of the history, so a batch
   * behaves exactly like publishing its files one by one: a record set in an earlier draft is
   * what a later draft's note compares against. Each draft's notes run once — a draft whose date
   * is still unknown is skipped and picked up on the next call — so manual fixes are never
   * overwritten; the history is cut strictly before each date, so a re-publication never compares
   * against its own previous publication.
   */
  applyAutoNotes(history: AthletesHistory): void {
    const ordered = this.#drafts()
      .flatMap((draft, index) => {
        const dateIso = draftDateIso(draft);

        return dateIso === null ? [] : [{ draft, index, dateIso }];
      })
      .sort((left, right) => left.dateIso.localeCompare(right.dateIso));

    const notedParticipants = new Map<number, Participant[]>();
    let rolling = history;

    for (const { draft, index, dateIso } of ordered) {
      if (!draft.notesApplied) {
        notedParticipants.set(index, withAutoNotes(draft.participants, historyBeforeDate(rolling, dateIso), dateIso));
      }

      const slug = dateIso;

      rolling = applyEventToHistory(
        removeEventFromHistory(rolling, slug),
        { slug, dateIso },
        toEventResults(buildProtocolRows(draft.participants)),
      );
    }

    if (notedParticipants.size > 0) {
      this.#drafts.update((drafts) =>
        drafts.map((draft, index) => {
          const participants = notedParticipants.get(index);

          return participants === undefined ? draft : { ...draft, participants, notesApplied: true };
        }),
      );
    }
  }

  /**
   * The batch's other drafts dated strictly before `dateIso`, oldest first, as protocol rows —
   * they are not in the db yet, so the PDF's finish counts and «ЛР (было …)» dating add them on top
   * of the stored history.
   */
  draftRowsBefore(dateIso: string): DraftRows[] {
    return this.#drafts()
      .flatMap((draft) => {
        const draftDate = draftDateIso(draft);

        return draftDate === null || draftDate >= dateIso ? [] : [{ dateIso: draftDate, rows: buildProtocolRows(draft.participants) }];
      })
      .sort((left, right) => left.dateIso.localeCompare(right.dateIso));
  }

  /** The whole batch as publish payloads, protocol rows built per draft; only callable when `canGenerate`. */
  buildPublishInputs(): PublishEventInput[] {
    return this.#drafts().flatMap((draft) =>
      draft.event === null
        ? []
        : [{ event: draft.event, rows: buildProtocolRows(draft.participants), sourceXlsxBytes: draft.sourceFile.bytes }],
    );
  }

  reset(): void {
    this.#drafts.set([]);
    this.#activeIndex.set(0);
    this.#publishedEventDates.set(null);
  }

  /**
   * Gives every dated draft its requisites up front, so a batch is publishable without visiting
   * each draft's form: the defaults plus the positional number. Undated drafts (no date in the
   * file name) wait for a manual date on their form.
   */
  #autoFillEvents(): void {
    const published = this.#publishedEventDates();

    if (published === null) {
      return;
    }

    this.#drafts.update((drafts) =>
      drafts.map((draft, index) => {
        if (draft.event !== null || draft.suggestedDateIso === null) {
          return draft;
        }

        const dateIso = draft.suggestedDateIso;
        const number = eventNumberForDate(numberingDates(published, drafts, index), dateIso);

        return { ...draft, event: { ...RACE_EVENT_DEFAULTS, number, dateIso, legacyNumber: null } };
      }),
    );
    this.#renumberDrafts();
  }

  /** Re-derives every draft's positional number; the archive renumbers itself on write anyway, this keeps the PDFs right. */
  #renumberDrafts(): void {
    const published = this.#publishedEventDates();

    if (published === null) {
      return;
    }

    this.#drafts.update((drafts) =>
      drafts.map((draft, index) => {
        if (draft.event === null) {
          return draft;
        }

        const number = eventNumberForDate(numberingDates(published, drafts, index), draft.event.dateIso);

        return number === draft.event.number ? draft : { ...draft, event: { ...draft.event, number } };
      }),
    );
  }

  #updateActiveDraft(change: (draft: ProtocolDraft) => ProtocolDraft): void {
    const index = this.#activeIndex();

    this.#drafts.update((drafts) => drafts.map((draft, draftIndex) => (draftIndex === index ? change(draft) : draft)));
  }

  #updateParticipant(id: number, change: (participant: Participant) => Participant): void {
    this.#updateActiveDraft((draft) => ({
      ...draft,
      participants: draft.participants.map((participant) => (participant.id === id ? change(participant) : participant)),
    }));
  }
}

/** The date a draft is anchored to: the confirmed requisites first, the file-name suggestion else. */
function draftDateIso(draft: ProtocolDraft): string | null {
  return draft.event?.dateIso ?? draft.suggestedDateIso;
}

function isDraftReady(draft: ProtocolDraft): boolean {
  return draft.participants.length > 0 && draft.event !== null && draft.participants.every((participant) => participant.gender !== null);
}

/** Dated drafts first in chronological order, undated ones last by file name — the paging order. */
function byDraftDate(left: ProtocolDraft, right: ProtocolDraft): number {
  if (left.suggestedDateIso === null || right.suggestedDateIso === null) {
    if (left.suggestedDateIso === right.suggestedDateIso) {
      return left.sourceFile.name.localeCompare(right.sourceFile.name);
    }

    return left.suggestedDateIso === null ? 1 : -1;
  }

  return left.suggestedDateIso.localeCompare(right.suggestedDateIso);
}

/** The published dates plus the other drafts' dates, deduplicated — `draftIndex`'s own date stays out. */
function numberingDates(published: readonly string[], drafts: readonly ProtocolDraft[], draftIndex: number): string[] {
  const dates = new Set(published);

  drafts.forEach((draft, index) => {
    const dateIso = draftDateIso(draft);

    if (index !== draftIndex && dateIso !== null) {
      dates.add(dateIso);
    }
  });

  return [...dates];
}

/** One draft's participants with freshly built auto notes merged in front of the manual text. */
function withAutoNotes(participants: Participant[], priorHistory: AthletesHistory, dateIso: string): Participant[] {
  const autoNotes = buildEventAutoNotes(
    participants.map((participant) => toAutoNoteInput(participant, dateIso)),
    priorHistory,
    dateIso,
  );

  return participants.map((participant, index) => ({ ...participant, note: mergeAutoNote(autoNotes[index], participant.note) }));
}
