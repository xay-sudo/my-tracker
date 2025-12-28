import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Get visitor details
    const ip = request.headers.get('x-forwarded-for') || 'Unknown IP';
    const userAgent = request.headers.get('user-agent') || 'Unknown Device';
    const country = request.headers.get('x-vercel-ip-country') || 'Unknown';

    const { error } = await supabase
      .from('visits') // This matches the table you just created
      .insert({
        url: body.url,
        ip: ip,
        user_agent: userAgent,
        country: country
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Supabase Error:', error);
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