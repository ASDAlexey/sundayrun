import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';

import { createNodeProtocolDb } from './github/protocol-db-node';
import { PROTOCOL_DB_LOCAL_PATH } from './github/protocol-db-node.constant';
import { PROTOCOL_DB } from './github/protocol-db.token';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // Prerender reads the committed protocol.db off disk instead of the CDN, so the static build
    // needs no HTTP range requests and every prerendered page ships with real data. This binding
    // is merged after appConfig's, so it wins over the browser range service during the build.
    { provide: PROTOCOL_DB, useValue: createNodeProtocolDb(PROTOCOL_DB_LOCAL_PATH) },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
