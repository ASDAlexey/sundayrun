/** JSON.parse guarded for repository files: null input or malformed JSON yields null instead of throwing. */
export function safeJsonParse(text: string | null): unknown {
  if (text === null) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
