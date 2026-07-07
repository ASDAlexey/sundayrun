import { ProtocolDbBindings, ProtocolDbRow } from './protocol-db.service.type';

/** The single query surface the typed queries need — the real service or a spec stand-in. */
export interface ProtocolDb {
  query(sql: string, bindings?: ProtocolDbBindings): Promise<ProtocolDbRow[]>;
}
