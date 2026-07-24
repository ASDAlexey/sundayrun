import { Gender } from '../models/gender.enum';
import { genderFinisherCount } from './gender-finishers';

describe('genderFinisherCount', () => {
  const finishers = { male: 8, female: 5 };

  it('picks the athlete’s own gender side, and falls back to undefined without a tally or a gender', () => {
    expect(genderFinisherCount(finishers, Gender.male), 'a man reads the men’s finisher count').toBe(8);
    expect(genderFinisherCount(finishers, Gender.female), 'a woman reads the women’s finisher count').toBe(5);
    expect(genderFinisherCount(undefined, Gender.male), 'no tally for the event — no denominator').toBeUndefined();
    expect(genderFinisherCount(finishers, null), 'a genderless athlete gets no denominator').toBeUndefined();
  });
});
