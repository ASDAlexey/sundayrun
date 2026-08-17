import { formDeltaHint, formDeltaText } from './form-delta-text';
import {
  EXPECTED_FORM_DELTA_BREAK_HINT,
  EXPECTED_FORM_DELTA_BREAK_TEXT,
  EXPECTED_FORM_DELTA_MEDIAN_HINT,
  EXPECTED_FORM_DELTA_SINGLE_HINT,
  FORM_DELTA_BREAK,
  FORM_DELTA_SINGLE,
  FORM_DELTA_USUAL,
  АННА_BASELINE,
  ОЛЕГ_BASELINE,
  МАРИЯ_BASELINE,
} from './form-delta.mock';

describe('formDeltaText', () => {
  it('draws the figure, and words where the column stopped counting', () => {
    expect(formDeltaText(FORM_DELTA_USUAL)).toBe(FORM_DELTA_USUAL.text);
    expect(formDeltaText(FORM_DELTA_BREAK)).toBe(EXPECTED_FORM_DELTA_BREAK_TEXT);
  });
});

describe('formDeltaHint', () => {
  it('names the yardstick behind the figure, and how thin it was', () => {
    expect(formDeltaHint(МАРИЯ_BASELINE, FORM_DELTA_USUAL)).toBe(EXPECTED_FORM_DELTA_MEDIAN_HINT);
    expect(formDeltaHint(ОЛЕГ_BASELINE, FORM_DELTA_SINGLE), 'one finish is a previous race, not a median').toBe(
      EXPECTED_FORM_DELTA_SINGLE_HINT,
    );
    expect(formDeltaHint(АННА_BASELINE, FORM_DELTA_BREAK), 'the comeback names the break instead').toBe(EXPECTED_FORM_DELTA_BREAK_HINT);
  });
});
