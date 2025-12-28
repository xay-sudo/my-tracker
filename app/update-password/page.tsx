'use client';

import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UpdatePassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 1. Check if the user is actually valid (clicked the link)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // If no session, the link is invalid or expired
        router.push('/login');
      }
    };
    checkSession();
  }, [router]);

  // 2. Handle the Password Update
  const handleUpdate = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setMessage('Error: ' + error.message);
    } else {
      setMessage('✅ Password updated! Redirecting...');
      setTimeout(() => {
        router.push('/dashboard'); // Go to dashboard on success
      }, 1500);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 p-8 rounded-xl shadow-2xl">

        <h1 className="text-2xl font-bold text-center mb-2 text-white">
          Set New Password
        </h1>
        <p className="text-gray-500 text-center mb-8 text-sm">
          Please enter your new password below.
        </p>

        {message && (
          <div className={`p-3 rounded mb-6 text-center border text-sm ${message.includes('Error') ? 'bg-red-900/30 text-red-400 border-red-900' : 'bg-green-900/30 text-green-400 border-green-900'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="New Password"
            className="bg-black border border-gray-800 p-3 rounded text-white focus:border-green-500 focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          <button
            disabled={loading}
            className="bg-green-600 hover:bg-green-500 text-white font-bold p-3 rounded transition-colors disabled:opacity-50 shadow-lg shadow-green-900/20"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

      </div>
    </main>
  );
}