import { ArchiveIndexEntry } from '../../core/github/archive-index.interface';
import { monthFinalSlugs } from '../../core/history/month-finals';
import { pluralText } from '../../core/i18n/plural-text';
import { formatDuration } from '../../core/time/duration';
import { isoToday } from '../../core/time/iso-today';
import { formatRussianDateChip } from '../../core/time/russian-date';
import { weatherLineText } from '../../core/weather/weather-line';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { TREND_WINDOW_SIZE } from './races-page.constant';
import { RaceCardGenderBlock, RaceCardHero, RaceCardSideStat, RaceCardTrend, RaceListItem } from './races-page.interface';

/** Full percent of the tallest trend bar; shorter races scale against the window's busiest one. */
const FULL_BAR_PERCENT = 100;

/**
 * The card list with each month's final («итоговый») race marked. The mark only needs the months
 * present in `entries`: the archive arrives as a newest-first contiguous slice, so any month it
 * contains brings its last race along, and the still-open current month never marks one.
 *
 * Each card's dynamics chart reads the up-to-7 next-older entries, so a preview that shows only
 * the first few cards should pass `TREND_WINDOW_SIZE - 1` extra entries as context and slice after.
 */
export function toRaceListItems(entries: ArchiveIndexEntry[], todayIso: string = isoToday()): RaceListItem[] {
  const finals = monthFinalSlugs(
    entries.map((entry) => entry.slug),
    todayIso,
  );

  return entries.map((entry, index) => toRaceListItem(entry, finals.has(entry.slug), toCardTrend(entries, index)));
}

/** The index arrives already sorted newest-first; entries are only reshaped, never re-sorted. */
export function toRaceListItem(entry: ArchiveIndexEntry, isMonthFinal: boolean, trend: RaceCardTrend | null): RaceListItem {
  return {
    slug: entry.slug,
    protocolLink: [RACE_PAGE_BASE_LINK, entry.slug],
    number: String(entry.number),
    numberTooltip:
      entry.legacyNumber === null
        ? null
        : $localize`:@@races.numberTooltip:Новая нумерация — № ${entry.number}:number:, старая — ${entry.legacyNumber}:legacyNumber:`,
    dateText: formatRussianDateChip(entry.dateIso),
    isMonthFinal,
    hero: toCardHero(entry, trend),
    genders: toCardGenders(entry),
    weatherText: weatherLineText(entry.weather),
    // i18n attributes with interpolation are dropped by the compiler, so the label is localized here.
    pdfAriaLabel: $localize`:@@races.pdfAriaLabel:Протокол пробега № ${entry.number}:number: (PDF)`,
  };
}

/**
 * The finisher counts of the trend window: this race plus the next-older entries, up to
 * `TREND_WINDOW_SIZE` in total. Entries predating the finisher aggregates fall out of the
 * chart; the card's own race must have a count, or there is no chart at all.
 */
export function toCardTrend(entries: ArchiveIndexEntry[], index: number): RaceCardTrend | null {
  const current = entries[index].finisherCount ?? null;

  if (current === null) {
    return null;
  }

  // Newest-first list: the slice after `index` holds the older races; reversed → oldest first.
  const olderPoints = entries
    .slice(index + 1, index + TREND_WINDOW_SIZE)
    .flatMap((entry) => (entry.finisherCount === null ? [] : [{ count: entry.finisherCount, dateIso: entry.dateIso }]))
    .reverse();
  const points = [...olderPoints, { count: current, dateIso: entries[index].dateIso }];
  const maxCount = Math.max(...points.map((point) => point.count));
  // A zero-finisher race never celebrates, even though it trivially "tops" an empty window.
  const isSeriesMax = current > 0 && current >= maxCount;

  return {
    bars: points.map((point, position) => ({
      heightPercent: maxCount > 0 ? Math.round((point.count / maxCount) * FULL_BAR_PERCENT) : 0,
      isCurrent: position === points.length - 1,
      count: point.count,
    })),
    highlightText: isSeriesMax ? $localize`:@@races.trendSeriesMax:максимум серии` : $localize`:@@races.trendThisRace:этот забег`,
  };
}

/** The `??` guard keeps an index published before the stats existed on a participants-only hero. */
function toCardHero(entry: ArchiveIndexEntry, trend: RaceCardTrend | null): RaceCardHero {
  const finisherCount = entry.finisherCount ?? null;

  if (finisherCount === null) {
    return {
      value: String(entry.participantCount),
      label: pluralText(entry.participantCount, {
        one: $localize`:@@races.heroParticipantsOne:участник`,
        few: $localize`:@@races.heroParticipantsFew:участника`,
        many: $localize`:@@races.heroParticipantsMany:участников`,
      }),
      trend: null,
      stats: [],
    };
  }

  return {
    value: String(finisherCount),
    label: pluralText(finisherCount, {
      one: $localize`:@@races.heroFinishersOne:финишёр · 5 км`,
      few: $localize`:@@races.heroFinishersFew:финишёра · 5 км`,
      many: $localize`:@@races.heroFinishersMany:финишёров · 5 км`,
    }),
    trend,
    stats: toCardStats(entry),
  };
}

/** Both counters always render — a zero shows dimmed instead of disappearing, like the design. */
function toCardStats(entry: ArchiveIndexEntry): RaceCardSideStat[] {
  const newcomerCount = entry.newcomerCount ?? 0;
  const personalRecordCount = entry.personalRecordCount ?? 0;

  return [
    {
      value: String(newcomerCount),
      label: pluralText(newcomerCount, {
        one: $localize`:@@races.statNewcomersOne:новичок`,
        few: $localize`:@@races.statNewcomersFew:новичка`,
        many: $localize`:@@races.statNewcomersMany:новичков`,
      }),
      isZero: newcomerCount === 0,
      hasArrow: false,
    },
    {
      value: String(personalRecordCount),
      label: pluralText(personalRecordCount, {
        one: $localize`:@@races.statRecordsOne:личный рекорд`,
        few: $localize`:@@races.statRecordsFew:личных рекорда`,
        many: $localize`:@@races.statRecordsMany:личных рекордов`,
      }),
      isZero: personalRecordCount === 0,
      hasArrow: true,
    },
  ];
}

/** A gender with no qualifying finisher drops out entirely — no dash column, the other block widens. */
function toCardGenders(entry: ArchiveIndexEntry): RaceCardGenderBlock[] {
  const blocks = [
    {
      title: $localize`:@@races.genderMaleTitle:М · мужчины`,
      best: formatTimeOrNull(entry.bestMaleMs),
      median: formatTimeOrNull(entry.medianMaleMs),
    },
    {
      title: $localize`:@@races.genderFemaleTitle:Ж · женщины`,
      best: formatTimeOrNull(entry.bestFemaleMs),
      median: formatTimeOrNull(entry.medianFemaleMs),
    },
  ];

  return blocks.filter((block) => block.best !== null || block.median !== null);
}

function formatTimeOrNull(timeMs: number | null): string | null {
  return timeMs === null ? null : formatDuration(timeMs);
}
