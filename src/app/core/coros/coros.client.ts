import { Service } from '@angular/core';

import { corosDownloadGpx, corosLogin, corosQueryRuns } from './coros-api';
import {
  type CorosActivity,
  type CorosDownloadGpxRequest,
  type CorosLoginRequest,
  type CorosQueryRunsRequest,
} from './coros-api.interface';

/**
 * Injectable face of the Coros API.
 *
 * The endpoints themselves are plain functions, tested directly; this exists so the services above
 * them have a dependency the TestBed can replace — the Angular unit-test system does not support
 * module mocking for relative imports.
 */
@Service()
export class CorosClient {
  async login(request: CorosLoginRequest): Promise<string> {
    return await corosLogin(request);
  }

  async queryRuns(request: CorosQueryRunsRequest): Promise<CorosActivity[]> {
    return await corosQueryRuns(request);
  }

  async downloadGpx(request: CorosDownloadGpxRequest): Promise<string> {
    return await corosDownloadGpx(request);
  }
}
