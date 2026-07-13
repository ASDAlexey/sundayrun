import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { Gender, GenderConfidence } from '../../../core/models/gender.enum';
import { Participant } from '../../../core/models/participant.interface';
import { FIVE_KM_TEXT, TWO_THREE_KM_TEXT } from '../../../shared/distance-label.constant';
import { FormatDurationPipe } from '../../../shared/pipes/format-duration.pipe';
import { ProtocolStateService } from '../../../state/protocol-state.service';
import {
  DNF_TEXT,
  FULL_DISTANCE_LAPS,
  LAP_1_INDEX,
  LAP_2_INDEX,
  NO_DISTANCE_TEXT,
  NO_LAP_TEXT,
  NO_NOTE_TEXT,
  SHORT_DISTANCE_LAPS,
} from './participants-table.constant';
import { ParticipantRowView } from './participants-table.interface';

/**
 * The imported participants list: gender is editable, the note column is a read-only
 * preview of the auto-generated text (ЛР, первое участие…) exactly as the protocol will show it.
 */
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

  #toRowView(participant: Participant): ParticipantRowView {
    return {
      participant,
      timeText: participant.totalMs === null ? DNF_TEXT : this.#formatDuration.transform(participant.totalMs),
      lap1Text: this.#lapText(participant.lapsMs, LAP_1_INDEX),
      lap2Text: this.#lapText(participant.lapsMs, LAP_2_INDEX),
      distanceText: distanceTextOf(participant.lapsMs.length),
      unverified: participant.genderConfidence !== GenderConfidence.high,
      isMale: participant.gender === Gender.male,
      isFemale: participant.gender === Gender.female,
      noteText: participant.note === '' ? NO_NOTE_TEXT : participant.note,
    };
  }

  #lapText(lapsMs: (number | null)[], index: number): string {
    const lapMs = lapsMs[index] ?? null;

    return lapMs === null ? NO_LAP_TEXT : this.#formatDuration.transform(lapMs);
  }
}

/** 2 laps → the full 5 km, 1 lap → the short 2.3 km, none → no distance at all. */
function distanceTextOf(laps: number): string {
  if (laps >= FULL_DISTANCE_LAPS) {
    return FIVE_KM_TEXT;
  }

  return laps === SHORT_DISTANCE_LAPS ? TWO_THREE_KM_TEXT : NO_DISTANCE_TEXT;
}
