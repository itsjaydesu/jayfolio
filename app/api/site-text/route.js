import { NextResponse } from 'next/server';
import { readSiteText, writeSiteText } from '../../../lib/siteText';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await readSiteText();
    return NextResponse.json(data);
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
