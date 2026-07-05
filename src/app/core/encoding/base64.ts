import { BASE64_CHUNK_JOINER, BASE64_CHUNK_SIZE } from './base64.constant';

/** Chunked bytes → base64 conversion; works in both browsers and jsdom (no FileReader). */
export function bytesToBase64(bytes: Uint8Array): string {
  const chunks: string[] = [];

  for (let offset = 0; offset < bytes.length; offset += BASE64_CHUNK_SIZE) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + BASE64_CHUNK_SIZE)));
  }

  return btoa(chunks.join(BASE64_CHUNK_JOINER));
}
