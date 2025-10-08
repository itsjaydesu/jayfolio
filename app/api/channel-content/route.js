import { NextResponse } from 'next/server';
import { readChannelContent, writeChannelContent } from '../../../lib/channelContent';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const content = await readChannelContent();
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const payload = await request.json();
    const content = await writeChannelContent(payload);
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
