import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { isValidEventSlug } from '../../core/github/event-slug';
import { formatRaceNumber } from '../../core/github/race-number';
import { EventResultsFile } from '../../core/github/results-file.interface';
import { normalizeAthleteKey } from '../../core/history/athlete-key';
import { createTransferLoader } from '../../core/transfer/transfer-load';
import { FIVE_KM_DISTANCE_KM } from '../../core/history/distance.constant';
import { finishCountsAt } from '../../core/history/finish-counts';
import { medianMsOrNull } from '../../core/history/median';
import { monthFinalSlugs } from '../../core/history/month-finals';
import { buildEventNotables } from '../../core/history/notables';
import { placeGapsMs } from '../../core/history/place-gaps';
import { NotableKind } from '../../core/history/notables.enum';
import { Notable } from '../../core/history/notables.interface';
import { splitNote } from '../../core/history/note-tokens';
import {
  FIRST_PARTICIPATION_TOKEN_PATTERN,
  LEGACY_PERSONAL_RECORD_TOKEN_PATTERN,
  PERSONAL_RECORD_TOKEN_PATTERN,
  YEAR_BEST_TOKEN_PATTERN,
} from '../../core/history/notes-builder.constant';
import { prNoteTimeWithDate, splitPrNote } from '../../core/history/pr-note';
import { buildPreviousBests } from '../../core/history/previous-bests';
import { PreviousBest } from '../../core/history/previous-bests.interface';
import { summarizeRace } from '../../core/history/race-summary';
import { pluralText } from '../../core/i18n/plural-text';
import { Gender, GenderType } from '../../core/models/gender.enum';
import { ProtocolRow } from '../../core/models/protocol-row.interface';
import { formatDuration } from '../../core/time/duration';
import { isoToday } from '../../core/time/iso-today';
import { formatRussianDateLong } from '../../core/time/russian-date';
import { EventWeather } from '../../core/weather/event-weather.interface';
import { weatherLineText } from '../../core/weather/weather-line';
import { AthletesService } from '../../github/athletes.service';
import { ResultsService } from '../../github/results.service';
import { ProtocolPdfService } from '../../pdf/protocol-pdf.service';
import { SelfAthleteService } from '../../state/self-athlete.service';
import { ReloadButton } from '../../shared/reload-button/reload-button';
import { ATHLETES_PAGE_LINK } from '../../app.constant';
import {
  EMPTY_CELL_TEXT,
  FEMALE_GENDER_TEXT,
  FINISH_CLUB_TIERS,
  GAP_TEXT_PREFIX,
  HOME_PAGE_LINK,
  KIDS_NOTE_TOKEN_PATTERN,
  MALE_GENDER_TEXT,
  NOTE_BADGE_CLASSES,
  RACE_PAGE_BASE_LINK,
  RACE_TABLE_COLUMNS,
  RACE_TRANSFER_KEY_PREFIX,
  SLUG_ROUTE_PARAM,
  STATUS_NOTE_TOKEN_PATTERN,
  SUMMARY_PART_SEPARATOR,
} from './race-page.constant';
import { RaceNoteBadgeKind, RaceNoteBadgeKindType, RaceStatus, RaceStatusType } from './race-page.enum';
import { RaceNoteBadgeView, RacePageState, RacePrNoteView, RaceRowView, RaceView } from './race-page.interface';

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
  readonly #athletes = inject(AthletesService);
  readonly #protocolPdf = inject(ProtocolPdfService);
  readonly #selfAthlete = inject(SelfAthleteService);

  /** The visitor's own row gets the highlight; empty when nobody is picked, so no row matches. */
  readonly selfKey = computed(() => this.#selfAthlete.self()?.key ?? '');

  readonly status = signal<RaceStatusType>(RaceStatus.loading);
  readonly race = signal<RaceView | null>(null);
  readonly pdfLoading = signal(false);
  readonly pdfFailed = signal(false);

  protected readonly statuses = RaceStatus;
  protected readonly noteKinds = RaceNoteBadgeKind;
  protected readonly homeLink = HOME_PAGE_LINK;
  protected readonly tableColumns = RACE_TABLE_COLUMNS;

  #slug = '';

  constructor() {
    // The loader is captured once here; each navigation runs its own slug-keyed transfer load.
    const load = createTransferLoader();

    // Same-route navigation reuses the component instance, so the slug is tracked reactively.
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const slug = params.get(SLUG_ROUTE_PARAM) ?? '';

        this.#slug = slug;
        this.status.set(RaceStatus.loading);
        this.race.set(null);
        // Prerender bakes this slug's protocol under `race.view.<slug>`; the browser trusts it
        // (`trustBaked`) and skips the four reads a direct load used to make. A client-side
        // navigation to a non-prerendered-in-this-session slug finds nothing baked and loads live.
        load({
          key: `${RACE_TRANSFER_KEY_PREFIX}${slug}`,
          load: () => this.#resolveState(slug),
          apply: (state) => this.#applyState(slug, state),
          onError: () => this.#applyState(slug, { status: RaceStatus.error, race: null }),
          trustBaked: true,
        });
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

  /** A newer navigation may have taken over while the results were loading, so the slug is rechecked. */
  #applyState(slug: string, state: RacePageState): void {
    if (slug !== this.#slug) {
      return;
    }

    this.race.set(state.race);
    this.status.set(state.status);
  }

  /** A malformed slug never reaches the CDN; a missing file and a malformed one map to notFound. */
  async #resolveState(slug: string): Promise<RacePageState> {
    if (!isValidEventSlug(slug)) {
      return { status: RaceStatus.notFound, race: null };
    }

    try {
      const [file, participantRuns, eventSlugs, weather] = await Promise.all([
        this.#results.loadResults(slug),
        // The notables, the month-final mark and the weather are garnish: a failed read still renders the protocol.
        this.#results.loadParticipantRuns(slug).catch(() => []),
        this.#athletes.loadEventSlugs().catch(() => []),
        this.#results.loadWeather(slug).catch(() => null),
      ]);

      if (file === null) {
        return { status: RaceStatus.notFound, race: null };
      }

      return {
        status: RaceStatus.ready,
        race: toRaceView(
          file,
          buildEventNotables(participantRuns, slug, file.event.dateIso),
          finishCountsAt(participantRuns, file.event.dateIso),
          buildPreviousBests(participantRuns, file.event.dateIso),
          monthFinalSlugs(eventSlugs, isoToday()).has(slug),
          weather,
        ),
      };
    } catch {
      return { status: RaceStatus.error, race: null };
    }
  }
}

function toRaceView(
  file: EventResultsFile,
  notables: Record<string, Notable>,
  finishCounts: Record<string, number>,
  previousBests: Record<string, PreviousBest>,
  isMonthFinal: boolean,
  weather: EventWeather | null,
): RaceView {
  return {
    number: formatRaceNumber(file.event.number, file.event.legacyNumber),
    dateLong: formatRussianDateLong(file.event.dateIso),
    city: file.event.city,
    park: file.event.park,
    participantCount: file.rows.length,
    summaryText: summaryTextOf(file.rows),
    medianTimeM: medianTimeTextOf(file.rows, Gender.male),
    medianTimeF: medianTimeTextOf(file.rows, Gender.female),
    weatherText: weatherLineText(weather),
    isMonthFinal,
    // i18n attributes with interpolation are dropped by the compiler, so the label is localized here.
    pdfAriaLabel: $localize`:@@race.pdfAriaLabel:Протокол пробега № ${file.event.number}:number: (PDF)`,
    rows: toRowViews(file.rows, notables, finishCounts, previousBests),
  };
}

/** The Smashrun-style gaps are scanned over the whole protocol before the per-row mapping. */
function toRowViews(
  rows: ProtocolRow[],
  notables: Record<string, Notable>,
  finishCounts: Record<string, number>,
  previousBests: Record<string, PreviousBest>,
): RaceRowView[] {
  const gapsMs = placeGapsMs(rows);

  return rows.map((row, index) => toRowView(row, notables, finishCounts, previousBests, gapsMs[index]));
}

function toRowView(
  row: ProtocolRow,
  notables: Record<string, Notable>,
  finishCounts: Record<string, number>,
  previousBests: Record<string, PreviousBest>,
  gapMs: number | null,
): RaceRowView {
  const athleteKey = normalizeAthleteKey(row.fullName);
  const finishCount = finishCounts[athleteKey];
  const gapText = gapMs === null ? EMPTY_CELL_TEXT : GAP_TEXT_PREFIX + formatDuration(gapMs);

  return {
    index: row.index,
    fullName: row.fullName,
    athleteKey,
    athleteLink: [ATHLETES_PAGE_LINK, athleteKey],
    // i18n attributes with interpolation are dropped by the compiler, so the label is localized here.
    athleteAriaLabel: $localize`:@@race.athleteAriaLabel:История атлета ${row.fullName}:fullName:`,
    time23: row.time23,
    time5: row.time5,
    paceText: paceTextOf(row.totalMs, row.distanceKm),
    genderText: genderTextOf(row.gender),
    placeMText: placeTextOf(row.placeM),
    placeFText: placeTextOf(row.placeF),
    gapMText: row.gender === Gender.male ? gapText : EMPTY_CELL_TEXT,
    gapFText: row.gender === Gender.female ? gapText : EMPTY_CELL_TEXT,
    finishCountText: finishCount === undefined ? EMPTY_CELL_TEXT : String(finishCount),
    finishClubClass: finishClubClassOf(finishCount),
    club: row.club,
    noteBadges: toNoteBadges(row.note, previousBests[athleteKey]),
    notableText: toNotableText(notables[athleteKey]),
  };
}

/** Splits the stored note into tokens and classifies each into an icon badge (or running text). */
function toNoteBadges(note: string, previousBest: PreviousBest | undefined): RaceNoteBadgeView[] {
  return splitNote(note).map((token) => {
    const kind = noteBadgeKindOf(token);

    return {
      kind,
      className: NOTE_BADGE_CLASSES[kind],
      text: token,
      prNote: kind === RaceNoteBadgeKind.record ? toPrNoteView(token, previousBest) : null,
    };
  });
}

/** Recognizes the auto-note tokens plus the organiser-written kids and DNF/DSQ marks. */
function noteBadgeKindOf(token: string): RaceNoteBadgeKindType {
  if (PERSONAL_RECORD_TOKEN_PATTERN.test(token) || LEGACY_PERSONAL_RECORD_TOKEN_PATTERN.test(token)) {
    return RaceNoteBadgeKind.record;
  }

  if (YEAR_BEST_TOKEN_PATTERN.test(token)) {
    return RaceNoteBadgeKind.yearBest;
  }

  if (FIRST_PARTICIPATION_TOKEN_PATTERN.test(token)) {
    return RaceNoteBadgeKind.debut;
  }

  if (KIDS_NOTE_TOKEN_PATTERN.test(token)) {
    return RaceNoteBadgeKind.kids;
  }

  if (STATUS_NOTE_TOKEN_PATTERN.test(token)) {
    return RaceNoteBadgeKind.status;
  }

  return RaceNoteBadgeKind.plain;
}

/**
 * The «ЛР (было X)» note with the previous record dated and linked to the race where it was set;
 * null (no record token, or no known previous run) renders the stored note as plain text.
 */
function toPrNoteView(note: string, previousBest: PreviousBest | undefined): RacePrNoteView | null {
  const parts = splitPrNote(note);

  if (parts === null || previousBest === undefined) {
    return null;
  }

  return {
    before: parts.before,
    label: prNoteTimeWithDate(parts.time, previousBest),
    link: [RACE_PAGE_BASE_LINK, previousBest.slug],
    after: parts.after,
  };
}

/** The 5-вёрст-style finisher club of the count; below the first milestone the badge stays neutral. */
function finishClubClassOf(finishCount: number | undefined): string {
  if (finishCount === undefined) {
    return '';
  }

  return FINISH_CLUB_TIERS.find((tier) => finishCount >= tier.min)?.className ?? '';
}

/**
 * The Smashrun-style chip next to the stored note. The window length is fixed in the message —
 * it mirrors `NOTABLE_WINDOW_MONTHS`, which the builder applies.
 */
function toNotableText(notable: Notable | undefined): string {
  if (notable === undefined) {
    return '';
  }

  if (notable.kind === NotableKind.allTimeRank) {
    return $localize`:@@race.notableAllTimeRank:${notable.rank}:rank:-й результат за всё время`;
  }

  return $localize`:@@race.notableWindowBest:Лучший результат за 6 месяцев`;
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
