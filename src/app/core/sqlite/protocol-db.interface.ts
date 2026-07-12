import { ProtocolDbValue } from './protocol-db-value.type';

/** Positional executor drizzle-proxy drives: params are `?`-positional, rows come back as value arrays. */
export interface ProtocolDb {
  queryValues(sql: string, params: readonly ProtocolDbValue[]): Promise<ProtocolDbValue[][]>;
}
