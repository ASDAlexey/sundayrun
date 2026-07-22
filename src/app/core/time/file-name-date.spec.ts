import { parseDateFromFileName } from './file-name-date';
import { PARSE_DATE_FROM_FILE_NAME_CASES, PARSE_DATE_TODAY_ISO } from './file-name-date.mock';

describe('file-name-date', () => {
  it('extracts DD.MM.YYYY or Russian dates as ISO, infers the year for yearless names, rejects invalid dates', () => {
    for (const [name, expected] of PARSE_DATE_FROM_FILE_NAME_CASES) {
      expect(parseDateFromFileName(name, PARSE_DATE_TODAY_ISO), `parseDateFromFileName(${JSON.stringify(name)})`).toBe(expected);
    }
  });
});
