import { BASE64_CHUNK_SIZE } from '../core/encoding/base64.constant';
import { FONTS_DIRECTORY, PT_SERIF_BOLD_FILE, PT_SERIF_REGULAR_FILE } from './pdf-fonts.constant';

const LETTER_A_CODE = 65;

/** Two full chunks plus a tail, so the chunked base64 loop iterates more than once. */
export const REGULAR_FONT_LENGTH = BASE64_CHUNK_SIZE * 2 + 1;

export const REGULAR_FONT_BYTES = new Uint8Array(REGULAR_FONT_LENGTH).fill(LETTER_A_CODE);

/** 'BCD'. */
export const BOLD_FONT_BYTES = new Uint8Array([66, 67, 68]);

export const EXPECTED_REGULAR_BASE64 = btoa('A'.repeat(REGULAR_FONT_LENGTH));

export const EXPECTED_BOLD_BASE64 = btoa('BCD');

export const EXPECTED_REGULAR_URL = `${FONTS_DIRECTORY}${PT_SERIF_REGULAR_FILE}`;

export const EXPECTED_BOLD_URL = `${FONTS_DIRECTORY}${PT_SERIF_BOLD_FILE}`;
