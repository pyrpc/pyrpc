import { NextResponse } from 'next/server';

export const revalidate = 3600;

type OverallRow = { category: string; date: string; downloads: number };

/*
 * Counting convention.
 *  - `month` = trailing 30 calendar days of `without_mirrors` counts, derived
 *    from the pypistats /overall history. Matches the rolling window pypistats
 *    reports on /recent as `last_month`.
 *  - `total` = cumulative sum of ALL rows (with_mirrors + without_mirrors),
 *    intentional and mirror-inclusive.
 * Both values come from a single /overall request to keep rate-limit pressure
 * at one call per caching window.
 */
export async function GET() {
  try {
    const res = await fetch('https://pypistats.org/api/packages/pyrpc-core/overall', {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ downloads: null, total: null });
    }

    const d = await res.json();
    const rows: OverallRow[] = Array.isArray(d?.data) ? d.data : [];

    const total = rows.reduce((acc, curr) => acc + (curr.downloads || 0), 0);

    // Rolling 30-calendar-day window computed by date, not row count: the
    // dataset can have gaps, so slicing the last N rows would span more than
    // 30 real days and drift from the /recent last_month number.
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const downloads = rows
      .filter((row) => row.category === 'without_mirrors' && row.date >= cutoff)
      .reduce((acc, curr) => acc + (curr.downloads || 0), 0);

    return NextResponse.json({ downloads, total });
  } catch {
    return NextResponse.json({ downloads: null, total: null });
  }
}