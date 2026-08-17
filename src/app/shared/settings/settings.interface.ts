import { DeltaBaseType } from '../../state/delta-base.enum';

/** One choice in «С чем сравнивать»: the stored base and the word standing for it in the card. */
export interface DeltaBaseOption {
  base: DeltaBaseType;
  label: string;
}
