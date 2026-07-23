export const Gender = {
  male: 'M',
  female: 'F',
} as const;

export type GenderType = (typeof Gender)[keyof typeof Gender];

export const GenderConfidence = {
  high: 'high',
  low: 'low',
  unknown: 'unknown',
} as const;

export type GenderConfidenceType = (typeof GenderConfidence)[keyof typeof GenderConfidence];

export const GenderSource = {
  dictionary: 'dictionary',
  heuristic: 'heuristic',
  history: 'history',
  manual: 'manual',
  unknown: 'unknown',
} as const;

export type GenderSourceType = (typeof GenderSource)[keyof typeof GenderSource];
