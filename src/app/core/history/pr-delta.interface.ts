import { PrDeltaKindType } from './pr-delta.enum';

/** One result measured against the personal record it was chasing: the signed text and its side. */
export interface PrDelta {
  kind: PrDeltaKindType;
  /** Already formatted and signed: '+0:31,00', '−0:21,00', '0:00,00' for the exact repeat. */
  text: string;
}
