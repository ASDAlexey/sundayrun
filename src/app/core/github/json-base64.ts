import { bytesToBase64 } from '../encoding/base64';
import { JSON_INDENT } from './publish-event.constant';

/** Serialises a repository JSON file (pretty-printed) into the base64 payload of a git blob. */
export function jsonToBase64(value: unknown): string {
  return bytesToBase64(new TextEncoder().encode(JSON.stringify(value, null, JSON_INDENT)));
}
