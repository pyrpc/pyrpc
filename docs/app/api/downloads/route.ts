import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  try {
    const [recentRes, overallRes] = await Promise.all([
      fetch('https://pypistats.org/api/packages/pyrpc-core/recent', { next: { revalidate: 3600 } }),
      fetch('https://pypistats.org/api/packages/pyrpc-core/overall', { next: { revalidate: 3600 } })
    ]);
    
    let downloads = null;
    let total = null;
    
    if (recentRes.ok) {
      const d = await recentRes.json();
      downloads = d?.data?.last_month ?? null;
    }
    
    if (overallRes.ok) {
      const d = await overallRes.json();
      // overall returns daily counts for both with_mirrors and without_mirrors.
      // Sum all rows (mirror + CDN) to report total downloads served everywhere.
      if (Array.isArray(d?.data)) {
        total = d.data.reduce((acc: number, curr: any) => acc + (curr.downloads || 0), 0);
      }
    }
    
    return NextResponse.json({ downloads, total });
  } catch {
    return NextResponse.json({ downloads: null, total: null });
  }
}
