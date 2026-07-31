/** Coros keeps accounts in regional silos; the login host must match where the account was made. */
export const CorosRegion = {
  Eu: 'eu',
  Global: 'global',
  Cn: 'cn',
} as const;

export type CorosRegionType = (typeof CorosRegion)[keyof typeof CorosRegion];
