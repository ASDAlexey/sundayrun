import { strToU8, zipSync } from 'fflate';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

import { readXlsxRows } from './xlsx-reader';
import { WORKSHEET_NOT_FOUND_MESSAGE } from './xlsx-reader.constant';
import {
  BROKEN_XLSX_FILES,
  EXPECTED_HEADER_ROW,
  EXPECTED_SYNTHETIC_ROWS,
  FIXTURE_14_FILE_NAME,
  FIXTURE_14_FIRST_DATA_ROW,
  FIXTURE_14_ROW_COUNT,
  FIXTURE_24_FILE_NAME,
  FIXTURE_24_ROW_COUNT,
  FIXTURES_DIR_FROM_ROOT,
  SYNTHETIC_XLSX_FILES,
} from './xlsx-reader.mock';

const FIXTURES_DIR = join(cwd(), FIXTURES_DIR_FROM_ROOT);

function readFixture(fileName: string): Uint8Array {
  return readFileSync(join(FIXTURES_DIR, fileName));
}

function buildXlsx(files: Record<string, string>): Uint8Array {
  const entries: Record<string, Uint8Array> = {};

  for (const [path, xml] of Object.entries(files)) {
    entries[path] = strToU8(xml);
  }

  return zipSync(entries);
}

describe('xlsx-reader', () => {
  it('reads both real LibreOffice exports: header row, row counts, first data row, shared strings', () => {
    const rows14 = readXlsxRows(readFixture(FIXTURE_14_FILE_NAME));
    const rows24 = readXlsxRows(readFixture(FIXTURE_24_FILE_NAME));

    expect(rows14[0]).toEqual(EXPECTED_HEADER_ROW);
    expect(rows24[0]).toEqual(EXPECTED_HEADER_ROW);
    expect(rows14).toHaveLength(FIXTURE_14_ROW_COUNT);
    expect(rows24).toHaveLength(FIXTURE_24_ROW_COUNT);
    expect(rows14[1]).toEqual(FIXTURE_14_FIRST_DATA_ROW);
  });

  it('handles inlineStr, str, default, gap and r-less cells without sharedStrings; throws on a missing worksheet relationship', () => {
    expect(readXlsxRows(buildXlsx(SYNTHETIC_XLSX_FILES))).toEqual(EXPECTED_SYNTHETIC_ROWS);
    expect(() => readXlsxRows(buildXlsx(BROKEN_XLSX_FILES))).toThrow(WORKSHEET_NOT_FOUND_MESSAGE);
  });
});
