import { DbSource } from '../app/core/sqlite/db-source.enum';
import { Environment } from './environment.type';

/** Production default: the db is the copy bundled into the GitHub Pages deploy (same-origin). */
export const environment: Environment = {
  production: true,
  dbSource: DbSource.Pages,
  localDbUrl: '',
};
