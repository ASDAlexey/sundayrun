export const AthletesSort = {
  bestTime: 'bestTime',
  participations: 'participations',
} as const;

export type AthletesSortType = (typeof AthletesSort)[keyof typeof AthletesSort];
