'use client';

import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in when page loads
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkUser();
  }, []);

  const createTracker = () => {
    // Generate a random ID for instant "Try it out" usage
    const randomId = Math.floor(100000 + Math.random() * 900000).toString();
    router.push(`/dashboard/${randomId}`);
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">

      {/* --- TOP NAVIGATION BAR --- */}
      <nav className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
        <div className="text-xl font-bold text-green-500 flex items-center gap-2">
          <span>⚡</span> Super Tracker
        </div>

        <div>
          {!loading && (
            user ? (
              // IF LOGGED IN: Show "My Dashboard"
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2 rounded-full font-medium transition-all border border-gray-700 flex items-center gap-2"
              >
                <span>👤</span> My Dashboard
              </button>
            ) : (
              // IF LOGGED OUT: Show "Login"
              <button
                onClick={() => router.push('/login')}
                className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-full font-bold transition-all shadow-lg shadow-green-900/20"
              >
                Login
              </button>
            )
          )}
        </div>
      </nav>

      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-black to-black -z-10"></div>

      <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-6 tracking-tight">
        Super Tracker ⚡
      </h1>

      <p className="text-gray-400 mb-10 text-xl max-w-lg mx-auto leading-relaxed">
        Real-time visitor tracking for your website. <br/>
        <span className="text-gray-500">Free. Instant Setup. Live Data.</span>
      </p>

      {/* Main Action Button */}
      <button
        onClick={createTracker}
        className="group relative px-8 py-4 bg-white text-black hover:bg-gray-200 font-bold rounded-full text-lg transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] active:scale-95"
      >
        <span className="flex items-center gap-2">
          🚀 Create Instant Demo
        </span>
      </button>

      <div className="mt-6 text-sm text-gray-600">
        Want to save your data? <a href="/login" className="text-green-500 hover:underline">Create an account</a>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-gray-500">
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl">⏱️</span>
          <p>Real-Time Updates</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl">🌍</span>
          <p>Country Flags</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl">📱</span>
          <p>Device Detection</p>
        </div>
      </div>
    </main>
  );
}