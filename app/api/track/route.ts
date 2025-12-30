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

  const userAgent = req.headers.get('user-agent') || '';
  const parser = new UAParser(userAgent);

  const data = {
    tracker_id,
    url,
    referer: referrer || 'Direct',
    ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
    country: req.headers.get('x-vercel-ip-country') || 'Unknown',
    browser: parser.getBrowser().name || 'Unknown',
    os: parser.getOS().name || 'Unknown',
    device_type: parser.getDevice().type || 'Desktop'
  };

  const { error } = await supabase.from('visits').insert(data);
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