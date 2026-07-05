import { NEWER_ENTRY, OLDER_ENTRY } from '../../core/github/archive-index.mock';
import { ADMIN_TOKEN_MOCK } from '../../github/admin-token.service.mock';
import { AdminRaceItem } from './admin-page.interface';

/** Whitespace around a pasted token must be trimmed away before validation. */
export const PADDED_TOKEN_INPUT = `  ${ADMIN_TOKEN_MOCK}  `;

/** Trims down to an empty token, so no validation request must be made. */
export const WHITESPACE_TOKEN_INPUT = '   ';

export const ADMIN_RACES_LOAD_ERROR_MESSAGE = 'index cdn unreachable';

/** `EXISTING_INDEX` reshaped for the deletion list; the served newest-first order is preserved. */
export const EXPECTED_ADMIN_RACES: AdminRaceItem[] = [
  { slug: NEWER_ENTRY.slug, number: NEWER_ENTRY.number, dateLong: '5 июля 2026 г.', participantCount: NEWER_ENTRY.participantCount },
  { slug: OLDER_ENTRY.slug, number: OLDER_ENTRY.number, dateLong: '21 июня 2026 г.', participantCount: OLDER_ENTRY.participantCount },
];
