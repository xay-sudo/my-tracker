// File: api/visitors.js

export default function handler(req, res) {
  // 1. SIMULATE REAL DATA
  // Since we haven't connected a real database (like Firebase) yet,
  // we will generate a realistic number that changes slightly every time.

  // This generates a random number between 120 and 160
  const min = 120;
  const max = 160;
  const randomCount = Math.floor(Math.random() * (max - min + 1) + min);

  // 2. SET HEADERS
  // This tells the browser/app that the data is JSON
  res.setHeader('Content-Type', 'application/json');

  // (Optional) Allow your Flutter app to access this from anywhere
  res.setHeader('Access-Control-Allow-Origin', '*');

  // 3. SEND THE RESPONSE
  // The 'online_users' key MUST match what is in your Flutter code
  res.status(200).json({
    online_users: randomCount,
    status: "active",
    region: "kh" // simulation
  });
}