import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { Gender, GenderConfidence } from '../../../core/models/gender.enum';
import { Participant } from '../../../core/models/participant.interface';
import { FIVE_KM_TEXT, TWO_THREE_KM_TEXT } from '../../../shared/distance-label.constant';
import { FormatDurationPipe } from '../../../shared/pipes/format-duration.pipe';
import { ProtocolStateService } from '../../../state/protocol-state.service';
import { DNF_TEXT, FULL_DISTANCE_LAPS, NO_DISTANCE_TEXT, SHORT_DISTANCE_LAPS } from './participants-table.constant';
import { ParticipantRowView } from './participants-table.interface';

/** Editable list of imported participants: gender toggles and per-athlete notes. */
@Component({
  selector: 'app-participants-table',
  templateUrl: './participants-table.html',
  styleUrl: './participants-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantsTable {
  readonly #store = inject(ProtocolStateService);
  readonly #formatDuration = new FormatDurationPipe();

  readonly rows = computed(() => this.#store.participants().map((participant) => this.#toRowView(participant)));

  setMale(id: number): void {
    this.#store.setGender(id, Gender.male);
  }

  setFemale(id: number): void {
    this.#store.setGender(id, Gender.female);
  }

  onNoteChange(id: number, note: string): void {
    this.#store.setNote(id, note);
  }

  #toRowView(participant: Participant): ParticipantRowView {
    return {
      participant,
      timeText: participant.totalMs === null ? DNF_TEXT : this.#formatDuration.transform(participant.totalMs),
      distanceText: distanceTextOf(participant.lapsMs.length),
      unverified: participant.genderConfidence !== GenderConfidence.high,
      isMale: participant.gender === Gender.male,
      isFemale: participant.gender === Gender.female,
      // i18n attributes with interpolation are dropped by the compiler, so the label is localized here.
      noteAriaLabel: $localize`:@@preview.table.noteAriaLabel:Примечание: ${participant.fullName}:fullName:`,
    };
  }
}

/** 2 laps → the full 5 km, 1 lap → the short 2.3 km, none → no distance at all. */
function distanceTextOf(laps: number): string {
  if (laps >= FULL_DISTANCE_LAPS) {
    return FIVE_KM_TEXT;
  }

  return laps === SHORT_DISTANCE_LAPS ? TWO_THREE_KM_TEXT : NO_DISTANCE_TEXT;
}
