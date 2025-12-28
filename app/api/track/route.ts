import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Check if a Tracker ID was sent
    if (!body.tracker_id) {
      return NextResponse.json({ success: false, error: 'Missing tracker_id' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') || 'Unknown IP';
    const userAgent = request.headers.get('user-agent') || 'Unknown Device';
    const country = request.headers.get('x-vercel-ip-country') || 'Unknown';
    const referer = request.headers.get('referer') || 'Direct / Unknown';

    const { error } = await supabase
      .from('visits')
      .insert({
        tracker_id: body.tracker_id, // Save the ID!
        url: body.url,
        ip: ip,
        user_agent: userAgent,
        country: country,
        referer: referer
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}