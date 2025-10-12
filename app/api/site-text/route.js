import { NextResponse } from 'next/server';
import { readSiteText, writeSiteText } from '../../../lib/siteText';

// Use ISR with cache headers for better performance
export const revalidate = 60; // Revalidate every minute for admin data

export async function GET() {
  try {
    const data = await readSiteText();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const payload = await request.json();
    const saved = await writeSiteText(payload);
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
