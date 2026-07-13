import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { eventNumberForDate } from '../../../core/github/archive-index';
import { ProtocolStateService } from '../../../state/protocol-state.service';
import { RACE_EVENT_DEFAULTS } from '../race-event-defaults.constant';
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

    // The race number is positional (see `eventNumberForDate`), so it is recomputed from the
    // published archive whenever the date changes — never typed by hand.
    effect(() => {
      const publishedDates = this.#store.publishedEventDates();
      const dateIso = this.#dateIso();

      if (publishedDates === null || dateIso === EMPTY_DATE_ISO) {
        return;
      }

      const number = eventNumberForDate(publishedDates, dateIso);

      if (this.form.controls.number.value !== number) {
        this.form.controls.number.setValue(number);
      }
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
