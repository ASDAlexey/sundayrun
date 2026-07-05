import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ProtocolStateService } from '../../../state/protocol-state.service';
import { RACE_EVENT_DEFAULTS } from '../race-event-defaults.constant';
import { EMPTY_DATE_ISO, INTEGER_ERROR, MIN_EVENT_NUMBER } from './event-form.constant';

/** The race requisites form; every valid change is pushed to the store, invalid states leave it untouched. */
@Component({
  selector: 'app-event-form',
  imports: [MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './event-form.html',
  styleUrl: './event-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventForm {
  readonly #store = inject(ProtocolStateService);

  readonly form = inject(NonNullableFormBuilder).group({
    number: new FormControl<number | null>(null, [Validators.required, Validators.min(MIN_EVENT_NUMBER), integerValidator]),
    dateIso: [this.#store.suggestedDateIso() ?? EMPTY_DATE_ISO, Validators.required],
    city: [RACE_EVENT_DEFAULTS.city, Validators.required],
    park: [RACE_EVENT_DEFAULTS.park, Validators.required],
    clubName: [RACE_EVENT_DEFAULTS.clubName, Validators.required],
    chairman: [RACE_EVENT_DEFAULTS.chairman, Validators.required],
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.#pushValidEvent());
  }

  #pushValidEvent(): void {
    const { number, ...event } = this.form.getRawValue();

    if (number === null || this.form.invalid) {
      return;
    }

    this.#store.setEvent({ ...event, number });
  }
}

/** Rejects fractional race numbers; emptiness is left to the required validator. */
function integerValidator(control: AbstractControl<number | null>): ValidationErrors | null {
  return control.value === null || Number.isInteger(control.value) ? null : INTEGER_ERROR;
}
