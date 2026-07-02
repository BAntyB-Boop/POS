const BANGKOK_OFFSET = '+07:00';

/** Epoch-ms of 00:00:00 Asia/Bangkok on the given YYYY-MM-DD calendar date. */
function startOfBangkokDay(dateStr: string): number {
  return Date.parse(`${dateStr}T00:00:00${BANGKOK_OFFSET}`);
}

/**
 * Converts inclusive from/to YYYY-MM-DD (Asia/Bangkok) query params into an
 * epoch-ms range suitable for `createdAt >= fromMs AND createdAt < toMs`.
 * `to` is treated as inclusive of the whole day, so the upper bound is
 * exclusive (start of the following day).
 */
export function parseDateRange(from?: string, to?: string): { fromMs?: number; toMs?: number } {
  const fromMs = from ? startOfBangkokDay(from) : undefined;
  const toMs = to ? startOfBangkokDay(to) + 24 * 60 * 60 * 1000 : undefined;
  return { fromMs, toMs };
}

/** Start (inclusive) / end (exclusive) epoch-ms range for the current Asia/Bangkok month. */
export function currentBangkokMonthRange(): { fromMs: number; toMs: number } {
  const nowBangkok = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const year = nowBangkok.getUTCFullYear();
  const month = nowBangkok.getUTCMonth();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fromMs = startOfBangkokDay(`${year}-${pad(month + 1)}-01`);
  const nextMonth = new Date(Date.UTC(year, month + 1, 1));
  const toMs = startOfBangkokDay(
    `${nextMonth.getUTCFullYear()}-${pad(nextMonth.getUTCMonth() + 1)}-01`,
  );
  return { fromMs, toMs };
}

/** YYYY-MM-DD (Asia/Bangkok) formatting of an epoch-ms timestamp, for grouping. */
export function toBangkokDateString(epochMs: number): string {
  const shifted = new Date(epochMs + 7 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}
