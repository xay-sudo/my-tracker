'use client';

import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const router = useRouter();

  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState('login'); // Options: 'login', 'signup', 'forgot_password'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // --- 1. CRITICAL: SESSION LISTENER ---
  // This waits for Google to send the user back, catches the token, and redirects.
  useEffect(() => {
    const checkSession = async () => {
      // Check if session exists immediately (e.g. after Google redirect)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/dashboard'); // Use replace to prevent "Back" button loops
      }
    };

    checkSession();

    // Listen for realtime auth changes (Login success, Google success, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.replace('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // --- 2. HANDLE EMAIL AUTH ---
  const handleAuth = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (view === 'signup') {
      // Sign Up
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage('Error: ' + error.message);
      } else {
        setMessage('✅ Account created! Logging you in...');
        // The useEffect above will handle the redirect
      }
    } else {
      // Login
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage('Error: ' + error.message);
      }
      // If success, the useEffect above handles the redirect
    }
    setLoading(false);
  };

  // --- 3. HANDLE GOOGLE LOGIN ---
  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // IMPORTANT: Redirect back to /login first so the listener captures the token
        redirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) setMessage(error.message);
    setLoading(false);
  };

  // --- 4. HANDLE PASSWORD RESET ---
  const handleResetPassword = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      setMessage('Error: ' + error.message);
    } else {
      setMessage('✅ Check your email for the password reset link!');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 p-8 rounded-xl shadow-2xl relative overflow-hidden">

        {/* Title */}
        <h1 className="text-3xl font-bold text-center mb-2 text-white">
          {view === 'signup' ? 'Create Account' : view === 'forgot_password' ? 'Reset Password' : 'Welcome Back'}
        </h1>
        <p className="text-gray-500 text-center mb-8 text-sm">
          {view === 'signup' ? 'Start tracking your websites today'
            : view === 'forgot_password' ? 'Enter your email to get a reset link'
            : 'Sign in to manage your trackers'}
        </p>

        {/* Error/Success Message */}
        {message && (
          <div className={`p-3 rounded mb-6 text-center border text-sm ${message.includes('Error') ? 'bg-red-900/30 text-red-400 border-red-900' : 'bg-green-900/30 text-green-400 border-green-900'}`}>
            {message}
          </div>
        )}

        <div className="flex flex-col gap-4">

          {/* Google Button (Only show on Login/Signup views) */}
          {view !== 'forgot_password' && (
            <>
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex items-center justify-center gap-3 bg-white text-gray-900 font-bold p-3 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                 <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                 <span>{view === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}</span>
              </button>

              <div className="flex items-center gap-2 my-2">
                <div className="h-px bg-gray-800 flex-1"></div>
                <span className="text-gray-500 text-xs uppercase">Or with Email</span>
                <div className="h-px bg-gray-800 flex-1"></div>
              </div>
            </>
          )}

          {/* Main Form */}
          <form onSubmit={view === 'forgot_password' ? handleResetPassword : handleAuth} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email address"
              className="bg-black border border-gray-800 p-3 rounded text-white focus:border-green-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* Password Field (Hidden in Forgot Password view) */}
            {view !== 'forgot_password' && (
              <input
                type="password"
                placeholder="Password"
                className="bg-black border border-gray-800 p-3 rounded text-white focus:border-green-500 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            )}

            <button
              disabled={loading}
              className="bg-green-600 hover:bg-green-500 text-white font-bold p-3 rounded transition-colors disabled:opacity-50 shadow-lg shadow-green-900/20"
            >
              {loading ? 'Processing...' : (view === 'signup' ? 'Create Account' : view === 'forgot_password' ? 'Send Reset Link' : 'Sign In')}
            </button>
          </form>

          {/* Toggle Links */}
          <div className="text-center text-gray-500 text-sm mt-4 flex flex-col gap-2">

            {view === 'login' && (
              <>
                <button onClick={() => setView('forgot_password')} className="hover:text-white transition-colors">
                  Forgot Password?
                </button>
                <p>
                  Don't have an account?{' '}
                  <button onClick={() => { setView('signup'); setMessage(''); }} className="text-green-500 hover:underline font-bold">
                    Sign Up
                  </button>
                </p>
              </>
            )}

            {view === 'signup' && (
              <p>
                Already have an account?{' '}
                <button onClick={() => { setView('login'); setMessage(''); }} className="text-green-500 hover:underline font-bold">
                  Log In
                </button>
              </p>
            )}

            {view === 'forgot_password' && (
              <button onClick={() => { setView('login'); setMessage(''); }} className="text-green-500 hover:underline font-bold">
                ← Back to Login
              </button>
            )}

          </div>

        </div>
      </div>
    </main>
  );
}