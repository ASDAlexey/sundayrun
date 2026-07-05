import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { importParticipants } from './import-participants';
import {
  EXPECTED_KHANDYGA_GENDER_FIELDS,
  EXPECTED_TROILIN_GENDER_FIELDS,
  KHANDYGA_FULL_NAME,
  TROILIN_FULL_NAME,
} from './import-participants.mock';
import { EXPECTED_PARTICIPANT_COUNT_14 } from './timer-export-parser.mock';
import { FIXTURE_14_FILE_NAME, FIXTURES_DIR_FROM_ROOT } from './xlsx-reader.mock';

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), FIXTURES_DIR_FROM_ROOT);

describe('import-participants', () => {
  it('parses the real export and infers genders for the real athletes', () => {
    const participants = importParticipants(readFileSync(join(FIXTURES_DIR, FIXTURE_14_FILE_NAME)));

    const troilin = participants.find((participant) => participant.fullName === TROILIN_FULL_NAME);
    const khandyga = participants.find((participant) => participant.fullName === KHANDYGA_FULL_NAME);

    expect(participants).toHaveLength(EXPECTED_PARTICIPANT_COUNT_14);
    expect(troilin).toMatchObject(EXPECTED_TROILIN_GENDER_FIELDS);
    expect(khandyga).toMatchObject(EXPECTED_KHANDYGA_GENDER_FIELDS);
  });
});
