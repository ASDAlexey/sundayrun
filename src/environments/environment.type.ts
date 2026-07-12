import { DbSourceType } from '../app/core/sqlite/db-source.enum';

/** Build-time configuration; swapped per build configuration via `fileReplacements`. */
export interface Environment {
  production: boolean;
  /** Where `ProtocolDbService` reads the archive from — see {@link DbSourceType}. */
  dbSource: DbSourceType;
  /** Dev-server url of `data/sundayrun.db`; used only when `dbSource` is `local`. */
  localDbUrl: string;
}
