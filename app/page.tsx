'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Just check if they happen to be logged in (for the corner button)
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, []);

  const createInstantTracker = () => {
    // 1. Generate a random ID (e.g. 559201)
    const randomId = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Go straight to the dashboard. NO LOGIN REQUIRED.
    router.push(`/dashboard/${randomId}`);
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">

      {/* --- OPTIONAL LOGIN BUTTON (Top Right) --- */}
      <div className="absolute top-6 right-6 z-10">
        {user ? (
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
          >
            Go to My Saved Sites →
          </button>
        ) : (
          <button
            onClick={() => router.push('/login')}
            className="text-gray-500 hover:text-white text-sm font-medium transition-colors"
          >
            Login / Save Data
          </button>
        )}
      </div>

      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-900/10 via-black to-black -z-10"></div>

      <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-6 tracking-tight">
        Super Tracker ⚡
      </h1>

      <p className="text-gray-400 mb-10 text-xl max-w-lg mx-auto leading-relaxed">
        Free real-time visitor tracking. <br/>
        <span className="text-gray-500">No account required. Just click and use.</span>
      </p>

      {/* --- MAIN ACTION: INSTANT & FREE --- */}
      <button
        onClick={createInstantTracker}
        className="group relative px-10 py-5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-full text-xl transition-all shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:shadow-[0_0_50px_rgba(34,197,94,0.6)] active:scale-95"
      >
        Click to Get Free Tracker 🚀
      </button>

      <p className="mt-8 text-gray-600 text-sm">
        Generates a unique dashboard instantly.
      </p>

    </main>
  );
}