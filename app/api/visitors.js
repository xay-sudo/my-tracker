// File: api/visitors.js
export default function handler(req, res) {
  // 1. THIS IS WHERE THE REAL LOGIC GOES
  // Later, we will connect this to your database (Firebase/Supabase)

  // For now, let's send a fake "real" number to test the connection
  const count = Math.floor(Math.random() * (150 - 100) + 100); // Random number between 100-150

  // 2. Send the answer back to the phone
  res.status(200).json({
    online_users: count,
    status: "active"
  });
}