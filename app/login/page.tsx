'use client';

import { createClient } from '@supabase/supabase-js';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    // Magic Link Login (Passwordless)
    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      setMessage('Error: ' + error.message);
    } else {
      setMessage('Check your email for the login link!');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 p-8 rounded-xl shadow-2xl">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome Back</h1>

        {message ? (
          <div className="bg-green-900/50 text-green-300 p-4 rounded mb-4 text-center border border-green-800">
            {message}
          </div>
        ) : (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="bg-black border border-gray-700 p-3 rounded text-white focus:border-green-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              disabled={loading}
              className="bg-green-600 hover:bg-green-500 text-white font-bold p-3 rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending Link...' : 'Sign In with Email'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}