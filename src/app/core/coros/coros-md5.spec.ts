import { md5Hex } from './coros-md5';
import { MD5_BLOCK_EDGE_VECTORS_MOCK, MD5_UTF8_VECTOR_MOCK, MD5_VECTORS_MOCK } from './coros-md5.mock';

describe('md5Hex', () => {
  it('matches the RFC 1321 test suite', () => {
    for (const [text, digest] of MD5_VECTORS_MOCK) {
      expect(md5Hex(text)).toBe(digest);
    }
  });

  it('pads correctly on both sides of the one-block boundary', () => {
    for (const [text, digest] of MD5_BLOCK_EDGE_VECTORS_MOCK) {
      expect(md5Hex(text)).toBe(digest);
    }
  });

  it('hashes UTF-8 bytes rather than UTF-16 code units', () => {
    const [text, digest] = MD5_UTF8_VECTOR_MOCK;

    expect(md5Hex(text)).toBe(digest);
  });
});
