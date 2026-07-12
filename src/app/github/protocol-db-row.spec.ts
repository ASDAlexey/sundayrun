import { Gender } from '../core/models/gender.enum';
import { asGender, asNumber, asNumberOrNull, asString } from './protocol-db-row';

describe('protocol-db-row', () => {
  it('coerces each aggregate-derived column to the type its model expects', () => {
    expect(asString('иванов иван')).toBe('иванов иван');
    expect(asString(42), 'a stray numeric is stringified').toBe('42');

    expect(asNumber('1500000')).toBe(1500000);
    expect(asNumber(1500000)).toBe(1500000);

    expect(asNumberOrNull('1500000')).toBe(1500000);
    expect(asNumberOrNull(null), 'a SQL null is preserved').toBeNull();

    expect(asGender(Gender.male)).toBe(Gender.male);
    expect(asGender(Gender.female)).toBe(Gender.female);
    expect(asGender('X'), 'an unknown code reads as null').toBeNull();
    expect(asGender(null), 'a SQL null reads as null').toBeNull();
  });
});
