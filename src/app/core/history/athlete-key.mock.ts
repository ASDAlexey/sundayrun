/** [raw full name, expected normalized key]. */
export const ATHLETE_KEY_CASES: readonly (readonly [string, string])[] = [
  ['Иванов Иван', 'иванов иван'],
  ['  Иванов \t  Иван  ', 'иванов иван'],
  ['ЁЛКИНА\tАлёна\n', 'елкина алена'],
  ['Ёё', 'ее'],
];
