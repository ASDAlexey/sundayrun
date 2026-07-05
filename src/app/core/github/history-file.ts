import { AthletesHistory } from '../models/athletes-history.type';
import { safeJsonParse } from './safe-json-parse';

/** Parses `athletes.json`; null, malformed JSON or a non-object yields an empty history. */
export function parseAthletesHistory(text: string | null): AthletesHistory {
  const parsed = safeJsonParse(text);

  return isAthletesHistory(parsed) ? parsed : {};
}

function isAthletesHistory(value: unknown): value is AthletesHistory {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
