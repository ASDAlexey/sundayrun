/** '249 (2.72)' when the organisers' legacy number is known, plain '249' otherwise. */
export function formatRaceNumber(number: number, legacyNumber: string | null): string {
  return legacyNumber === null ? String(number) : `${number} (${legacyNumber})`;
}
