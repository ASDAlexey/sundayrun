import { DbSource } from '../app/core/sqlite/db-source.enum';
import { Environment } from './environment.type';

/**
 * Local dev default: read `data/sundayrun.db` straight off the dev server (served from `data/`,
 * see `angular.json` assets) — the on-disk file is picked up without a push or deploy.
 * Flip `dbSource` to `DbSource.Pages` to read the deploy-bundled db (as production does).
 */
export const environment: Environment = {
  production: false,
  dbSource: DbSource.Local,
  localDbUrl: '/data/sundayrun.db',
};
