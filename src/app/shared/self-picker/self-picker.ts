import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { suggestAthletes } from '../../core/history/athlete-suggest';
import { AthleteRecord } from '../../core/models/athlete-history.interface';
import { AthletesService } from '../../github/athletes.service';
import { SelfAthleteService } from '../../state/self-athlete.service';
import { ATHLETES_PAGE_LINK } from '../../app.constant';
import { SELF_SUGGESTION_LIMIT } from './self-picker.constant';
import { SelfPickerStatus, SelfPickerStatusType } from './self-picker.enum';

/**
 * The header «Выбери себя» control. Without a pick it is a button opening a name-search
 * dropdown; with one it turns into a link to the visitor's own athlete page plus a reset.
 * The athlete directory loads lazily on the first open — most visits never pay for it.
 */
@Component({
  selector: 'app-self-picker',
  imports: [RouterLink],
  templateUrl: './self-picker.html',
  styleUrl: './self-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelfPicker {
  readonly #selfAthlete = inject(SelfAthleteService);
  readonly #athletes = inject(AthletesService);
  readonly #options = signal<AthleteRecord[]>([]);

  readonly open = signal(false);
  readonly status = signal<SelfPickerStatusType>(SelfPickerStatus.idle);
  readonly query = signal('');
  readonly self = this.#selfAthlete.self;
  readonly selfLink = computed(() => {
    const self = this.self();

    return self === null ? null : [ATHLETES_PAGE_LINK, self.key];
  });

  readonly suggestions = computed(() => suggestAthletes(this.#options(), this.query(), [], SELF_SUGGESTION_LIMIT));

  protected readonly statuses = SelfPickerStatus;

  toggle(): void {
    const opening = !this.open();

    this.open.set(opening);
    this.query.set('');

    if (opening && this.status() !== SelfPickerStatus.ready) {
      void this.#loadOptions();
    }
  }

  close(): void {
    this.open.set(false);
    this.query.set('');
  }

  onQueryChange(query: string): void {
    this.query.set(query);
  }

  pick(option: AthleteRecord): void {
    this.#selfAthlete.save({ key: option.key, displayName: option.displayName });
    this.close();
  }

  clear(): void {
    this.#selfAthlete.clear();
  }

  async #loadOptions(): Promise<void> {
    this.status.set(SelfPickerStatus.loading);

    try {
      this.#options.set(await this.#athletes.loadRecords());
      this.status.set(SelfPickerStatus.ready);
    } catch {
      this.status.set(SelfPickerStatus.error);
    }
  }
}
