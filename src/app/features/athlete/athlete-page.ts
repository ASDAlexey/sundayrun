import { ScrollingModule } from '@angular/cdk/scrolling';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { normalizeAthleteKey } from '../../core/history/athlete-key';
import { AthleteFirstLap } from '../../core/history/first-lap.interface';
import { genderFinisherCount } from '../../core/history/gender-finishers';
import { EventGenderFinishers } from '../../core/history/gender-finishers.interface';
import { currentCourseRecordEntries } from '../../core/history/course-records';
import { EMPTY_COURSE_RECORD_HISTORY } from '../../core/history/course-records.constant';
import { legendBoard, legendProgress } from '../../core/history/legend';
import { LEGEND_WINDOW_DAYS } from '../../core/history/legend.constant';
import { newestEventIso } from '../../core/history/runner-scores';
import { LegendProgress } from '../../core/history/legend.interface';
import { isoYear } from '../../core/history/iso-year';
import { athleteStreaks } from '../../core/history/streaks';
import { AthleteStreaks } from '../../core/history/streaks.interface';
import { athleteYearActivity, athleteYearBadges } from '../../core/history/year-badges';
import { YearBadge, YearBadgeType } from '../../core/history/year-badges.enum';
import { EventWeatherRow } from '../../core/history/weather-records.interface';
import { athleteSeasonRankBadges } from '../../core/history/season-ranks';
import { athleteYearRankBadges } from '../../core/history/year-ranks';
import { distinctRunYears, filterRuns, sortRuns, yearBestEntries } from '../../core/history/athlete-runs';
import { RunsSort } from '../../core/history/athlete-runs.enum';
import { YearBestEntry } from '../../core/history/athlete-runs.interface';
import { FIVE_KM_DISTANCE_KM } from '../../core/history/distance.constant';
import { memeStandings } from '../../core/history/meme-thresholds';
import { MEME_THRESHOLDS } from '../../core/history/meme-thresholds.constant';
import { MemeStanding } from '../../core/history/meme-thresholds.interface';
import { monthFinalSlugs } from '../../core/history/month-finals';
import { athletePlacements } from '../../core/history/placements';
import { AthletePlacements } from '../../core/history/placements.interface';
import { prDelta, previousBestBySlug, previousYearBestBySlug } from '../../core/history/pr-delta';
import { prDeltaHint } from '../../core/history/pr-delta-text';
import { PreviousBest } from '../../core/history/previous-bests.interface';
import { closeRivals } from '../../core/history/rivals';
import { CLOSE_FINISH_GAP_MS } from '../../core/history/rivals.constant';
import { Rival } from '../../core/history/rivals.interface';
import { AthleteRun } from '../../core/models/athlete-history.interface';
import { GenderType } from '../../core/models/gender.enum';
import { lapTimeTextOf } from '../../core/protocol/race-time-cells';
import { formatRaceTime } from '../../core/time/duration';
import { MS_IN_SECOND } from '../../core/time/duration.constant';
import { isoToday } from '../../core/time/iso-today';
import { formatRussianDateNumeric } from '../../core/time/russian-date';
import { AthletesService } from '../../github/athletes.service';
import { PageMetaService } from '../../shared/seo/page-meta.service';
import { SelfAthleteService } from '../../state/self-athlete.service';
import { RaceDay } from '../../state/track-sync.interface';
import { LoadingState } from '../../shared/loading-state/loading-state';
import { OfflineNotice } from '../../shared/offline-notice/offline-notice';
import { ReloadButton } from '../../shared/reload-button/reload-button';
import { YearBadgeChip } from '../../shared/year-badge/year-badge';
import { ATHLETES_PAGE_LINK, VERSUS_PAGE_LINK } from '../../app.constant';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { ALL_YEARS_VALUE } from '../races/races-page.constant';
import {
  KEY_ROUTE_PARAM,
  NO_BEST_TIME_TEXT,
  NO_LAP_TEXT,
  NO_PLACE_TEXT,
  NO_PR_DELTA_TEXT,
  PODIUM_PLACE,
  PR_DELTA_CLASSES,
  RUNS_TABLE_ROW_HEIGHT_PX,
  RUNS_TABLE_VISIBLE_ROWS,
  SELF_MEME_KEY,
} from './athlete-page.constant';
import { athleteDescriptionText, closeTimesText, finishesText, runsCountText, weeksText } from './athlete-page-text';
import { AthleteStatus, AthleteStatusType } from './athlete-page.enum';
import {
  AthletePageState,
  AthleteRunView,
  FirstLapView,
  LegendView,
  MemeRowView,
  PlacementsView,
  RivalView,
  StreaksView,
  YearBestView,
} from './athlete-page.interface';
import { BadgeCatalog } from './badge-catalog/badge-catalog';
import { FormCard } from './form-card';
import { LifetimeCard } from './lifetime-card';
import { PacingCard } from './pacing-card';
import { ProgressChart } from './progress-chart';
import { RatingCard } from './rating-card';
import { WatchSync } from './watch-sync/watch-sync';
import { WeatherCard } from './weather-card';
import { RaceTime } from '../../shared/race-time/race-time';

/** One athlete's history: participation counters, 5 km records, and every 5 km run with a year filter. */
@Component({
  selector: 'app-athlete-page',
  imports: [
    BadgeCatalog,
    FormCard,
    LifetimeCard,
    LoadingState,
    MatButtonModule,
    MatButtonToggleModule,
    MatProgressBarModule,
    OfflineNotice,
    PacingCard,
    ProgressChart,
    RatingCard,
    ReloadButton,
    RouterLink,
    ScrollingModule,
    WatchSync,
    WeatherCard,
    YearBadgeChip,
    RaceTime,
  ],
  templateUrl: './athlete-page.html',
  styleUrl: './athlete-page.scss',
})
export class AthletePage {
  readonly #athletes = inject(AthletesService);
  readonly #selfAthlete = inject(SelfAthleteService);
  readonly #pageMeta = inject(PageMetaService);

  /**
   * Everything the archive answers about one athlete, held as the single object `#resolveState`
   * already produces. Landing it in one write is what keeps the page honest — no card can render
   * against a half-replaced profile — and a new field costs one line here instead of five.
   */
  readonly #state = signal<AthletePageState>(emptyAthleteState(AthleteStatus.loading));

  /** Nearly every card starts from the record, so it gets a memo of its own instead of 20 reads of the state. */
  readonly #record = computed(() => this.#state().record);

  /** Rides outside the atomic state on purpose — see the load below. */
  readonly #weatherRows = signal<EventWeatherRow[]>([]);
  readonly #todayIso = isoToday();
  /** The month-final events («итоговые») of the archive; the still-open current month marks none. */
  readonly #monthFinals = computed(() => monthFinalSlugs(this.#state().eventSlugs, this.#todayIso));
  // The whole page is about the full distance: one-lap runs never reach the table or the filters.
  readonly #fiveKmRuns = computed(() => filterRuns(this.#record()?.runs ?? [], null, FIVE_KM_DISTANCE_KM));
  /**
   * The ranking crowns per year, merged in front of the activity badges: the standing course
   * record and the athlete's cut in the year's best-times table. The current season recomputes
   * on every visit, so its badge can still slip away; finished years never change.
   */
  readonly #rankBadgesByYear = computed(() => {
    const record = this.#record();

    if (record === null) {
      return {};
    }

    const byYear: Record<string, YearBadgeType[]> = {};
    const courseCrown = currentCourseRecordEntries(this.courseRecords()).find((entry) => entry.key === record.key);

    if (courseCrown !== undefined) {
      byYear[isoYear(courseCrown.dateIso)] = [YearBadge.courseKing];
    }

    for (const [year, badge] of Object.entries(athleteYearRankBadges(this.#state().yearBests, record.key))) {
      (byYear[year] ??= []).push(badge);
    }

    // The season crowns and podiums follow the year crown within each year's row.
    for (const [year, badges] of Object.entries(athleteSeasonRankBadges(this.#state().seasonBests, record.key))) {
      (byYear[year] ??= []).push(...badges);
    }

    return byYear;
  });

  /** Year → the fastest recorded first-lap split of that year; a tie stays with the earlier run. */
  readonly #lapBestByYear = computed(() => {
    const byYear = new Map<string, AthleteFirstLap>();

    for (const lap of this.firstLaps()) {
      const year = isoYear(lap.dateIso);
      const known = byYear.get(year);

      if (known === undefined || lap.lapMs < known.lapMs || (lap.lapMs === known.lapMs && lap.dateIso < known.dateIso)) {
        byYear.set(year, lap);
      }
    }

    return byYear;
  });

  /** Slug → this run's recorded first-lap split, joining the «Круг» column back to the protocol splits. */
  readonly #lapMsBySlug = computed(() => new Map(this.firstLaps().map((lap) => [lap.slug, lap.lapMs])));

  /**
   * The record each run was chasing, and the season best behind it — both scanned over the whole
   * career, never over the year filter, so a row keeps the same «Δ ЛР» whatever the table shows.
   */
  readonly #previousBests = computed(() => previousBestBySlug(this.#fiveKmRuns()));

  readonly #previousYearBests = computed(() => previousYearBestBySlug(this.#fiveKmRuns()));

  readonly status = computed(() => this.#state().status);
  readonly year = signal<string | null>(null);
  readonly rivalsYear = signal<string | null>(null);

  readonly displayName = computed(() => this.#record()?.displayName ?? '');
  readonly participationCount = computed(() => this.#record()?.participationSlugs.length ?? 0);
  readonly finishCount = computed(() => this.#fiveKmRuns().length);
  /** «23/45» — the finals the athlete showed up at (a DNF counts, as in «участий») over every final ever held. */
  readonly finalsAttendanceText = computed(() => {
    const finals = this.#monthFinals();

    if (finals.size === 0) {
      return null;
    }

    const attended = (this.#record()?.participationSlugs ?? []).filter((slug) => finals.has(slug)).length;

    return `${attended}/${finals.size}`;
  });

  /** The chart gets the full 5 km history plus the year filter, so the all-time record stays known in a year view. */
  readonly progressRuns = this.#fiveKmRuns;
  /** The «Цифры за всё время» card counts every finish, the short course included. */
  readonly allRuns = computed(() => this.#record()?.runs ?? []);
  readonly bestTimeText = computed(() => toTimeText(this.#record()?.bestMs ?? null));
  /** The «Лучший первый круг · 2,3 км» profile value; hidden while no run carries a recorded split. */
  readonly firstLap = computed(() => toFirstLapView(this.#state().bestFirstLap));
  /** The «Раскладка» card joins these with the 5 km runs by slug itself. */
  readonly firstLaps = computed(() => this.#state().firstLaps);
  /** Badges count every finished run (the short course included); badge-less years are omitted. */
  readonly yearBadges = computed(() =>
    athleteYearBadges(this.#record()?.runs ?? [], this.#state().firstEventDateByYear, this.#rankBadgesByYear()),
  );

  /** Badge → the share of participants owning it — «есть у 12% участников» on the chips. */
  readonly badgeRarity = computed(() => this.#state().badgeRarity);
  /** «Король» chips read as «Королева» on a woman's page. */
  readonly gender = computed(() => this.#record()?.gender ?? null);
  /** The «Рейтинг» card sources: the score denominators and the record the grade divides by. */
  readonly winnerEvents = computed(() => this.#state().winnerEvents);
  /** The archive's newest event day anchors the form staleness — no wall clock, like the rating. */
  readonly formAnchorIso = computed(() => newestEventIso(this.winnerEvents()));
  readonly courseRecords = computed(() => this.#state().courseRecords);
  /** The «Погодные рекорды» card joins the runs with the stored per-event weather itself. */
  readonly weatherRows = this.#weatherRows.asReadonly();
  /** The running calendar year of the badge-progress lines. */
  readonly currentYear = isoYear(this.#todayIso);
  /** The running year's activity — the «Все награды» catalog teases the next badge with it. */
  readonly currentActivity = computed(() =>
    athleteYearActivity(this.#record()?.runs ?? [], this.currentYear, this.#state().firstEventDateByYear[this.currentYear]),
  );

  /** Streaks count participations (a DNF still extends one) over the full event chronology. */
  readonly streaks = computed(() =>
    toStreaksView(athleteStreaks(this.#record()?.participationSlugs ?? [], this.#record()?.runs ?? [], this.#state().eventSlugs)),
  );

  /** «Легенда трассы»: the transferable rolling-window crown for showing up, the pace never matters. */
  readonly legend = computed(() => toLegendView(legendProgress(legendBoard(this.#state().legendFinishes), this.#record()?.key ?? '')));

  /** The «Итоговые забеги» card: the best place at finals vs regular races and the finals podium tally. */
  readonly placements = computed(() => toPlacementsView(athletePlacements(this.#state().runPlaces, this.#monthFinals())));

  /** The «Соперники» card: who finished next to the athlete most often; its own year filter rescans the season. */
  readonly rivals = computed(() => {
    const key = this.#record()?.key ?? '';

    return closeRivals(this.#state().rivalRuns, key, this.rivalsYear()).map((rival) => toRivalView(rival, key));
  });

  /** The card (with its year chips) stays while the all-time list is non-empty; a dry season only empties the list. */
  readonly hasRivals = computed(() => closeRivals(this.#state().rivalRuns, this.#record()?.key ?? '', null).length > 0);

  /** The «Мем-пороги» ladder with the athlete's best slotted in; no best hides the card. */
  readonly memes = computed(() => {
    const bestMs = this.#record()?.bestMs ?? null;

    if (bestMs === null) {
      return [];
    }

    return toMemeRows(memeStandings(MEME_THRESHOLDS, bestMs), bestMs, this.displayName());
  });

  readonly yearBests = computed(() => {
    const bestMs = this.#record()?.bestMs ?? null;
    const runs = this.#record()?.runs ?? [];

    return yearBestEntries(this.#record()?.bestMsByYear ?? {}, runs).map((entry) => toYearBestView(entry, bestMs));
  });

  /** The first-lap twin of `yearBests`: one tile per year with a recorded 2.3 km split. */
  readonly lapYearBests = computed(() => {
    const bestLapMs = this.#state().bestFirstLap?.lapMs ?? null;

    return [...this.#lapBestByYear().entries()]
      .sort(([left], [right]) => right.localeCompare(left))
      .map(([year, lap]) => ({
        year,
        timeText: lapTimeTextOf(lap.lapMs),
        raceLink: [RACE_PAGE_BASE_LINK, lap.slug],
        isAllTime: lap.lapMs === bestLapMs,
      }));
  });

  readonly years = computed(() => distinctRunYears(this.#fiveKmRuns()));

  /**
   * The runs table, always fastest first: the rank is the row's 1-based position in that order, so a
   * year filter renumbers the season on its own. The place denominator is the athlete's own gender
   * finisher count of the event.
   */
  readonly runs = computed(() => {
    const { runPlaces, runFinisherCounts } = this.#state();
    const lapMsBySlug = this.#lapMsBySlug();
    const monthFinals = this.#monthFinals();
    const gender = this.gender();
    const previousBests = this.#previousBests();
    const previousYearBests = this.#previousYearBests();

    return sortRuns(filterRuns(this.#fiveKmRuns(), this.year(), null), RunsSort.byTime).map((run, index) =>
      toRunView(run, index + 1, runPlaces, runFinisherCounts, lapMsBySlug, monthFinals, gender, previousBests, previousYearBests),
    );
  });

  /** The viewport shrinks to the rows it holds, capped at thirty; below the cap it never shows blank lanes. */
  readonly viewportHeightPx = computed(() => Math.min(this.runs().length, RUNS_TABLE_VISIBLE_ROWS) * RUNS_TABLE_ROW_HEIGHT_PX);

  /** «8 забегов» beside the table title — recounts itself whenever the year filter narrows the list. */
  readonly runsCountText = computed(() => runsCountText(this.runs().length));

  /** The duel page with this athlete preselected: «сколько раз встречались и кто был впереди». */
  readonly versusLink = computed(() => [VERSUS_PAGE_LINK, this.#record()?.key ?? '']);

  /**
   * Whether this profile is the visitor's own pick — the watch sync belongs only here.
   * On somebody else's page «Подключить часы» would be an offer to sync a stranger's runs.
   */
  readonly isSelf = computed(() => {
    const self = this.#selfAthlete.self();

    return self !== null && self.key === this.#record()?.key;
  });

  /** The races the sync may ask the watch about: only days this athlete actually ran. */
  readonly ownRaceDays = computed<RaceDay[]>(() => this.allRuns().map((run) => ({ slug: run.slug, dateIso: run.dateIso })));

  protected readonly statuses = AthleteStatus;
  protected readonly athletesLink = ATHLETES_PAGE_LINK;
  protected readonly allYearsValue = ALL_YEARS_VALUE;
  protected readonly rowHeightPx = RUNS_TABLE_ROW_HEIGHT_PX;
  protected readonly legendWindowDays = LEGEND_WINDOW_DAYS;
  protected readonly closeGapSeconds = CLOSE_FINISH_GAP_MS / MS_IN_SECOND;

  #key = '';

  constructor() {
    // Same-route navigation reuses the component instance, so the key is tracked reactively.
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        this.#key = normalizeAthleteKey(params.get(KEY_ROUTE_PARAM) ?? '');
        void this.#load(this.#key);
      });
  }

  setYear(year: string | null): void {
    this.year.set(year);
  }

  /** The toggle group carries the "all" sentinel because a toggle value cannot be `null`. */
  onYearChange(value: string): void {
    this.setYear(value === ALL_YEARS_VALUE ? null : value);
  }

  onRivalsYearChange(value: string): void {
    this.rivalsYear.set(value === ALL_YEARS_VALUE ? null : value);
  }

  async #load(key: string): Promise<void> {
    // Only the record goes at once: the outgoing athlete's name over the incoming one's numbers would
    // be a lie. The archive-wide parts (the event chronology, the rarity shares, the records) belong
    // to no athlete in particular, so they keep serving the page while the next profile arrives.
    this.#state.update((state) => ({ ...state, status: AthleteStatus.loading, record: null }));
    this.year.set(null);
    this.rivalsYear.set(null);

    // The weather card is garnish, so its rows ride outside the atomic state and a failed read leaves them empty.
    const [next, weatherRows] = await Promise.all([this.#resolveState(key), this.#athletes.loadWeatherRows().catch(() => [])]);

    // A newer navigation may have taken over while the history was loading.
    if (key !== this.#key) {
      return;
    }

    this.#state.set(next);
    this.#weatherRows.set(weatherRows);
    this.#pageMeta.setDescription(athleteDescriptionText(this.displayName(), this.finishCount(), this.bestTimeText()));
  }

  async #resolveState(key: string): Promise<AthletePageState> {
    try {
      const parts = await this.#loadParts(key);

      return parts.record === null ? emptyAthleteState(AthleteStatus.notFound) : { status: AthleteStatus.ready, ...parts };
    } catch {
      return emptyAthleteState(AthleteStatus.error);
    }
  }

  async #loadParts(key: string): Promise<Omit<AthletePageState, 'status'>> {
    const [
      record,
      firstEventDateByYear,
      eventSlugs,
      badgeRarity,
      legendFinishes,
      runPlaces,
      runFinisherCounts,
      rivalRuns,
      bestFirstLap,
      firstLaps,
      yearBests,
      seasonBests,
      courseRecords,
      winnerEvents,
    ] = await Promise.all([
      this.#athletes.loadRecord(key),
      this.#athletes.loadFirstEventDateByYear(),
      this.#athletes.loadEventSlugs(),
      this.#athletes.loadYearBadgeRarity(),
      this.#athletes.loadLegendFinishes(),
      this.#athletes.loadRunPlaces(key),
      this.#athletes.loadRunFinisherCounts(key),
      this.#athletes.loadRivalRuns(key),
      this.#athletes.loadBestFirstLap(key),
      this.#athletes.loadFirstLaps(key),
      this.#athletes.loadYearBests(),
      this.#athletes.loadSeasonBests(),
      this.#athletes.loadCourseRecords(),
      this.#athletes.loadEventWinnerTimes(),
    ]);

    return {
      record,
      firstEventDateByYear,
      eventSlugs,
      badgeRarity,
      legendFinishes,
      runPlaces,
      runFinisherCounts,
      rivalRuns,
      bestFirstLap,
      firstLaps,
      yearBests,
      seasonBests,
      courseRecords,
      winnerEvents,
    };
  }
}

/** The record-less page state of the notFound and error outcomes. */
function emptyAthleteState(status: AthleteStatusType): AthletePageState {
  return {
    status,
    record: null,
    firstEventDateByYear: {},
    eventSlugs: [],
    badgeRarity: {},
    legendFinishes: [],
    runPlaces: {},
    runFinisherCounts: {},
    rivalRuns: [],
    bestFirstLap: null,
    firstLaps: [],
    yearBests: [],
    seasonBests: [],
    courseRecords: EMPTY_COURSE_RECORD_HISTORY,
    winnerEvents: [],
  };
}

function toRunView(
  run: AthleteRun,
  rank: number,
  places: Record<string, number>,
  finisherCounts: Record<string, EventGenderFinishers>,
  lapMsBySlug: ReadonlyMap<string, number>,
  monthFinals: Set<string>,
  gender: GenderType | null,
  previousBests: ReadonlyMap<string, PreviousBest>,
  previousYearBests: ReadonlyMap<string, PreviousBest>,
): AthleteRunView {
  const place = places[run.slug];
  const lapMs = lapMsBySlug.get(run.slug);
  const previousBest = previousBests.get(run.slug);
  const delta = prDelta(run.timeMs, previousBest?.timeMs);

  return {
    slug: run.slug,
    raceLink: [RACE_PAGE_BASE_LINK, run.slug],
    rank,
    dateShort: formatRussianDateNumeric(run.dateIso),
    timeText: formatRaceTime(run.timeMs),
    lapText: lapMs === undefined ? NO_LAP_TEXT : lapTimeTextOf(lapMs),
    placeText: placeText(place, finisherCounts[run.slug], gender),
    prDeltaText: delta?.text ?? NO_PR_DELTA_TEXT,
    prDeltaClass: delta === null ? '' : PR_DELTA_CLASSES[delta.kind],
    prDeltaHint: delta === null ? '' : prDeltaHint(previousBest, previousYearBests.get(run.slug)),
    isPodium: place !== undefined && place <= PODIUM_PLACE,
    isMonthFinal: monthFinals.has(run.slug),
  };
}

/** «3/22» — the place over the athlete's own gender finisher count; a bare place, or a dash when unknown. */
function placeText(place: number | undefined, finishers: EventGenderFinishers | undefined, gender: GenderType | null): string {
  if (place === undefined) {
    // Old protocols published without places simply show the dash.
    return NO_PLACE_TEXT;
  }

  const total = genderFinisherCount(finishers, gender);

  return total ? `${place}/${total}` : String(place);
}

function toYearBestView(entry: YearBestEntry, bestMs: number | null): YearBestView {
  return {
    year: entry.year,
    timeText: formatRaceTime(entry.timeMs),
    raceLink: [RACE_PAGE_BASE_LINK, entry.slug],
    isAllTime: entry.timeMs === bestMs,
  };
}

function toTimeText(bestMs: number | null): string {
  return bestMs === null ? NO_BEST_TIME_TEXT : formatRaceTime(bestMs);
}

function toFirstLapView(lap: AthletePageState['bestFirstLap']): FirstLapView | null {
  if (lap === null) {
    return null;
  }

  return { timeText: lapTimeTextOf(lap.lapMs), raceLink: [RACE_PAGE_BASE_LINK, lap.slug] };
}

function toPlacementsView(placements: AthletePlacements): PlacementsView {
  return {
    bestFinalPlace: placements.bestFinalPlace,
    bestRegularPlace: placements.bestRegularPlace,
    podiumTexts: toPodiumTexts(placements),
    hasPlaces: placements.bestFinalPlace !== null || placements.bestRegularPlace !== null,
  };
}

/** «1-е место ×3» — a chip per podium step; a step never taken at a final is omitted. */
function toPodiumTexts(placements: AthletePlacements): string[] {
  const texts: string[] = [];

  if (placements.firstFinalCount > 0) {
    texts.push($localize`:@@athlete.finalsFirstPlaces:1-е место ×${placements.firstFinalCount}:count:`);
  }

  if (placements.secondFinalCount > 0) {
    texts.push($localize`:@@athlete.finalsSecondPlaces:2-е место ×${placements.secondFinalCount}:count:`);
  }

  if (placements.thirdFinalCount > 0) {
    texts.push($localize`:@@athlete.finalsThirdPlaces:3-е место ×${placements.thirdFinalCount}:count:`);
  }

  return texts;
}

function toStreaksView(streaks: AthleteStreaks): StreaksView {
  return { currentText: weeksText(streaks.currentWeeks), maxText: weeksText(streaks.maxWeeks), rageCount: streaks.rageCount };
}

/** The crown fills the bar; a chaser sees their share of the count that would take it over. */
function toLegendView(progress: LegendProgress): LegendView {
  return {
    isLegend: progress.isLegend,
    countText: finishesText(progress.finishCount),
    legendName: progress.legend?.displayName ?? null,
    legendCountText: finishesText(progress.legend?.finishCount ?? 0),
    toCrownText: finishesText(progress.finishesToCrown),
    progressPercent: progress.isLegend ? 100 : Math.round((100 * progress.finishCount) / (progress.finishCount + progress.finishesToCrown)),
  };
}

/** The athlete's own rung slots in right after the unbeaten benchmarks — the ladder stays time-sorted. */
function toMemeRows(standings: MemeStanding[], bestMs: number, displayName: string): MemeRowView[] {
  const rows = standings.map(toMemeRow);
  const selfIndex = standings.filter((standing) => !standing.isBeaten).length;

  rows.splice(selfIndex, 0, {
    key: SELF_MEME_KEY,
    name: displayName,
    note: null,
    timeText: formatRaceTime(bestMs),
    isBeaten: false,
    isSelf: true,
    gapText: null,
  });

  return rows;
}

function toMemeRow(standing: MemeStanding): MemeRowView {
  return {
    key: standing.key,
    name: standing.name,
    note: standing.note,
    timeText: formatRaceTime(standing.timeMs),
    isBeaten: standing.isBeaten,
    isSelf: false,
    gapText: standing.isNext ? formatRaceTime(standing.gapMs) : null,
  };
}

function toRivalView(rival: Rival, athleteKey: string): RivalView {
  return {
    key: rival.key,
    displayName: rival.displayName,
    versusLink: [VERSUS_PAGE_LINK, athleteKey, rival.key],
    closeText: closeTimesText(rival.closeCount),
    score: `${rival.wins}:${rival.losses}`,
  };
}
