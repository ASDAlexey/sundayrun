/** Well-formed 'YYYY-MM-DD' slugs. */
export const VALID_EVENT_SLUGS = ['2026-06-28', '2020-09-20'];

/** Empty, prose, wrong separators, missing padding, extra segments and path-traversal attempts. */
export const INVALID_EVENT_SLUGS = ['', 'abc', '2026-6-28', '2026/06/28', '2026-06-28/extra', '../index', '2026-06-28 ', 'x2026-06-28'];
