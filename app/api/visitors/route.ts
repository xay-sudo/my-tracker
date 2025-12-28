import { NextResponse } from 'next/server';

export async function GET() {
  // 1. Generate a random number for testing (120 - 160)
  const min = 120;
  const max = 160;
  const count = Math.floor(Math.random() * (max - min + 1) + min);

  // 2. Return the JSON response
  return NextResponse.json({
    online_users: count,
    status: "active",
    region: "kh"
  }, {
    headers: {
      // Allow your Flutter app to access this data
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}