import { pluralText } from './plural-text';
import { PLURAL_FORMS, PLURAL_TEXT_CASES } from './plural-text.mock';

describe('pluralText', () => {
  it('selects the ru plural form for every integer category', () => {
    for (const [count, expected] of PLURAL_TEXT_CASES) {
      expect(pluralText(count, PLURAL_FORMS), `count ${count}`).toBe(expected);
    }
  });
});
