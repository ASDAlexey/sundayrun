import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { eventNumberForDate } from '../../../core/github/archive-index';
import { RaceEvent } from '../../../core/models/race-event.interface';
import { RACE_EVENT_DEFAULTS } from '../../../core/protocol/race-event-defaults.constant';
import { ProtocolStateService } from '../../../state/protocol-state.service';
import { EMPTY_DATE_ISO, MIN_EVENT_NUMBER } from './event-form.constant';

/** The race requisites form; every valid change is pushed to the store, invalid states leave it untouched. */
@Component({
  selector: 'app-event-form',
  imports: [ReactiveFormsModule],
  templateUrl: './event-form.html',
  styleUrl: './event-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventForm {
  readonly #store = inject(ProtocolStateService);

  readonly #fb = inject(NonNullableFormBuilder);

  readonly #dateIsoControl = this.#fb.control(this.#store.suggestedDateIso() ?? EMPTY_DATE_ISO, Validators.required);

  readonly #dateIso = toSignal(this.#dateIsoControl.valueChanges, { initialValue: this.#dateIsoControl.value });

  readonly form = this.#fb.group({
    number: new FormControl<number | null>(null, [Validators.required, Validators.min(MIN_EVENT_NUMBER)]),
    dateIso: this.#dateIsoControl,
    city: [RACE_EVENT_DEFAULTS.city, Validators.required],
    park: [RACE_EVENT_DEFAULTS.park, Validators.required],
    clubName: [RACE_EVENT_DEFAULTS.clubName, Validators.required],
    chairman: [RACE_EVENT_DEFAULTS.chairman, Validators.required],
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.#pushValidEvent());

    // Re-seeds the form whenever another draft of the batch becomes active; the draft's own
    // requisites (auto-filled or already confirmed) win over the blank defaults.
    effect(() => {
      this.#store.activeIndex();
      this.#seedFromActiveDraft();
    });

    // The race number is positional (see `eventNumberForDate`), so it is recomputed whenever the
    // date changes — never typed by hand. The date base includes the batch's other drafts: an
    // earlier sibling shifts the number exactly as an archived event would.
    effect(() => {
      const numberingDates = this.#store.activeNumberingDates();
      const dateIso = this.#dateIso();

      if (numberingDates === null || dateIso === EMPTY_DATE_ISO) {
        return;
      }

      const number = eventNumberForDate(numberingDates, dateIso);

      if (this.form.controls.number.value !== number) {
        this.form.controls.number.setValue(number);
      }
    });
  }

  /** Applies the active draft's known requisites to the controls; untracked — only the index switch re-seeds. */
  #seedFromActiveDraft(): void {
    const event = untracked(this.#store.event);
    const suggestedDateIso = untracked(this.#store.suggestedDateIso);

    if (event === null) {
      this.form.reset({ number: null, dateIso: suggestedDateIso ?? EMPTY_DATE_ISO, ...RACE_EVENT_DEFAULTS });

      return;
    }

    this.#applyEvent(event);
  }

  #applyEvent(event: RaceEvent): void {
    this.form.setValue({
      number: event.number,
      dateIso: event.dateIso,
      city: event.city,
      park: event.park,
      clubName: event.clubName,
      chairman: event.chairman,
    });
  }

  #pushValidEvent(): void {
    const { number, ...event } = this.form.getRawValue();

    if (number === null || this.form.invalid) {
      return;
    }

    // The legacy number belongs to already archived events; the db write restores it on re-publication.
    this.#store.setEvent({ ...event, number, legacyNumber: null });
  }
}
