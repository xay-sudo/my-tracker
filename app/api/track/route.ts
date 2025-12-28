import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// specific to Vercel: prevents static generation errors
export const dynamic = 'force-dynamic';

// Initialize Supabase with a fallback to prevent build-time crashes
// if the keys are missing (though you still need to add them in Vercel!)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    // Runtime check to ensure keys exist
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase keys are missing in Vercel Environment Variables.');
      return NextResponse.json({ success: false, error: 'Configuration Error' }, { status: 500 });
    }

    const body = await request.json();

    // Get visitor details
    const ip = request.headers.get('x-forwarded-for') || 'Unknown IP';
    const userAgent = request.headers.get('user-agent') || 'Unknown Device';
    const country = request.headers.get('x-vercel-ip-country') || 'Unknown';

    const { error } = await supabase
      .from('visits')
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