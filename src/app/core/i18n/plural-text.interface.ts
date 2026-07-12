/** The three ru plural forms of one countable phrase; integer counts never select the other categories. */
export interface RuPluralForms {
  /** 1, 21, 31, … — «1 забег». */
  one: string;
  /** 2–4, 22–24, … — «2 забега». */
  few: string;
  /** 0, 5–20, 25–30, … — «5 забегов». */
  many: string;
}
