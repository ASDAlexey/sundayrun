import { CorosRegionType } from '../core/coros/coros-region.enum';
import { TrackSourceType } from './track-source.enum';

/**
 * A linked watch account, as remembered on this device.
 *
 * The password is not here and never will be: it is used for the single login request and
 * forgotten. What is kept is the session token — enough for the silent sync, revoked by changing
 * the password in the provider's own app.
 */
export interface WatchAccount {
  source: TrackSourceType;
  email: string;
  region: CorosRegionType;
  token: string;
}
