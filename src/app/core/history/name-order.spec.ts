import { resolveNameOrder, withResolvedNameOrder } from './name-order';
import {
  EXPECTED_MANUAL_GENDER_PARTICIPANT,
  EXPECTED_NEW_REVERSED_PARTICIPANT,
  EXPECTED_REVERSED_PARTICIPANT,
  MANUAL_GENDER_PARTICIPANT,
  NAME_ORDER_HISTORY,
  NEW_REVERSED_PARTICIPANT,
  REVERSED_PARTICIPANT,
} from './name-order.mock';

describe('resolveNameOrder', () => {
  it('keeps an exact archive match and any non-two-word name untouched', () => {
    expect(resolveNameOrder('Иванов Иван', NAME_ORDER_HISTORY)).toBe('Иванов Иван');
    expect(resolveNameOrder('Сидоров Пётр Ильич', NAME_ORDER_HISTORY), 'three words never swap').toBe('Сидоров Пётр Ильич');
  });

  it("adopts the archived spelling when the swapped words match an archived athlete, 'ё' included", () => {
    expect(resolveNameOrder('Людмила Цопкало', NAME_ORDER_HISTORY)).toBe('Цопкало Людмила');
    expect(resolveNameOrder('алена елкина', NAME_ORDER_HISTORY), 'canonical case and ё come from the archive').toBe('Ёлкина Алёна');
  });

  it('swaps an unarchived name via the first-names dictionary only when the order is unambiguous', () => {
    expect(resolveNameOrder('Никита Лютов', NAME_ORDER_HISTORY)).toBe('Лютов Никита');
    expect(resolveNameOrder('Лютов Никита', NAME_ORDER_HISTORY), 'correct order stays').toBe('Лютов Никита');
    expect(resolveNameOrder('Роман Артём', NAME_ORDER_HISTORY), 'two first names are ambiguous').toBe('Роман Артём');
    expect(resolveNameOrder('Чикалов Хтоний', NAME_ORDER_HISTORY), 'no dictionary word keeps the name').toBe('Чикалов Хтоний');
  });
});

describe('withResolvedNameOrder', () => {
  it('returns the same object for an untouched name, so drafts can skip unchanged participants', () => {
    const untouched = { ...REVERSED_PARTICIPANT, fullName: 'Иванов Иван' };

    expect(withResolvedNameOrder(untouched, NAME_ORDER_HISTORY)).toBe(untouched);
  });

  it('takes the gender from the matched archive record on a swap', () => {
    expect(withResolvedNameOrder(REVERSED_PARTICIPANT, NAME_ORDER_HISTORY)).toEqual(EXPECTED_REVERSED_PARTICIPANT);
  });

  it('re-infers the gender from the corrected name when the archive has none to give', () => {
    expect(withResolvedNameOrder(NEW_REVERSED_PARTICIPANT, NAME_ORDER_HISTORY)).toEqual(EXPECTED_NEW_REVERSED_PARTICIPANT);
  });

  it('keeps a manually verified gender across the swap', () => {
    expect(withResolvedNameOrder(MANUAL_GENDER_PARTICIPANT, NAME_ORDER_HISTORY)).toEqual(EXPECTED_MANUAL_GENDER_PARTICIPANT);
  });
});
