import { ArchiveIndexEntry } from '../../core/github/archive-index.interface';
import { jsDelivrFileUrl } from '../../core/github/jsdelivr';
import { formatDuration } from '../../core/time/duration';
import { formatRussianDateLong } from '../../core/time/russian-date';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { RaceCardStat, RaceListItem } from './races-page.interface';

/** The index arrives already sorted newest-first; entries are only reshaped, never re-sorted. */
export function toRaceListItem(entry: ArchiveIndexEntry, ref: string): RaceListItem {
  return {
    slug: entry.slug,
    protocolLink: [RACE_PAGE_BASE_LINK, entry.slug],
    number: entry.number,
    dateLong: formatRussianDateLong(entry.dateIso),
    city: entry.city,
    park: entry.park,
    participantCount: entry.participantCount,
    stats: toCardStats(entry),
    pdfUrl: jsDelivrFileUrl(entry.files.protocolPdf, ref),
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

  appendTimeStat(stats, $localize`:@@races.statAvgTime:Ср. время`, entry.avgTimeMs ?? null);
  appendTimeStat(stats, $localize`:@@races.statBestMale:Лучшее М`, entry.bestMaleMs ?? null);
  appendTimeStat(stats, $localize`:@@races.statBestFemale:Лучшее Ж`, entry.bestFemaleMs ?? null);

  return stats;
}

function appendTimeStat(stats: RaceCardStat[], label: string, timeMs: number | null): void {
  if (timeMs !== null) {
    stats.push({ label, value: formatDuration(timeMs) });
  }
}
