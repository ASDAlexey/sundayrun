import { Service } from '@angular/core';

import { corosDownloadGpx, corosLogin, corosQueryRuns } from './coros-api';
import { CorosActivity } from './coros-api.interface';
import { CorosRegionType } from './coros-region.enum';

/**
 * Injectable face of the Coros API.
 *
 * The endpoints themselves are plain functions, tested directly; this exists so the services above
 * them have a dependency the TestBed can replace — the Angular unit-test system does not support
 * module mocking for relative imports.
 */
@Service()
export class CorosClient {
  async login(email: string, password: string, region: CorosRegionType): Promise<string> {
    return await corosLogin(email, password, region);
  }

  async queryRuns(token: string, startDateIso: string, endDateIso: string, region: CorosRegionType): Promise<CorosActivity[]> {
    return await corosQueryRuns(token, startDateIso, endDateIso, region);
  }

  async downloadGpx(token: string, labelId: string, region: CorosRegionType): Promise<string> {
    return await corosDownloadGpx(token, labelId, region);
  }
}
