import { TestBed } from '@angular/core/testing';

import { EMPTY_NOTE, FIRST_PARTICIPATION_NOTE } from '../core/history/notes-builder.constant';
import { Gender, GenderConfidence, GenderSource } from '../core/models/gender.enum';
import { ProtocolStateService } from './protocol-state.service';
import {
  BATCH_FIRST_DATE_ISO,
  BATCH_FIRST_FILE_NAME,
  BATCH_FIRST_XLSX_BYTES,
  BATCH_LATE_DATE_ISO,
  EXPECTED_AUTO_FILLED_EVENT,
  EXPECTED_BACKDATED_NOTE,
  EXPECTED_BATCH_PR_NOTE,
  EXPECTED_MALE_TOTAL_MS,
  EXPECTED_PARTICIPANT_COUNT,
  EXPECTED_PR_NOTE,
  EXPECTED_SUGGESTED_DATE_ISO,
  FUTURE_DATE_ISO,
  FUTURE_ONLY_HISTORY,
  IMPORT_FILE_NAME,
  IMPORT_HISTORY,
  IMPORT_XLSX_BYTES,
  KNOWN_MALE_ID,
  KNOWN_MALE_NAME,
  PUBLISHED_EVENT_DATES,
  RACE_EVENT,
  REPUBLISHED_HISTORY,
  REVERSED_NAME_XLSX_BYTES,
  SECOND_UNDATED_FILE_NAME,
  UNDATED_FILE_NAME,
  UNKNOWN_GENDER_ID,
  UNKNOWN_GENDER_NAME,
} from './protocol-state.service.mock';

describe('ProtocolStateService', () => {
  let service: ProtocolStateService;

  beforeEach(() => {
    service = TestBed.inject(ProtocolStateService);
    service.reset();
  });

  it('starts empty and imports a file: participants with genders, source file, suggested date, computed flags', () => {
    expect(service.participants()).toEqual([]);
    expect(service.hasParticipants()).toBe(false);
    expect(service.canGenerate()).toBe(false);
    expect(service.protocolRows()).toEqual([]);
    expect(service.draftCount()).toBe(0);
    expect(service.activeNumberingDates()).toBeNull();

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
    expect(service.draftCount()).toBe(1);
    expect(service.activeIndex()).toBe(0);
    expect(service.protocolRows()).toHaveLength(EXPECTED_PARTICIPANT_COUNT);
    expect(service.protocolRows()[0]).toMatchObject({ fullName: KNOWN_MALE_NAME, placeM: 1 });

    service.importFile(UNDATED_FILE_NAME, IMPORT_XLSX_BYTES);

    expect(service.suggestedDateIso()).toBeNull();
  });

  it('edits participants immutably, applies the auto notes once per draft, auto-fills the event and resets', () => {
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

    service.applyAutoNotes(IMPORT_HISTORY);

    const afterAutoNotes = service.participants();

    expect(afterAutoNotes[0], 'the PR and year-best tokens land in the read-only note').toMatchObject({
      fullName: KNOWN_MALE_NAME,
      note: EXPECTED_PR_NOTE,
    });
    expect(afterAutoNotes[2]).not.toBe(afterGender[2]);
    expect(afterAutoNotes[1].note).toBe(FIRST_PARTICIPATION_NOTE);
    expect(afterAutoNotes[2].note).toBe(FIRST_PARTICIPATION_NOTE);

    service.applyAutoNotes(FUTURE_ONLY_HISTORY);

    expect(service.participants(), 'the notes run once per draft, so a later pass never overwrites them').toBe(afterAutoNotes);

    service.importFile(IMPORT_FILE_NAME, IMPORT_XLSX_BYTES);
    service.applyAutoNotes(REPUBLISHED_HISTORY);

    expect(service.participants()[0].note, 're-publication keeps the PR note instead of comparing the athlete against himself').toBe(
      EXPECTED_PR_NOTE,
    );
    expect(service.participants()[1].note, 're-publication keeps the first-participation note').toBe(FIRST_PARTICIPATION_NOTE);

    service.importFile(IMPORT_FILE_NAME, IMPORT_XLSX_BYTES);
    service.applyAutoNotes(FUTURE_ONLY_HISTORY);

    expect(service.participants()[0].note, 'a back-dated import must not see future runs').toBe(EXPECTED_BACKDATED_NOTE);

    service.importFile(IMPORT_FILE_NAME, REVERSED_NAME_XLSX_BYTES);
    service.applyAutoNotes(IMPORT_HISTORY);

    expect(service.participants()[0], 'a reversed name is fixed against the archive before the notes are computed').toMatchObject({
      fullName: KNOWN_MALE_NAME,
      gender: Gender.male,
      genderConfidence: GenderConfidence.high,
      genderSource: GenderSource.history,
      note: EXPECTED_PR_NOTE,
    });

    service.setPublishedEventDates(PUBLISHED_EVENT_DATES);

    expect(service.publishedEventDates()).toEqual(PUBLISHED_EVENT_DATES);
    expect(service.event(), 'the archive dates auto-fill the dated draft with defaults and the positional number').toEqual(
      EXPECTED_AUTO_FILLED_EVENT,
    );
    expect(service.activeNumberingDates(), 'the single draft numbers itself against the archive alone').toEqual(PUBLISHED_EVENT_DATES);

    service.reset();

    expect(service.participants()).toEqual([]);
    expect(service.event()).toBeNull();
    expect(service.sourceFile()).toBeNull();
    expect(service.suggestedDateIso()).toBeNull();
    expect(service.publishedEventDates()).toBeNull();
    expect(service.hasParticipants()).toBe(false);
    expect(service.canGenerate()).toBe(false);
  });

  it('pages a multi-file batch: date-sorted drafts, chained notes, batch numbering, duplicate guard and publish inputs', () => {
    service.importFiles([
      { name: UNDATED_FILE_NAME, bytes: IMPORT_XLSX_BYTES },
      { name: SECOND_UNDATED_FILE_NAME, bytes: IMPORT_XLSX_BYTES },
    ]);

    expect(
      service.drafts().map((draft) => draft.sourceFile.name),
      'two undated files order by name',
    ).toEqual([SECOND_UNDATED_FILE_NAME, UNDATED_FILE_NAME]);

    service.importFiles([
      { name: IMPORT_FILE_NAME, bytes: IMPORT_XLSX_BYTES },
      { name: UNDATED_FILE_NAME, bytes: IMPORT_XLSX_BYTES },
      { name: BATCH_FIRST_FILE_NAME, bytes: BATCH_FIRST_XLSX_BYTES },
    ]);

    expect(
      service.drafts().map((draft) => draft.sourceFile.name),
      'dated drafts sort chronologically, undated go last',
    ).toEqual([BATCH_FIRST_FILE_NAME, IMPORT_FILE_NAME, UNDATED_FILE_NAME]);
    expect(service.draftCount()).toBe(3);
    expect(service.activeIndex()).toBe(0);

    service.selectDraft(-1);
    service.selectDraft(3);

    expect(service.activeIndex(), 'out-of-range switches are ignored').toBe(0);

    service.selectDraft(1);

    expect(service.suggestedDateIso()).toBe(EXPECTED_SUGGESTED_DATE_ISO);

    service.setPublishedEventDates([]);

    expect(service.drafts()[0].event, 'the earlier dated draft opens the numbering').toMatchObject({
      dateIso: BATCH_FIRST_DATE_ISO,
      number: 1,
    });
    expect(service.drafts()[1].event, 'the later dated draft counts its earlier sibling').toMatchObject({
      dateIso: EXPECTED_SUGGESTED_DATE_ISO,
      number: 2,
    });
    expect(service.drafts()[2].event, 'an undated draft waits for a manual date').toBeNull();
    expect(service.activeNumberingDates(), 'the active draft numbers itself against its siblings, never itself').toEqual([
      BATCH_FIRST_DATE_ISO,
    ]);
    expect(service.draftsReady()).toEqual([false, false, false]);
    expect(service.unreadyDraftCount()).toBe(3);
    expect(service.canGenerate()).toBe(false);
    expect(service.hasDuplicateDates(), 'a dateless draft cannot collide with its siblings').toBe(false);
    expect(service.buildPublishInputs(), 'the event-less draft stays out of the payloads').toHaveLength(2);

    service.applyAutoNotes({});

    expect(service.drafts()[0].participants[0].note, 'the batch opener sees an empty history').toBe(FIRST_PARTICIPATION_NOTE);
    expect(service.drafts()[1].participants[0].note, 'the later draft compares against its unpublished sibling').toBe(
      EXPECTED_BATCH_PR_NOTE,
    );
    expect(service.drafts()[2].participants[0].note, 'a dateless draft cannot compute notes yet').toBe(EMPTY_NOTE);

    service.selectDraft(0);
    service.setGender(UNKNOWN_GENDER_ID, Gender.female);
    service.selectDraft(1);
    service.setGender(UNKNOWN_GENDER_ID, Gender.female);
    service.selectDraft(2);
    service.setGender(UNKNOWN_GENDER_ID, Gender.female);
    service.setEvent({ ...RACE_EVENT, dateIso: EXPECTED_SUGGESTED_DATE_ISO });

    expect(service.hasDuplicateDates(), 'two drafts on one date block the batch').toBe(true);
    expect(service.canGenerate()).toBe(false);

    service.setEvent({ ...RACE_EVENT, dateIso: BATCH_LATE_DATE_ISO });

    expect(service.hasDuplicateDates()).toBe(false);
    expect(service.event(), 'the positional number is re-derived from the batch, not taken from the form').toMatchObject({
      dateIso: BATCH_LATE_DATE_ISO,
      number: 3,
    });
    expect(service.canGenerate()).toBe(true);

    service.applyAutoNotes({});

    expect(service.drafts()[2].participants[0].note, 'an equal time in the freshly dated draft earns no record note').toBe(EMPTY_NOTE);
    expect(service.drafts()[1].participants[0].note, 'already-noted drafts stay untouched').toBe(EXPECTED_BATCH_PR_NOTE);

    const inputs = service.buildPublishInputs();

    expect(inputs).toHaveLength(3);
    expect(inputs.map((input) => input.event.dateIso)).toEqual([BATCH_FIRST_DATE_ISO, EXPECTED_SUGGESTED_DATE_ISO, BATCH_LATE_DATE_ISO]);
    expect(inputs[0].rows).toHaveLength(EXPECTED_PARTICIPANT_COUNT);
    expect(inputs[0].sourceXlsxBytes).toBe(BATCH_FIRST_XLSX_BYTES);

    expect(service.draftRowsBefore(EXPECTED_SUGGESTED_DATE_ISO), 'only strictly earlier siblings feed the PDF priors').toMatchObject([
      { dateIso: BATCH_FIRST_DATE_ISO },
    ]);
    expect(service.draftRowsBefore(BATCH_FIRST_DATE_ISO)).toEqual([]);
    expect(
      service.draftRowsBefore(FUTURE_DATE_ISO).map((draft) => draft.dateIso),
      'a date after the whole batch collects every draft, oldest first',
    ).toEqual([BATCH_FIRST_DATE_ISO, EXPECTED_SUGGESTED_DATE_ISO, BATCH_LATE_DATE_ISO]);
  });
});
