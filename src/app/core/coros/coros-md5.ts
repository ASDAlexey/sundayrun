import {
  BITS_PER_BYTE,
  BYTE_MASK,
  HEX_BYTE_LENGTH,
  MD5_BLOCK_BYTES,
  MD5_INITIAL_STATE,
  MD5_LENGTH_BYTES,
  MD5_SHIFTS,
  MD5_SINE_TABLE,
  WORD_BITS,
  WORD_BYTES,
} from './coros-md5.constant';

/**
 * MD5 of a UTF-8 string, lowercase hex.
 *
 * Carried here only because the Coros login endpoint hashes the password this way and
 * `crypto.subtle` dropped MD5 as obsolete — which it is. Nothing else in the project may use it:
 * it is a transport quirk of somebody else's API, not a security primitive of ours.
 */
export function md5Hex(text: string): string {
  const blocks = padMessage(new TextEncoder().encode(text));
  const [initialA, initialB, initialC, initialD] = MD5_INITIAL_STATE;
  let stateA = initialA;
  let stateB = initialB;
  let stateC = initialC;
  let stateD = initialD;

  for (let offset = 0; offset < blocks.length; offset += MD5_BLOCK_BYTES / WORD_BYTES) {
    let a = stateA;
    let b = stateB;
    let c = stateC;
    let d = stateD;

    for (let step = 0; step < MD5_SINE_TABLE.length; step += 1) {
      const [mixed, wordIndex] = roundOf(step, b, c, d);
      const sum = (mixed + a + MD5_SINE_TABLE[step] + blocks[offset + wordIndex]) | 0;

      a = d;
      d = c;
      c = b;
      b = (b + rotateLeft(sum, MD5_SHIFTS[step])) | 0;
    }

    stateA = (stateA + a) | 0;
    stateB = (stateB + b) | 0;
    stateC = (stateC + c) | 0;
    stateD = (stateD + d) | 0;
  }

  return [stateA, stateB, stateC, stateD].map(littleEndianHex).join('');
}

/** The four MD5 rounds: which nonlinear mix applies at this step, and which message word it eats. */
function roundOf(step: number, b: number, c: number, d: number): [mixed: number, wordIndex: number] {
  const quarter = MD5_SINE_TABLE.length / 4;

  if (step < quarter) {
    return [(b & c) | (~b & d), step];
  }

  if (step < quarter * 2) {
    return [(d & b) | (~d & c), (5 * step + 1) % 16];
  }

  if (step < quarter * 3) {
    return [b ^ c ^ d, (3 * step + 5) % 16];
  }

  return [c ^ (b | ~d), (7 * step) % 16];
}

/** Appends the `0x80` terminator and the 64-bit little-endian bit length, then splits into words. */
function padMessage(bytes: Uint8Array): Uint32Array {
  const blockCount = Math.floor((bytes.length + MD5_LENGTH_BYTES) / MD5_BLOCK_BYTES) + 1;
  const padded = new Uint8Array(blockCount * MD5_BLOCK_BYTES);

  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  const bitLength = bytes.length * BITS_PER_BYTE;

  view.setUint32(padded.length - MD5_LENGTH_BYTES, bitLength >>> 0, true);
  view.setUint32(padded.length - WORD_BYTES, Math.floor(bitLength / 2 ** WORD_BITS), true);

  const words = new Uint32Array(padded.length / WORD_BYTES);

  for (let index = 0; index < words.length; index += 1) {
    words[index] = view.getUint32(index * WORD_BYTES, true);
  }

  return words;
}

function rotateLeft(value: number, bits: number): number {
  return (value << bits) | (value >>> (WORD_BITS - bits));
}

/** MD5 digests are read out little-endian, so the low byte of each state word comes first. */
function littleEndianHex(word: number): string {
  let hex = '';

  for (let byte = 0; byte < WORD_BYTES; byte += 1) {
    hex += ((word >>> (byte * BITS_PER_BYTE)) & BYTE_MASK).toString(16).padStart(HEX_BYTE_LENGTH, '0');
  }

  return hex;
}
