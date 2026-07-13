import { athleteForm } from './form';
import { EXPECTED_FADING_FORM, EXPECTED_IMPROVING_FORM, FADING_FORM_RUNS, IMPROVING_FORM_RUNS, SHORT_FORM_RUNS } from './form.mock';

describe('form', () => {
  it('builds rolling-median points in date order, keeps the peak at the earliest lowest window and needs a full window', () => {
    expect(athleteForm([...FADING_FORM_RUNS]), 'the peak stays at the earliest of the equal windows').toEqual(EXPECTED_FADING_FORM);
    expect(athleteForm([...IMPROVING_FORM_RUNS]), 'the improving athlete peaks on the latest window').toEqual(EXPECTED_IMPROVING_FORM);
    expect(athleteForm([...SHORT_FORM_RUNS]), 'fewer finishes than one window make no form').toBeNull();
  });
});
