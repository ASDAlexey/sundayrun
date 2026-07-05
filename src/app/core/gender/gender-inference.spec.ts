import { inferGender } from './gender-inference';
import { INFER_GENDER_CASES, MALE_A_YA_EXCEPTION_SAMPLE } from './gender-inference.mock';
import { RUSSIAN_FEMALE_NAMES, RUSSIAN_MALE_NAMES } from './russian-names.constant';

describe('inferGender', () => {
  it('resolves gender via dictionary, ending heuristics and ambiguity rules', () => {
    for (const [fullName, expected] of INFER_GENDER_CASES) {
      expect(inferGender(fullName), `inferGender(${JSON.stringify(fullName)})`).toEqual(expected);
    }

    // the exception branch is genuinely reachable: the sample bypasses both dictionaries
    expect(RUSSIAN_MALE_NAMES.has(MALE_A_YA_EXCEPTION_SAMPLE)).toBe(false);
    expect(RUSSIAN_FEMALE_NAMES.has(MALE_A_YA_EXCEPTION_SAMPLE)).toBe(false);
  });
});
