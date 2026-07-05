import { ADMIN_TOKEN_MOCK } from '../../github/admin-token.service.mock';

/** Whitespace around a pasted token must be trimmed away before validation. */
export const PADDED_TOKEN_INPUT = `  ${ADMIN_TOKEN_MOCK}  `;

/** Trims down to an empty token, so no validation request must be made. */
export const WHITESPACE_TOKEN_INPUT = '   ';
