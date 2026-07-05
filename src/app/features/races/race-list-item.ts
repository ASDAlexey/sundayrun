import { ArchiveIndexEntry } from '../../core/github/archive-index.interface';
import { jsDelivrFileUrl } from '../../core/github/jsdelivr';
import { formatRussianDateLong } from '../../core/time/russian-date';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { RaceListItem } from './races-page.interface';

/** The index arrives already sorted newest-first; entries are only reshaped, never re-sorted. */
export function toRaceListItem(entry: ArchiveIndexEntry): RaceListItem {
  return {
    slug: entry.slug,
    protocolLink: [RACE_PAGE_BASE_LINK, entry.slug],
    number: entry.number,
    dateLong: formatRussianDateLong(entry.dateIso),
    city: entry.city,
    park: entry.park,
    participantCount: entry.participantCount,
    pdfUrl: jsDelivrFileUrl(entry.files.protocolPdf),
    // i18n attributes with interpolation are dropped by the compiler, so the label is localized here.
    pdfAriaLabel: $localize`:@@races.pdfAriaLabel:Протокол пробега № ${entry.number}:number: (PDF)`,
  };
}
