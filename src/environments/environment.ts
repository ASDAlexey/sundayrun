import { DbSource } from '../app/core/sqlite/db-source.enum';
import { Environment } from './environment.type';

/** Production default: the published db is read over the jsDelivr CDN. */
export const environment: Environment = {
  production: true,
  dbSource: DbSource.JsDelivr,
  localDbUrl: '',
};
