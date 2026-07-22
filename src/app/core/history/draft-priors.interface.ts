import { ProtocolRow } from '../models/protocol-row.interface';

/** One unpublished draft of an upload batch: its date and its built protocol rows. */
export interface DraftRows {
  dateIso: string;
  rows: ProtocolRow[];
}
