import { NextResponse } from 'next/server';

export const revalidate = 3600;

type OverallRow = { category: string; date: string; downloads: number };

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

    // overall returns daily counts for both with_mirrors and without_mirrors.
    // Sum all rows (mirror + CDN) to report total downloads served everywhere.
    const total = rows.reduce((acc, curr) => acc + (curr.downloads || 0), 0);

    // Sum only the trailing 30 days of without_mirrors rows for the /month figure.
    const withoutMirrors = rows
      .filter((row) => row.category === 'without_mirrors')
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .slice(-30);
    const downloads = withoutMirrors.reduce((acc, curr) => acc + (curr.downloads || 0), 0);

    return NextResponse.json({ downloads, total });
  } catch {
    return NextResponse.json({ downloads: null, total: null });
  }
}