// app/api/track/route.ts
import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Get visitor IP and Device info
    const ip = request.headers.get('x-forwarded-for') || 'Unknown IP';
    const userAgent = request.headers.get('user-agent') || 'Unknown Device';
    const timestamp = new Date().toISOString();

    const visitData = {
      ...body,
      ip,
      userAgent,
      timestamp,
    };

    // Save to Vercel Database (Redis)
    await kv.lpush('visits', JSON.stringify(visitData));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// Allow other sites (like your Image Site) to talk to this one
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