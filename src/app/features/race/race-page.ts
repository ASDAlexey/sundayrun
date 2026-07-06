import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { eventFilePaths } from '../../core/github/event-paths';
import { isValidEventSlug } from '../../core/github/event-slug';
import { jsDelivrFileUrl } from '../../core/github/jsdelivr';
import { EventResultsFile } from '../../core/github/results-file.interface';
import { normalizeAthleteKey } from '../../core/history/athlete-key';
import { FIVE_KM_DISTANCE_KM } from '../../core/history/distance.constant';
import { Gender, GenderType } from '../../core/models/gender.enum';
import { ProtocolRow } from '../../core/models/protocol-row.interface';
import { formatDuration } from '../../core/time/duration';
import { formatRussianDateLong } from '../../core/time/russian-date';
import { CdnRefService } from '../../github/cdn-ref.service';
import { ResultsService } from '../../github/results.service';
import { ATHLETES_PAGE_LINK } from '../../app.constant';
import {
  EMPTY_CELL_TEXT,
  FEMALE_GENDER_TEXT,
  HOME_PAGE_LINK,
  MALE_GENDER_TEXT,
  RACE_TABLE_COLUMNS,
  SLUG_ROUTE_PARAM,
} from './race-page.constant';
import { RaceStatus, RaceStatusType } from './race-page.enum';
import { RacePageState, RaceRowView, RaceView } from './race-page.interface';

/** The online protocol of one published race, mirroring the PDF table; rows link to athlete pages. */
@Component({
  selector: 'app-race-page',
  imports: [MatButtonModule, MatProgressSpinnerModule, MatTableModule, RouterLink],
  templateUrl: './race-page.html',
  styleUrl: './race-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RacePage {
  readonly #cdnRef = inject(CdnRefService);
  readonly #results = inject(ResultsService);

  readonly status = signal<RaceStatusType>(RaceStatus.loading);
  readonly race = signal<RaceView | null>(null);

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

      return { status: RaceStatus.ready, race: toRaceView(slug, file, await this.#cdnRef.resolve()) };
    } catch {
      return { status: RaceStatus.error, race: null };
    }
  }
}

function toRaceView(slug: string, file: EventResultsFile, ref: string): RaceView {
  return {
    number: file.event.number,
    dateLong: formatRussianDateLong(file.event.dateIso),
    city: file.event.city,
    park: file.event.park,
    participantCount: file.rows.length,
    avgTimeM: avgTimeTextOf(file.rows, Gender.male),
    avgTimeF: avgTimeTextOf(file.rows, Gender.female),
    pdfUrl: jsDelivrFileUrl(eventFilePaths(slug).protocolPdf, ref),
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

/** Average of the 5 km times for one gender; one-lap runners and DNF are excluded, null when nobody qualifies. */
function avgTimeTextOf(rows: ProtocolRow[], gender: GenderType): string | null {
  const times = rows.reduce<number[]>((acc, row) => {
    if (row.gender === gender && row.distanceKm === FIVE_KM_DISTANCE_KM && row.totalMs !== null) {
      acc.push(row.totalMs);
    }

    return acc;
  }, []);

  if (times.length === 0) {
    return null;
  }

  return formatDuration(times.reduce((sum, ms) => sum + ms, 0) / times.length);
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
