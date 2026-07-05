import { parseDateFromFileName } from './file-name-date';
import { PARSE_DATE_FROM_FILE_NAME_CASES } from './file-name-date.mock';

describe('file-name-date', () => {
  it('extracts DD.MM.YYYY as an ISO date and rejects missing or invalid calendar dates', () => {
    for (const [name, expected] of PARSE_DATE_FROM_FILE_NAME_CASES) {
      expect(parseDateFromFileName(name), `parseDateFromFileName(${JSON.stringify(name)})`).toBe(expected);
    }
  });
});
