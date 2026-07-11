import { InjectionToken, inject } from '@angular/core';

import { ProtocolDb } from './protocol-db.interface';
import { ProtocolDbService } from './protocol-db.service';

/**
 * The read surface `protocol-db-queries` runs against, chosen per platform: by default the
 * range-request `ProtocolDbService` that reads the CDN in the browser, and during the static
 * prerender the local-file Node adapter (`createNodeProtocolDb`, bound in the server config, which
 * merges after this default and wins). Injecting the token instead of the concrete service lets the
 * server build swap the implementation without the read services knowing.
 */
export const PROTOCOL_DB = new InjectionToken<ProtocolDb>('PROTOCOL_DB', {
  providedIn: 'root',
  factory: () => inject(ProtocolDbService),
});
