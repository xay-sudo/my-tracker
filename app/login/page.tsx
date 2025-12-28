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

  // 1. Handle Email Login (Magic Link)
  const handleEmailLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    // Calculate the correct redirect URL (works on localhost AND Vercel)
    const returnUrl = `${window.location.origin}/dashboard`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: returnUrl }
    });

    if (error) {
      setMessage('Error: ' + error.message);
      setLoading(false);
    } else {
      setMessage('✅ Check your email for the login link!');
      setLoading(false);
    }
  };

  // 2. Handle Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    const returnUrl = `${window.location.origin}/dashboard`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: returnUrl,
      },
    });

    if (error) {
      setMessage('Google Error: ' + error.message);
      setLoading(false);
    }
    // Note: If successful, the user is redirected away immediately.
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 p-8 rounded-xl shadow-2xl relative overflow-hidden">

        {/* Background Glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-blue-500"></div>

        <h1 className="text-2xl font-bold text-center mb-2 text-white">Welcome Back</h1>
        <p className="text-gray-500 text-center mb-8 text-sm">Sign in to manage your trackers</p>

        {message && (
          <div className="bg-green-900/30 text-green-400 p-3 rounded mb-6 text-center border border-green-800/50 text-sm">
            {message}
          </div>
        )}

        <div className="flex flex-col gap-4">

          {/* --- GOOGLE LOGIN BUTTON --- */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex items-center justify-center gap-3 bg-white text-gray-900 font-bold p-3 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span>Connecting...</span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 my-2">
            <div className="h-px bg-gray-800 flex-1"></div>
            <span className="text-gray-500 text-xs uppercase">Or with Email</span>
            <div className="h-px bg-gray-800 flex-1"></div>
          </div>

          {/* --- EMAIL LOGIN FORM --- */}
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="name@example.com"
              className="bg-black border border-gray-800 p-3 rounded text-white focus:border-green-500 focus:outline-none placeholder-gray-600 transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              disabled={loading}
              className="bg-green-600 hover:bg-green-500 text-white font-bold p-3 rounded transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(22,163,74,0.3)]"
            >
              {loading ? 'Sending Link...' : 'Send Magic Link'}
            </button>
          </form>

        </div>
      </div>
    </main>
  );
}