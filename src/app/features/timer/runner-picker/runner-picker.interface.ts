import { GenderType } from '../../../core/models/gender.enum';

/** One name the sheet offers — a search hit or a regular. `checked` only ever moves on a regular. */
export interface TimerPickerOption {
  key: string;
  displayName: string;
  gender: GenderType | null;
  /** «М · 47 забегов» — the muted line under the name. */
  metaText: string;
  checked: boolean;
}

/** A person about to join the roster; the id is minted at the moment of the write, never before. */
export interface TimerPickerCandidate {
  fullName: string;
  athleteKey: string | null;
  gender: GenderType | null;
}

/** One button of the М/Ж toggle: the value it sets plus the two strings it shows. */
export interface TimerGenderOption {
  gender: GenderType;
  /** «М» — the letter on the key. */
  label: string;
  /** «Мужской» — what a screen reader says instead of the letter. */
  ariaLabel: string;
}
