import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { UAParser } from 'ua-parser-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  const body = await req.json();
  const { tracker_id, url, referrer } = body;

  // 1. Get User Agent from headers
  const userAgent = req.headers.get('user-agent') || '';

  // 2. Parse Device Info
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser().name || 'Unknown';
  const os = parser.getOS().name || 'Unknown';
  const deviceType = parser.getDevice().type || 'Desktop'; // Default to Desktop if undefined

  // 3. Get IP & Country (Vercel provides this automatically)
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const country = req.headers.get('x-vercel-ip-country') || 'Unknown';

  // 4. Save to Database
  const { error } = await supabase.from('visits').insert({
    tracker_id,
    url,
    referer: referrer,
    ip,
    country,
    browser,
    os,
    device_type: deviceType
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}