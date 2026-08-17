import { buildFormBaselines, formDelta } from './form-delta';
import { FormDeltaKind } from './form-delta.enum';
import {
  EXPECTED_BREAK_REST_DAYS,
  EXPECTED_FORM_BASELINES,
  FORM_DELTA_CORRIDOR_EDGE_MS,
  FORM_DELTA_FASTER_MS,
  FORM_DELTA_RACE_ISO,
  FORM_DELTA_RUNS,
  FORM_DELTA_SLOWER_MS,
  FORM_DELTA_USUAL_MS,
  АННА_BASELINE,
  МАРИЯ_BASELINE,
} from './form-delta.mock';

describe('buildFormBaselines', () => {
  it('medians the five newest 5 km finishes standing before the race', () => {
    expect(buildFormBaselines(FORM_DELTA_RUNS, FORM_DELTA_RACE_ISO)).toEqual(EXPECTED_FORM_BASELINES);
    expect(buildFormBaselines([], FORM_DELTA_RACE_ISO), 'nobody has run — nobody has a form').toEqual({});
  });
});

describe('formDelta', () => {
  it('holds a result inside the corridor at arm’s length and states the rest plainly', () => {
    expect(formDelta(FORM_DELTA_USUAL_MS, МАРИЯ_BASELINE, FORM_DELTA_RACE_ISO)).toEqual({
      kind: FormDeltaKind.usual,
      text: '≈ +0:20,00',
      restDays: 14,
    });
    expect(formDelta(FORM_DELTA_CORRIDOR_EDGE_MS, МАРИЯ_BASELINE, FORM_DELTA_RACE_ISO), 'the corridor holds its own edge').toEqual({
      kind: FormDeltaKind.usual,
      text: '≈ +0:36,90',
      restDays: 14,
    });
    expect(formDelta(FORM_DELTA_SLOWER_MS, МАРИЯ_BASELINE, FORM_DELTA_RACE_ISO)).toEqual({
      kind: FormDeltaKind.slower,
      text: '+1:10,00',
      restDays: 14,
    });
    expect(formDelta(FORM_DELTA_FASTER_MS, МАРИЯ_BASELINE, FORM_DELTA_RACE_ISO)).toEqual({
      kind: FormDeltaKind.faster,
      text: '−0:50,00',
      restDays: 14,
    });
  });

  it('refuses to measure a comeback against the form it left behind', () => {
    expect(formDelta(FORM_DELTA_SLOWER_MS, АННА_BASELINE, FORM_DELTA_RACE_ISO)).toEqual({
      kind: FormDeltaKind.afterBreak,
      text: '',
      restDays: EXPECTED_BREAK_REST_DAYS,
    });
  });

  it('stays blank without a time of its own or a form to place it against', () => {
    expect(formDelta(null, МАРИЯ_BASELINE, FORM_DELTA_RACE_ISO), 'a DNF or one-lap row').toBeNull();
    expect(formDelta(FORM_DELTA_SLOWER_MS, undefined, FORM_DELTA_RACE_ISO), 'a debut').toBeNull();
  });
});
