/**
 * What the panel can offer this browser: the install dialog Chromium handed over, or — when no
 * dialog is coming, which is every browser on iOS and any desktop Safari or Firefox — the manual
 * route through the browser's own menu. `none` while the wait for a dialog is still on, inside an
 * installed app, and after the app is installed from here.
 */
export const InstallOffer = {
  none: 'none',
  prompt: 'prompt',
  manual: 'manual',
} as const;

export type InstallOfferType = (typeof InstallOffer)[keyof typeof InstallOffer];
