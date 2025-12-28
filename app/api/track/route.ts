import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define CORS headers to allow ANY website to send you data
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow all websites
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    // Handle the pre-flight check if needed
    if (request.method === 'OPTIONS') {
      return NextResponse.json({}, { headers: corsHeaders });
    }

    const body = await request.json();

    if (!body.tracker_id) {
      return NextResponse.json(
        { success: false, error: 'Missing tracker_id' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Use headers from the request if the body didn't send them (fallback)
    const ip = request.headers.get('x-forwarded-for') || 'Unknown IP';
    const userAgent = request.headers.get('user-agent') || 'Unknown Device';
    const country = request.headers.get('x-vercel-ip-country') || 'Unknown';
    // Prefer the referrer sent in the body (from the script), fallback to header
    const referer = body.referrer || request.headers.get('referer') || 'Direct';

    const { error } = await supabase
      .from('visits')
      .insert({
        tracker_id: body.tracker_id,
        url: body.url,
        ip: ip,
        user_agent: userAgent,
        country: country,
        referer: referer
      });

    if (error) throw error;

    // Return success WITH CORS HEADERS
    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false },
      { status: 500, headers: corsHeaders }
    );
  }
}