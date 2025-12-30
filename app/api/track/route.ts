import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { UAParser } from 'ua-parser-js';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 1. HANDLE OPTIONS REQUEST (CORS PREFLIGHT)
// This tells browsers that it's okay to send data to this API from other domains.
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// 2. HANDLE POST REQUEST (TRACKING)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tracker_id, url, referrer } = body;

    // Parse the User Agent string to get Browser/OS/Device info
    const userAgent = req.headers.get('user-agent') || '';
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    // Prepare the data
    const visitData = {
      tracker_id,
      url,
      referer: referrer || 'Direct',
      ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
      country: req.headers.get('x-vercel-ip-country') || 'Unknown',
      browser: browser.name || 'Unknown',
      os: os.name || 'Unknown',
      device_type: device.type || 'Desktop' // Defaults to Desktop if type is undefined
    };

    // Insert into Supabase
    const { error } = await supabase.from('visits').insert(visitData);

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return Success with CORS Headers
    return NextResponse.json({ success: true }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (err: any) {
    console.error('Server Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}