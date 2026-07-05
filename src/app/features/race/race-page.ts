import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { eventFilePaths } from '../../core/github/event-paths';
import { isValidEventSlug } from '../../core/github/event-slug';
import { jsDelivrFileUrl } from '../../core/github/jsdelivr';
import { EventResultsFile } from '../../core/github/results-file.interface';
import { normalizeAthleteKey } from '../../core/history/athlete-key';
import { Gender, GenderType } from '../../core/models/gender.enum';
import { ProtocolRow } from '../../core/models/protocol-row.interface';
import { formatRussianDateLong } from '../../core/time/russian-date';
import { ResultsService } from '../../github/results.service';
import { ATHLETES_PAGE_LINK } from '../../app.constant';
import { EMPTY_CELL_TEXT, FEMALE_GENDER_TEXT, HOME_PAGE_LINK, MALE_GENDER_TEXT, SLUG_ROUTE_PARAM } from './race-page.constant';
import { RaceStatus, RaceStatusType } from './race-page.enum';
import { RacePageState, RaceRowView, RaceView } from './race-page.interface';

/** The online protocol of one published race, mirroring the PDF table; rows link to athlete pages. */
@Component({
  selector: 'app-race-page',
  imports: [RouterLink],
  templateUrl: './race-page.html',
  styleUrl: './race-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RacePage {
  readonly #results = inject(ResultsService);

  readonly status = signal<RaceStatusType>(RaceStatus.loading);
  readonly race = signal<RaceView | null>(null);

  protected readonly statuses = RaceStatus;
  protected readonly homeLink = HOME_PAGE_LINK;

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

      return { status: RaceStatus.ready, race: toRaceView(slug, file) };
    } catch {
      return { status: RaceStatus.error, race: null };
    }
  }
}

function toRaceView(slug: string, file: EventResultsFile): RaceView {
  return {
    number: file.event.number,
    dateLong: formatRussianDateLong(file.event.dateIso),
    city: file.event.city,
    park: file.event.park,
    participantCount: file.rows.length,
    pdfUrl: jsDelivrFileUrl(eventFilePaths(slug).protocolPdf),
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
    genderText: genderTextOf(row.gender),
    placeMText: placeTextOf(row.placeM),
    placeFText: placeTextOf(row.placeF),
    club: row.club,
    note: row.note,
  };
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
