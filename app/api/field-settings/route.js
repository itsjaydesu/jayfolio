import { NextResponse } from 'next/server';
import { readFieldSettings, writeFieldSettings } from '../../../lib/fieldSettings';

// Use cache headers for better performance
export const revalidate = 60; // Revalidate every minute for admin data

export async function GET() {
  try {
    const settings = await readFieldSettings();
    return NextResponse.json(settings, {
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
    const settings = await writeFieldSettings(payload ?? {});
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
