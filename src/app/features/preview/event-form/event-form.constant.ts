import { ValidationErrors } from '@angular/forms';

/** Race numbers are 1-based ordinals. */
export const MIN_EVENT_NUMBER = 1;

export const INTEGER_ERROR: ValidationErrors = { integer: true };

/** Date fallback when the imported file name carries no date. */
export const EMPTY_DATE_ISO = '';
