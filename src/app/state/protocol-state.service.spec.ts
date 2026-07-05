import { TestBed } from '@angular/core/testing';

import { FIRST_PARTICIPATION_NOTE } from '../core/history/notes-builder.constant';
import { Gender, GenderConfidence, GenderSource } from '../core/models/gender.enum';
import { ProtocolStateService } from './protocol-state.service';
import {
  EXPECTED_MALE_TOTAL_MS,
  EXPECTED_PARTICIPANT_COUNT,
  EXPECTED_PR_NOTE,
  EXPECTED_SUGGESTED_DATE_ISO,
  FUTURE_ONLY_HISTORY,
  IMPORT_FILE_NAME,
  IMPORT_HISTORY,
  IMPORT_XLSX_BYTES,
  KNOWN_MALE_ID,
  KNOWN_MALE_NAME,
  NOTE_TEXT,
  RACE_EVENT,
  REPUBLISHED_HISTORY,
  UNDATED_FILE_NAME,
  UNKNOWN_GENDER_ID,
  UNKNOWN_GENDER_NAME,
} from './protocol-state.service.mock';

describe('ProtocolStateService', () => {
  let service: ProtocolStateService;

  beforeEach(() => {
    service = TestBed.inject(ProtocolStateService);
  });

  it('starts empty and imports a file: participants with genders, source file, suggested date, computed flags', () => {
    expect(service.participants()).toEqual([]);
    expect(service.hasParticipants()).toBe(false);
    expect(service.canGenerate()).toBe(false);
    expect(service.protocolRows()).toEqual([]);

    service.importFile(IMPORT_FILE_NAME, IMPORT_XLSX_BYTES);

    const participants = service.participants();

    expect(participants).toHaveLength(EXPECTED_PARTICIPANT_COUNT);
    expect(participants[0]).toMatchObject({
      id: KNOWN_MALE_ID,
      fullName: KNOWN_MALE_NAME,
      totalMs: EXPECTED_MALE_TOTAL_MS,
      gender: Gender.male,
      genderConfidence: GenderConfidence.high,
      genderSource: GenderSource.dictionary,
    });
    expect(participants[1].gender).toBe(Gender.female);
    expect(participants[2]).toMatchObject({ id: UNKNOWN_GENDER_ID, fullName: UNKNOWN_GENDER_NAME, gender: null });
    expect(service.sourceFile()).toEqual({ name: IMPORT_FILE_NAME, bytes: IMPORT_XLSX_BYTES });
    expect(service.suggestedDateIso()).toBe(EXPECTED_SUGGESTED_DATE_ISO);
    expect(service.hasParticipants()).toBe(true);
    expect(service.unknownGenderCount()).toBe(1);
    expect(service.canGenerate()).toBe(false);
    expect(service.protocolRows()).toHaveLength(EXPECTED_PARTICIPANT_COUNT);
    expect(service.protocolRows()[0]).toMatchObject({ fullName: KNOWN_MALE_NAME, placeM: 1 });

    service.importFile(UNDATED_FILE_NAME, IMPORT_XLSX_BYTES);

    expect(service.suggestedDateIso()).toBeNull();
  });

  it('edits participants immutably, tracks readiness through gender and event changes and resets', () => {
    service.importFile(IMPORT_FILE_NAME, IMPORT_XLSX_BYTES);

    const before = service.participants();

    service.setGender(UNKNOWN_GENDER_ID, Gender.female);

    const afterGender = service.participants();

    expect(afterGender).not.toBe(before);
    expect(afterGender[0]).toBe(before[0]);
    expect(afterGender[2]).toMatchObject({
      gender: Gender.female,
      genderConfidence: GenderConfidence.high,
      genderSource: GenderSource.manual,
    });
    expect(service.unknownGenderCount()).toBe(0);
    expect(service.canGenerate()).toBe(false);

    service.setEvent(RACE_EVENT);

    expect(service.event()).toBe(RACE_EVENT);
    expect(service.canGenerate()).toBe(true);

    service.setNote(KNOWN_MALE_ID, NOTE_TEXT);

    const afterNote = service.participants();

    expect(afterNote[0]).toMatchObject({ fullName: KNOWN_MALE_NAME, note: NOTE_TEXT });
    expect(afterNote[2]).toBe(afterGender[2]);

    service.applyAutoNotes(IMPORT_HISTORY, EXPECTED_SUGGESTED_DATE_ISO);

    const afterAutoNotes = service.participants();

    expect(afterAutoNotes[0], 'auto note overwrites the manual one').toMatchObject({ note: EXPECTED_PR_NOTE });
    expect(afterAutoNotes[1].note).toBe(FIRST_PARTICIPATION_NOTE);
    expect(afterAutoNotes[2].note).toBe(FIRST_PARTICIPATION_NOTE);

    service.applyAutoNotes(REPUBLISHED_HISTORY, EXPECTED_SUGGESTED_DATE_ISO);

    const afterRepublish = service.participants();

    expect(afterRepublish[0].note, 're-publication keeps the PR note instead of comparing the athlete against himself').toBe(
      EXPECTED_PR_NOTE,
    );
    expect(afterRepublish[1].note, 're-publication keeps the first-participation note').toBe(FIRST_PARTICIPATION_NOTE);
    expect(afterRepublish[2].note).toBe(FIRST_PARTICIPATION_NOTE);

    service.applyAutoNotes(FUTURE_ONLY_HISTORY, EXPECTED_SUGGESTED_DATE_ISO);

    expect(service.participants()[0].note, 'a back-dated import must not see future runs').toBe(FIRST_PARTICIPATION_NOTE);

    service.reset();

    expect(service.participants()).toEqual([]);
    expect(service.event()).toBeNull();
    expect(service.sourceFile()).toBeNull();
    expect(service.suggestedDateIso()).toBeNull();
    expect(service.hasParticipants()).toBe(false);
    expect(service.canGenerate()).toBe(false);
  });
});
