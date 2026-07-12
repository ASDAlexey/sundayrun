import { ArchiveIndexEntry } from '../../core/github/archive-index.interface';
import { formatRaceNumber } from '../../core/github/race-number';
import { pluralText } from '../../core/i18n/plural-text';
import { RuPluralForms } from '../../core/i18n/plural-text.interface';
import { formatDuration } from '../../core/time/duration';
import { formatRussianDateLong } from '../../core/time/russian-date';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { RaceCardStat, RaceListItem } from './races-page.interface';

/** The index arrives already sorted newest-first; entries are only reshaped, never re-sorted. */
export function toRaceListItem(entry: ArchiveIndexEntry): RaceListItem {
  return {
    slug: entry.slug,
    protocolLink: [RACE_PAGE_BASE_LINK, entry.slug],
    number: formatRaceNumber(entry.number, entry.legacyNumber),
    dateLong: formatRussianDateLong(entry.dateIso),
    city: entry.city,
    park: entry.park,
    participantCount: entry.participantCount,
    stats: toCardStats(entry),
    // i18n attributes with interpolation are dropped by the compiler, so the label is localized here.
    pdfAriaLabel: $localize`:@@races.pdfAriaLabel:Протокол пробега № ${entry.number}:number: (PDF)`,
  };
}

/** The `??` guards keep an index published before the stats existed rendering without chips. */
function toCardStats(entry: ArchiveIndexEntry): RaceCardStat[] {
  const stats: RaceCardStat[] = [];
  const finisherCount = entry.finisherCount ?? null;

  if (finisherCount !== null) {
    stats.push({ label: $localize`:@@races.statFinishers:Финишёров 5 км`, value: String(finisherCount) });
  }

  appendTimeStat(stats, $localize`:@@races.statMedianTime:Медиана`, entry.medianTimeMs ?? null);
  appendTimeStat(stats, $localize`:@@races.statBestMale:Лучшее М`, entry.bestMaleMs ?? null);
  appendTimeStat(stats, $localize`:@@races.statBestFemale:Лучшее Ж`, entry.bestFemaleMs ?? null);
  appendCountStat(stats, entry.newcomerCount ?? null, {
    one: $localize`:@@races.statNewcomersOne:Новичок`,
    few: $localize`:@@races.statNewcomersFew:Новичка`,
    many: $localize`:@@races.statNewcomersMany:Новичков`,
  });
  appendCountStat(stats, entry.personalRecordCount ?? null, {
    one: $localize`:@@races.statRecordsOne:Личный рекорд`,
    few: $localize`:@@races.statRecordsFew:Личных рекорда`,
    many: $localize`:@@races.statRecordsMany:Личных рекордов`,
  });

  return stats;
}

/** Newcomers and records only show when the race had any: a zero (or a legacy null) builds no chip. */
function appendCountStat(stats: RaceCardStat[], statCount: number | null, labelForms: RuPluralForms): void {
  if (statCount !== null && statCount > 0) {
    stats.push({ label: pluralText(statCount, labelForms), value: String(statCount) });
  }
}

function appendTimeStat(stats: RaceCardStat[], label: string, timeMs: number | null): void {
  if (timeMs !== null) {
    stats.push({ label, value: formatDuration(timeMs) });
  }
}
