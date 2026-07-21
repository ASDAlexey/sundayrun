/** A hand-edited or truncated stored value degrades to «no history» instead of breaking the page. */
export function readStoredDurations(raw: string | null, maxEntries: number): number[] {
  if (raw === null) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed.filter(isPlausibleDuration).slice(-maxEntries);
    }
  } catch {
    // Fall through: broken JSON and a wrong shape degrade the same way.
  }

  return [];
}

function isPlausibleDuration(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
