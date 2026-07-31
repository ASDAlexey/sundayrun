/** RFC 1321 test suite vectors, plus the cases where padding changes block count. */
export const MD5_VECTORS_MOCK: [text: string, digest: string][] = [
  ['', 'd41d8cd98f00b204e9800998ecf8427e'],
  ['a', '0cc175b9c0f1b6a831c399e269772661'],
  ['abc', '900150983cd24fb0d6963f7d28e17f72'],
  ['message digest', 'f96b697d7cb7938d525a2f31aaf161d0'],
  ['abcdefghijklmnopqrstuvwxyz', 'c3fcd3d76192e4007dfb496cca67e13b'],
  ['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 'd174ab98d277d9f5a5611c2c9f419d9f'],
  ['12345678901234567890123456789012345678901234567890123456789012345678901234567890', '57edf4a22be3c955ac49da2e2107b67a'],
];

/** 55 bytes still fit one block, 56 force a second — the padding boundary worth pinning. */
export const MD5_BLOCK_EDGE_VECTORS_MOCK: [text: string, digest: string][] = [
  ['a'.repeat(55), 'ef1772b6dff9a122358552954ad0df65'],
  ['a'.repeat(56), '3b0c8ac703f828b04c6c197006d17218'],
];

/** Non-ASCII input must be hashed as UTF-8 bytes, not as UTF-16 code units. */
export const MD5_UTF8_VECTOR_MOCK: [text: string, digest: string] = ['Таганрог', '4160ae6a88228895213788cad18fb447'];
