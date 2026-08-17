import { DeltaBase } from '../../state/delta-base.enum';
import { DeltaBaseOption } from './settings.interface';

/**
 * The time shown inside the card next to the switch. A real result rather than a round one: the
 * point of the sample is that ',18' — the hundredths that actually carry something — disappears
 * along with the ',00' of the archive, and that trade is the whole decision being made here.
 */
export const SETTINGS_SAMPLE_TIME = '23:04,18';

/**
 * «С чем сравнивать» — the yardstick of the protocol's delta column, in the order the card offers
 * them: the runner's own recent form first because it is the default and the only one of the four
 * that lands on both sides of zero, then the two bests, then the way out.
 */
export const DELTA_BASE_OPTIONS: DeltaBaseOption[] = [
  { base: DeltaBase.form, label: $localize`:@@settings.deltaBaseForm:Форма` },
  { base: DeltaBase.year, label: $localize`:@@settings.deltaBaseYear:Этот год` },
  { base: DeltaBase.record, label: $localize`:@@settings.deltaBaseRecord:Рекорд` },
  { base: DeltaBase.off, label: $localize`:@@settings.deltaBaseOff:Скрыть` },
];
