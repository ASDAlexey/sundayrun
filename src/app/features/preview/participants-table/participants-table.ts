import { ScrollingModule as ExperimentalScrollingModule } from '@angular/cdk-experimental/scrolling';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';

import { normalizeAthleteKey } from '../../../core/history/athlete-key';
import { finishCountsWithDrafts } from '../../../core/history/draft-priors';
import { eventFinishCounts } from '../../../core/history/finish-counts';
import { splitNote } from '../../../core/history/note-tokens';
import { placeGapsMs } from '../../../core/history/place-gaps';
import { Gender, GenderConfidence } from '../../../core/models/gender.enum';
import { Participant } from '../../../core/models/participant.interface';
import { ProtocolRow } from '../../../core/models/protocol-row.interface';
import { noteBadgeKindOf } from '../../../core/protocol/note-badge-kind';
import { NoteBadgeKind } from '../../../core/protocol/note-badge-kind.enum';
import { paceTextOf } from '../../../core/protocol/pace-text';
import { orderProtocolParticipants } from '../../../core/protocol/protocol-builder';
import { formatDuration } from '../../../core/time/duration';
import { ResultsService } from '../../../github/results.service';
import { ProtocolStateService } from '../../../state/protocol-state.service';
import {
  EMPTY_CELL_TEXT,
  FINISH_CLUB_TIERS,
  GAP_TEXT_PREFIX,
  NOTE_BADGE_CLASSES,
  PLACE_MEDAL_CLASSES,
} from './participants-table.constant';
import { ParticipantRowView, PreviewNoteBadgeView } from './participants-table.interface';

/**
 * The imported participants in the exact shape of the published protocol page — protocol order,
 * places with medals and gaps, pace, finish counts and note badges. Gender stays editable (the
 * М/Ж chips), and every edit reflows the places live; the note column is a read-only preview of
 * the auto-generated text exactly as the protocol will show it.
 */
@Component({
  selector: 'app-participants-table',
  templateUrl: './participants-table.html',
  styleUrl: './participants-table.scss',
  imports: [ScrollingModule, ExperimentalScrollingModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantsTable {
  readonly #store = inject(ProtocolStateService);
  readonly #results = inject(ResultsService);

  /** Stored 5 km finish counts strictly before the draft's date; empty until loaded or on a failed read. */
  readonly #priorFinishCounts = signal<Record<string, number>>({});

  readonly #dateIso = computed(() => this.#store.event()?.dateIso ?? this.#store.suggestedDateIso());

  /**
   * The «Участий за всё время» column source, mirroring the PDF: the stored prior counts, the
   * batch's earlier drafts and this draft's own finishes. Blank while the date is unknown.
   */
  readonly #finishCounts = computed(() => {
    const dateIso = this.#dateIso();

    if (dateIso === null) {
      return {};
    }

    return eventFinishCounts(
      this.#store.protocolRows(),
      finishCountsWithDrafts(this.#priorFinishCounts(), this.#store.draftRowsBefore(dateIso)),
    );
  });

  readonly rows = computed(() => {
    const rows = this.#store.protocolRows();
    const ordered = orderProtocolParticipants(this.#store.participants());
    const gapsMs = placeGapsMs(rows);
    const finishCounts = this.#finishCounts();

    return rows.map((row, index) => toRowView(row, ordered[index], gapsMs[index], finishCounts));
  });

  protected readonly noteKinds = NoteBadgeKind;

  constructor() {
    // The prior counts follow the active draft's date; a blank column beats a wrong count, so a
    // failed db read clears them instead of failing the page.
    effect(() => {
      void this.#loadPriorFinishCounts(this.#dateIso());
    });
  }

  trackRow = (_: number, row: ParticipantRowView): number => row.id;

  setMale(id: number): void {
    this.#store.setGender(id, Gender.male);
  }

  setFemale(id: number): void {
    this.#store.setGender(id, Gender.female);
  }

  async #loadPriorFinishCounts(dateIso: string | null): Promise<void> {
    if (dateIso === null) {
      this.#priorFinishCounts.set({});

      return;
    }

    const counts = await this.#results.loadFinishCountsBefore(dateIso).catch(() => ({}));

    // A draft switch may have changed the date while the read was in flight; stale results are dropped.
    if (this.#dateIso() === dateIso) {
      this.#priorFinishCounts.set(counts);
    }
  }
}

function toRowView(
  row: ProtocolRow,
  participant: Participant,
  gapMs: number | null,
  finishCounts: Record<string, number>,
): ParticipantRowView {
  const finishCount = finishCounts[normalizeAthleteKey(row.fullName)];
  const gapText = gapMs === null ? EMPTY_CELL_TEXT : GAP_TEXT_PREFIX + formatDuration(gapMs);

  return {
    id: participant.id,
    index: row.index,
    fullName: row.fullName,
    time23: row.time23,
    time5: row.time5,
    paceText: paceTextOf(row.totalMs, row.distanceKm),
    unverified: participant.genderConfidence !== GenderConfidence.high,
    isMale: row.gender === Gender.male,
    isFemale: row.gender === Gender.female,
    placeMText: placeTextOf(row.placeM),
    placeFText: placeTextOf(row.placeF),
    placeMMedalClass: placeMedalClassOf(row.placeM),
    placeFMedalClass: placeMedalClassOf(row.placeF),
    gapMText: row.gender === Gender.male ? gapText : EMPTY_CELL_TEXT,
    gapFText: row.gender === Gender.female ? gapText : EMPTY_CELL_TEXT,
    finishCountText: finishCount === undefined ? EMPTY_CELL_TEXT : String(finishCount),
    finishClubClass: finishClubClassOf(finishCount),
    club: row.club,
    noteBadges: toNoteBadges(row.note),
  };
}

/** Splits the stored note into tokens and classifies each into an icon badge (or running text). */
function toNoteBadges(note: string): PreviewNoteBadgeView[] {
  return splitNote(note).map((token) => {
    const kind = noteBadgeKindOf(token);

    return { kind, className: NOTE_BADGE_CLASSES[kind], text: token };
  });
}

function placeTextOf(place: number | null): string {
  return place === null ? EMPTY_CELL_TEXT : String(place);
}

function placeMedalClassOf(place: number | null): string {
  // A missing place looks up rank 0 — off the podium map, like any place past the bronze.
  return PLACE_MEDAL_CLASSES[place ?? 0] ?? EMPTY_CELL_TEXT;
}

/** The 5-вёрст-style finisher club of the count; below the first milestone the badge stays neutral. */
function finishClubClassOf(finishCount: number | undefined): string {
  if (finishCount === undefined) {
    return EMPTY_CELL_TEXT;
  }

  return FINISH_CLUB_TIERS.find((tier) => finishCount >= tier.min)?.className ?? EMPTY_CELL_TEXT;
}
