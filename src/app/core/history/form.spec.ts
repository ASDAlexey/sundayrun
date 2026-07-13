import { athleteForm } from './form';
import {
  EXPECTED_FADING_FORM,
  EXPECTED_IMPROVING_FORM,
  EXPECTED_STALE_FORM,
  FADING_FORM_RUNS,
  FRESH_ANCHOR_ISO,
  IMPROVING_FORM_RUNS,
  SHORT_FORM_RUNS,
  STALE_ANCHOR_ISO,
} from './form.mock';

describe('form', () => {
  it('builds rolling-median points in date order, keeps the peak at the earliest lowest window and needs a full window', () => {
    expect(athleteForm([...FADING_FORM_RUNS], FRESH_ANCHOR_ISO), 'the peak stays at the earliest of the equal windows').toEqual(
      EXPECTED_FADING_FORM,
    );
    expect(athleteForm([...IMPROVING_FORM_RUNS], FRESH_ANCHOR_ISO), 'the improving athlete peaks on the latest window').toEqual(
      EXPECTED_IMPROVING_FORM,
    );
    expect(athleteForm([...SHORT_FORM_RUNS], FRESH_ANCHOR_ISO), 'fewer finishes than one window make no form').toBeNull();
  });

  it('marks the form stale once the newest finish predates the anchor by a season', () => {
    expect(athleteForm([...FADING_FORM_RUNS], STALE_ANCHOR_ISO), 'a four-month-old newest finish reads as a break').toEqual(
      EXPECTED_STALE_FORM,
    );
  });
});
