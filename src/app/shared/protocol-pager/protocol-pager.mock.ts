import { SourceFile } from '../../state/source-file.interface';

/** A one-file upload — the pager renders nothing. */
export const SINGLE_DRAFT_COUNT = 1;

export const BATCH_DRAFT_COUNT = 3;

export const FIRST_DRAFT_INDEX = 0;

export const MIDDLE_DRAFT_INDEX = 1;

export const LAST_DRAFT_INDEX = 2;

/** Only the first draft is ready — its dot alone gets the ready modifier. */
export const PAGER_READINESS = [true, false, false];

/** Byte content is irrelevant to the pager: it shows only the name. */
export const PAGER_SOURCE_FILE: SourceFile = { name: '14.06.2026.xlsx', bytes: new Uint8Array() };

/** Expected `aria-current` per dot with the first draft active. */
export const EXPECTED_ARIA_CURRENT = ['true', null, null];

/** Expected `pager__dot_active` per dot with the first draft active. */
export const EXPECTED_ACTIVE_DOTS = [true, false, false];
