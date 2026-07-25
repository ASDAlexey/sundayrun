import { ADMIN_RETURN_OFF_SITE_VALUES, ADMIN_RETURN_TO_TIMER } from './admin-page.mock';
import { resolveAdminReturnUrl } from './admin-return';

describe('resolveAdminReturnUrl', () => {
  it('follows an in-app path and refuses everything that would leave the site', () => {
    expect(resolveAdminReturnUrl(ADMIN_RETURN_TO_TIMER)).toBe(ADMIN_RETURN_TO_TIMER);
    expect(resolveAdminReturnUrl(null), 'nobody sent the organiser here').toBeNull();
    expect(ADMIN_RETURN_OFF_SITE_VALUES.map((value) => resolveAdminReturnUrl(value))).toEqual([null, null, null]);
  });
});
