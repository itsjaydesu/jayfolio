import { NextResponse } from 'next/server';
import { readFieldSettings, writeFieldSettings } from '../../../lib/fieldSettings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await readFieldSettings();
    return NextResponse.json(settings);
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
