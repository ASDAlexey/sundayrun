import { DbSource } from '../app/core/sqlite/db-source.enum';
import { Environment } from './environment.type';

/**
 * Local dev default: read `data/sundayrun.db` straight off the dev server (served from `data/`,
 * see `angular.json` assets) instead of the CDN — the on-disk file is picked up without a push.
 * Flip `dbSource` to `DbSource.JsDelivr` to read the published db over jsDelivr instead.
 */
export const environment: Environment = {
  production: false,
  dbSource: DbSource.Local,
  localDbUrl: '/data/sundayrun.db',
};
