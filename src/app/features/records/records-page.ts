import { ScrollingModule } from '@angular/cdk/scrolling';
import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ATHLETES_PAGE_LINK } from '../../app.constant';
import { normalizeAthleteKey } from '../../core/history/athlete-key';
import { bestResults, bestResultYears } from '../../core/history/best-results';
import { BestResult } from '../../core/history/best-results.interface';
import { AthleteRecord } from '../../core/models/athlete-history.interface';
import { Gender, GenderType } from '../../core/models/gender.enum';
import { formatDuration } from '../../core/time/duration';
import { formatRussianDateShort } from '../../core/time/russian-date';
import { AthletesService } from '../../github/athletes.service';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { ALL_YEARS_VALUE } from '../races/races-page.constant';
import { RECORDS_ROW_HEIGHT_PX } from './records-page.constant';
import { RecordsStatus, RecordsStatusType } from './records-page.enum';
import { BestResultView } from './records-page.interface';

/** Full 5 km leaderboards with a name search, season and gender filters, and virtual scroll. */
@Component({
  selector: 'app-records-page',
  imports: [RouterLink, ScrollingModule],
  templateUrl: './records-page.html',
  styleUrl: './records-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordsPage {
  readonly #athletes = inject(AthletesService);
  readonly #records = signal<AthleteRecord[]>([]);
  // The lambdas run lazily, so referencing the filter signals declared below is safe.
  readonly #menBoard = computed(() => toBoard(this.#records(), Gender.male, this.year()));
  readonly #womenBoard = computed(() => toBoard(this.#records(), Gender.female, this.year()));

  readonly status = signal<RecordsStatusType>(RecordsStatus.loading);
  readonly query = signal('');
  readonly year = signal<string | null>(null);
  readonly gender = signal<GenderType | null>(null);

  readonly years = computed(() => bestResultYears(this.#records()));
  readonly men = computed(() => searchRows(this.#menBoard(), this.query()));
  readonly women = computed(() => searchRows(this.#womenBoard(), this.query()));
  /** Board sizes ignore the search box: the badge always shows how many athletes the board ranks. */
  readonly menCount = computed(() => this.#menBoard().length);
  readonly womenCount = computed(() => this.#womenBoard().length);
  readonly showMen = computed(() => this.gender() !== Gender.female);
  readonly showWomen = computed(() => this.gender() !== Gender.male);
  readonly noMatches = computed(() => (!this.showMen() || this.men().length === 0) && (!this.showWomen() || this.women().length === 0));

  protected readonly statuses = RecordsStatus;
  protected readonly genders = Gender;
  protected readonly allYearsValue = ALL_YEARS_VALUE;
  protected readonly rowHeightPx = RECORDS_ROW_HEIGHT_PX;

  constructor() {
    // Prerender bakes the calm loading state into static HTML; live data arrives after hydration.
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void this.#load();
    }
  }

  onQueryChange(query: string): void {
    this.query.set(query);
  }

  onYearChange(value: string): void {
    this.year.set(value === ALL_YEARS_VALUE ? null : value);
  }

  setGender(gender: GenderType | null): void {
    this.gender.set(gender);
  }

  async #load(): Promise<void> {
    try {
      const records = Object.values(await this.#athletes.loadHistory());

      this.#records.set(records);
      this.status.set(records.length === 0 ? RecordsStatus.empty : RecordsStatus.ready);
    } catch {
      this.status.set(RecordsStatus.error);
    }
  }
}

/** The ranked board for one gender and season, prepared for the template. */
function toBoard(records: AthleteRecord[], gender: GenderType, year: string | null): BestResultView[] {
  return bestResults(records, gender, year).map(toView);
}

/** Name search keeps each row's place from the full board, so a found athlete shows their real rank. */
function searchRows(rows: BestResultView[], query: string): BestResultView[] {
  const normalizedQuery = normalizeAthleteKey(query);

  if (normalizedQuery === '') {
    return rows;
  }

  return rows.filter((row) => row.key.includes(normalizedQuery));
}

function toView(result: BestResult, index: number): BestResultView {
  return {
    place: index + 1,
    key: result.key,
    athleteLink: [ATHLETES_PAGE_LINK, result.key],
    displayName: result.displayName,
    timeText: formatDuration(result.bestMs),
    dateShort: formatRussianDateShort(result.dateIso),
    raceLink: [RACE_PAGE_BASE_LINK, result.slug],
  };
}
