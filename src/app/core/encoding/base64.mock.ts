import { BASE64_CHUNK_SIZE } from './base64.constant';

const LETTER_A_CODE = 65;

export const EMPTY_BYTES = new Uint8Array(0);

export const EXPECTED_EMPTY_BASE64 = '';

/** 'BCD'. */
export const SMALL_BYTES = new Uint8Array([66, 67, 68]);

export const EXPECTED_SMALL_BASE64 = btoa('BCD');

/** Two full chunks plus a tail, so the chunked loop iterates more than once. */
export const MULTI_CHUNK_LENGTH = BASE64_CHUNK_SIZE * 2 + 1;

export const MULTI_CHUNK_BYTES = new Uint8Array(MULTI_CHUNK_LENGTH).fill(LETTER_A_CODE);

export const EXPECTED_MULTI_CHUNK_BASE64 = btoa('A'.repeat(MULTI_CHUNK_LENGTH));
