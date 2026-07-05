import { bytesToBase64 } from './base64';
import {
  EMPTY_BYTES,
  EXPECTED_EMPTY_BASE64,
  EXPECTED_MULTI_CHUNK_BASE64,
  EXPECTED_SMALL_BASE64,
  MULTI_CHUNK_BYTES,
  SMALL_BYTES,
} from './base64.mock';

describe('bytesToBase64', () => {
  it('converts empty, single-chunk and multi-chunk byte arrays to base64', () => {
    expect(bytesToBase64(EMPTY_BYTES)).toBe(EXPECTED_EMPTY_BASE64);
    expect(bytesToBase64(SMALL_BYTES)).toBe(EXPECTED_SMALL_BASE64);
    expect(bytesToBase64(MULTI_CHUNK_BYTES)).toBe(EXPECTED_MULTI_CHUNK_BASE64);
  });
});
