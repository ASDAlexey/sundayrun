import { DECIMAL_COMMA, DECIMAL_POINT } from './score-text.constant';

/** One score for the template, with the Russian decimal comma: 92.4 → «92,4». */
export function scoreText(score: number): string {
  return String(score).replace(DECIMAL_POINT, DECIMAL_COMMA);
}
