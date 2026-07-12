/**
 * Events published before this date keep their stored notes verbatim during the full recompute:
 * they were imported from the organisers' historical protocols, whose notes rest on results older
 * than the archive itself (it starts at event №117, 2019-07-28) — recomputed notes would falsify
 * them (wrong 'Первое участие', wrong 'было X' times). Their results still feed the replayed
 * history, so the events after the baseline are judged against the complete archive.
 */
export const AUTO_NOTES_BASELINE_ISO = '2024-01-01';
