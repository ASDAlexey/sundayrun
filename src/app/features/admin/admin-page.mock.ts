import { NEWER_ENTRY, OLDER_ENTRY } from '../../core/github/archive-index.mock';
import { ADMIN_TOKEN_MOCK } from '../../github/admin-token.service.mock';
import { AdminRaceItem } from './admin-page.interface';

/** Whitespace around a pasted token must be trimmed away before validation. */
export const PADDED_TOKEN_INPUT = `  ${ADMIN_TOKEN_MOCK}  `;

/** Trims down to an empty token, so no validation request must be made. */
export const WHITESPACE_TOKEN_INPUT = '   ';

export const ADMIN_RACES_LOAD_ERROR_MESSAGE = 'index cdn unreachable';

/** `EXISTING_INDEX` reshaped for the races list; the served newest-first order is preserved. */
export const EXPECTED_ADMIN_RACES: AdminRaceItem[] = [
  {
    slug: NEWER_ENTRY.slug,
    number: NEWER_ENTRY.number,
    dateLong: '5 июля 2026 г.',
    participantCount: NEWER_ENTRY.participantCount,
    raceLink: `/races/${NEWER_ENTRY.slug}`,
    searchText: `№ ${NEWER_ENTRY.number} 5 июля 2026 г. ${NEWER_ENTRY.dateIso}`.toLowerCase(),
    deleteLabel: `Удалить забег № ${NEWER_ENTRY.number}`,
  },
  {
    slug: OLDER_ENTRY.slug,
    number: OLDER_ENTRY.number,
    dateLong: '21 июня 2026 г.',
    participantCount: OLDER_ENTRY.participantCount,
    raceLink: `/races/${OLDER_ENTRY.slug}`,
    searchText: `№ ${OLDER_ENTRY.number} 21 июня 2026 г. ${OLDER_ENTRY.dateIso}`.toLowerCase(),
    deleteLabel: `Удалить забег № ${OLDER_ENTRY.number}`,
  },
];

/** `EXISTING_INDEX` holds №13 and №11, so a new upload gets №14. */
export const EXPECTED_NEXT_NUMBER = 14;

/** Matches only the newer race by its number. */
export const NUMBER_QUERY = '13';

/** Matches only the older race by the month of its long date («июня»). */
export const MONTH_QUERY = 'июн';

/** Matches both races through the ISO year in the haystack. */
export const YEAR_QUERY = ' 2026';

export const NO_MATCH_QUERY = 'марафон';
