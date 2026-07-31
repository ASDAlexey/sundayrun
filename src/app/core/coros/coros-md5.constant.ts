/** Per-round left-rotation amounts of MD5 (RFC 1321, section 3.4). */
export const MD5_SHIFTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11,
  16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

/** The 64 sine-derived additive constants, `floor(|sin(i + 1)| * 2^32)`. */
export const MD5_SINE_TABLE = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32));

/** The four little-endian state words MD5 starts from. */
export const MD5_INITIAL_STATE = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];

export const MD5_BLOCK_BYTES = 64;

/** Bytes a block reserves for the trailing 64-bit length, so payload padding stops short of them. */
export const MD5_LENGTH_BYTES = 8;

export const BYTE_MASK = 0xff;

export const BITS_PER_BYTE = 8;

export const HEX_BYTE_LENGTH = 2;

export const WORD_BYTES = 4;

export const WORD_BITS = 32;
