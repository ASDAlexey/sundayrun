import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { isValidEventSlug } from '../../core/github/event-slug';
import { formatRaceNumber } from '../../core/github/race-number';
import { EventResultsFile } from '../../core/github/results-file.interface';
import { normalizeAthleteKey } from '../../core/history/athlete-key';
import { FIVE_KM_DISTANCE_KM } from '../../core/history/distance.constant';
import { medianMsOrNull } from '../../core/history/median';
import { summarizeRace } from '../../core/history/race-summary';
import { pluralText } from '../../core/i18n/plural-text';
import { Gender, GenderType } from '../../core/models/gender.enum';
import { ProtocolRow } from '../../core/models/protocol-row.interface';
import { formatDuration } from '../../core/time/duration';
import { formatRussianDateLong } from '../../core/time/russian-date';
import { ResultsService } from '../../github/results.service';
import { ProtocolPdfService } from '../../pdf/protocol-pdf.service';
import { ReloadButton } from '../../shared/reload-button/reload-button';
import { ATHLETES_PAGE_LINK } from '../../app.constant';
import {
  EMPTY_CELL_TEXT,
  FEMALE_GENDER_TEXT,
  HOME_PAGE_LINK,
  MALE_GENDER_TEXT,
  RACE_TABLE_COLUMNS,
  SLUG_ROUTE_PARAM,
  SUMMARY_PART_SEPARATOR,
} from './race-page.constant';
import { RaceStatus, RaceStatusType } from './race-page.enum';
import { RacePageState, RaceRowView, RaceView } from './race-page.interface';

/** The online protocol of one published race, mirroring the PDF table; rows link to athlete pages. */
@Component({
  selector: 'app-race-page',
  imports: [MatButtonModule, MatProgressSpinnerModule, MatTableModule, ReloadButton, RouterLink],
  templateUrl: './race-page.html',
  styleUrl: './race-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RacePage {
  readonly #results = inject(ResultsService);
  readonly #protocolPdf = inject(ProtocolPdfService);

  readonly status = signal<RaceStatusType>(RaceStatus.loading);
  readonly race = signal<RaceView | null>(null);
  readonly pdfLoading = signal(false);
  readonly pdfFailed = signal(false);

  protected readonly statuses = RaceStatus;
  protected readonly homeLink = HOME_PAGE_LINK;
  protected readonly tableColumns = RACE_TABLE_COLUMNS;

  #slug = '';

  constructor() {
    // Same-route navigation reuses the component instance, so the slug is tracked reactively.
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        this.#slug = params.get(SLUG_ROUTE_PARAM) ?? '';
        void this.#load(this.#slug);
      });
  }

  /** Generates the protocol PDF from the loaded data and downloads it, spinning the button meanwhile. */
  async downloadPdf(): Promise<void> {
    if (this.pdfLoading()) {
      return;
    }

    this.pdfLoading.set(true);
    this.pdfFailed.set(false);

    try {
      await this.#protocolPdf.download(this.#slug);
    } catch {
      this.pdfFailed.set(true);
    } finally {
      this.pdfLoading.set(false);
    }
  }

  async #load(slug: string): Promise<void> {
    this.status.set(RaceStatus.loading);
    this.race.set(null);

    const next = await this.#resolveState(slug);

    // A newer navigation may have taken over while the results were loading.
    if (slug !== this.#slug) {
      return;
    }

    this.race.set(next.race);
    this.status.set(next.status);
  }

  /** A malformed slug never reaches the CDN; a missing file and a malformed one map to notFound. */
  async #resolveState(slug: string): Promise<RacePageState> {
    if (!isValidEventSlug(slug)) {
      return { status: RaceStatus.notFound, race: null };
    }

    try {
      const file = await this.#results.loadResults(slug);

      if (file === null) {
        return { status: RaceStatus.notFound, race: null };
      }

      return { status: RaceStatus.ready, race: toRaceView(file) };
    } catch {
      return { status: RaceStatus.error, race: null };
    }
  }
}

function toRaceView(file: EventResultsFile): RaceView {
  return {
    number: formatRaceNumber(file.event.number, file.event.legacyNumber),
    dateLong: formatRussianDateLong(file.event.dateIso),
    city: file.event.city,
    park: file.event.park,
    participantCount: file.rows.length,
    summaryText: summaryTextOf(file.rows),
    medianTimeM: medianTimeTextOf(file.rows, Gender.male),
    medianTimeF: medianTimeTextOf(file.rows, Gender.female),
    // i18n attributes with interpolation are dropped by the compiler, so the label is localized here.
    pdfAriaLabel: $localize`:@@race.pdfAriaLabel:Протокол пробега № ${file.event.number}:number: (PDF)`,
    rows: file.rows.map(toRowView),
  };
}

function toRowView(row: ProtocolRow): RaceRowView {
  return {
    index: row.index,
    fullName: row.fullName,
    athleteLink: [ATHLETES_PAGE_LINK, normalizeAthleteKey(row.fullName)],
    // i18n attributes with interpolation are dropped by the compiler, so the label is localized here.
    athleteAriaLabel: $localize`:@@race.athleteAriaLabel:История атлета ${row.fullName}:fullName:`,
    time23: row.time23,
    time5: row.time5,
    paceText: paceTextOf(row.totalMs, row.distanceKm),
    genderText: genderTextOf(row.gender),
    placeMText: placeTextOf(row.placeM),
    placeFText: placeTextOf(row.placeF),
    club: row.club,
    note: row.note,
  };
}

/**
 * «8 финишёров, 2 новичка, 3 личных рекорда» — the parkrun-style line over the table, aggregated
 * from the auto notes stored on the rows. Each plural form is a separate translatable message,
 * like the year counts on the races page; ru only ever selects one/few/many, the rest alias.
 */
function summaryTextOf(rows: ProtocolRow[]): string {
  const { finisherCount, newcomerCount, personalRecordCount } = summarizeRace(rows);

  return [
    pluralText(finisherCount, {
      one: $localize`:@@race.summaryFinishersOne:${finisherCount}:count: финишёр`,
      few: $localize`:@@race.summaryFinishersFew:${finisherCount}:count: финишёра`,
      many: $localize`:@@race.summaryFinishersMany:${finisherCount}:count: финишёров`,
    }),
    pluralText(newcomerCount, {
      one: $localize`:@@race.summaryNewcomersOne:${newcomerCount}:count: новичок`,
      few: $localize`:@@race.summaryNewcomersFew:${newcomerCount}:count: новичка`,
      many: $localize`:@@race.summaryNewcomersMany:${newcomerCount}:count: новичков`,
    }),
    pluralText(personalRecordCount, {
      one: $localize`:@@race.summaryRecordsOne:${personalRecordCount}:count: личный рекорд`,
      few: $localize`:@@race.summaryRecordsFew:${personalRecordCount}:count: личных рекорда`,
      many: $localize`:@@race.summaryRecordsMany:${personalRecordCount}:count: личных рекордов`,
    }),
  ].join(SUMMARY_PART_SEPARATOR);
}

/** Median of the 5 km times for one gender; one-lap runners and DNF are excluded, null when nobody qualifies. */
function medianTimeTextOf(rows: ProtocolRow[], gender: GenderType): string | null {
  const times = rows.reduce<number[]>((acc, row) => {
    if (row.gender === gender && row.distanceKm === FIVE_KM_DISTANCE_KM && row.totalMs !== null) {
      acc.push(row.totalMs);
    }

    return acc;
  }, []);
  const medianTimeMs = medianMsOrNull(times);

  return medianTimeMs === null ? null : formatDuration(medianTimeMs);
}

/** Average pace over the covered distance (5 or 2.3 km), min/km; DNF rows stay blank. */
function paceTextOf(totalMs: number | null, distanceKm: number | null): string {
  if (totalMs === null || distanceKm === null) {
    return EMPTY_CELL_TEXT;
  }

  return formatDuration(totalMs / distanceKm);
}

function genderTextOf(gender: GenderType | null): string {
  if (gender === null) {
    return EMPTY_CELL_TEXT;
  }

  return gender === Gender.male ? MALE_GENDER_TEXT : FEMALE_GENDER_TEXT;
}

function placeTextOf(place: number | null): string {
  return place === null ? EMPTY_CELL_TEXT : String(place);
}
