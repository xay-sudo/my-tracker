import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase Environment Variables');
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const body = await request.json();

    // Capture visitor details
    const ip = request.headers.get('x-forwarded-for') || 'Unknown IP';
    const userAgent = request.headers.get('user-agent') || 'Unknown Device';
    const country = request.headers.get('x-vercel-ip-country') || 'Unknown';
    
    // CAPTURE REFERRER (Where they came from)
    const referer = request.headers.get('referer') || 'Direct / Unknown';

    const { error } = await supabase
      .from('visits')
      .insert({
        url: body.url,
        ip: ip,
        user_agent: userAgent,
        country: country,
        referer: referer // Save the new field
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