import { Gender, GenderType } from '../core/models/gender.enum';
import { ProtocolDbValue } from '../core/sqlite/protocol-db-value.type';

/**
 * Field readers for a `ProtocolDbRow`: each column of a statement is aliased to the camelCase name
 * its model interface uses, but the value arrives as the untyped `ProtocolDbValue` union. These
 * coerce a single field to the exact type the model expects, so the queries stay assertion-free.
 */

/** A required text column, read back as the string the db stores. */
export function asString(value: ProtocolDbValue): string {
  return String(value);
}

/** A required numeric column, read back as a number. */
export function asNumber(value: ProtocolDbValue): number {
  return Number(value);
}

/** A nullable numeric column: the SQL null is preserved, every other value becomes a number. */
export function asNumberOrNull(value: ProtocolDbValue): number | null {
  return value === null ? null : Number(value);
}

/** A gender column: only the two known codes survive; anything else — including null — reads as null. */
export function asGender(value: ProtocolDbValue): GenderType | null {
  return value === Gender.male || value === Gender.female ? value : null;
}
