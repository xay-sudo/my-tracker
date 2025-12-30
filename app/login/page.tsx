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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState('login'); // 'login', 'signup', 'forgot'
  const [message, setMessage] = useState('');

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) router.replace('/dashboard');
    });
  }, [router]);

  const handleAuth = async (e: any) => {
    e.preventDefault();
    const action = view === 'signup' ? supabase.auth.signUp : supabase.auth.signInWithPassword;
    const { error } = await action({ email, password });
    if (error) setMessage(error.message);
  };

  const handleGoogle = () => supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/login` }
  });

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-6">
          {view === 'signup' ? 'Create Account' : view === 'forgot' ? 'Reset' : 'Login'}
        </h1>

        {message && <div className="p-3 bg-red-900/20 text-red-400 border border-red-900 rounded mb-4 text-sm">{message}</div>}

        <div className="flex flex-col gap-4">
          {view !== 'forgot' && (
            <button onClick={handleGoogle} className="bg-white text-black font-bold p-3 rounded flex items-center justify-center gap-2">
              Continue with Google
            </button>
          )}

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <input type="email" placeholder="Email" className="bg-black border border-gray-800 p-3 rounded" value={email} onChange={e => setEmail(e.target.value)} required />
            {view !== 'forgot' && <input type="password" placeholder="Password" className="bg-black border border-gray-800 p-3 rounded" value={password} onChange={e => setPassword(e.target.value)} required />}
            <button className="bg-green-600 p-3 rounded font-bold">Submit</button>
          </form>

          <div className="flex flex-col gap-2 text-center text-sm text-gray-500">
             <button onClick={() => setView(view === 'login' ? 'signup' : 'login')}>{view === 'login' ? 'Need an account?' : 'Have an account?'}</button>
             {view === 'login' && <button onClick={() => setView('forgot')}>Forgot Password?</button>}
          </div>
        </div>
      </div>
    </main>
  );
}