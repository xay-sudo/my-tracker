'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// We use a special ID just for the homepage
const DEMO_TRACKER_ID = 'live-homepage-demo';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    // 1. Check if user is logged in (for the corner button)
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    // 2. TRACK THIS VISIT (Self-Tracking)
    // We send a ping to our own API with the special DEMO ID
    if (typeof window !== 'undefined') {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracker_id: DEMO_TRACKER_ID,
          url: window.location.href,
          referrer: document.referrer
        })
      });
    }

    // 3. GET LIVE VISITOR COUNT
    const fetchLiveCount = async () => {
      // Count visitors in the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true }) // 'head' means just count, don't fetch data
        .eq('tracker_id', DEMO_TRACKER_ID)
        .gt('created_at', fiveMinutesAgo);

      if (count !== null) setOnlineCount(count);
    };

    fetchLiveCount();

    // 4. LISTEN FOR REALTIME UPDATES
    const channel = supabase
      .channel('homepage_stats')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'visits', filter: `tracker_id=eq.${DEMO_TRACKER_ID}` },
        () => {
          // When a new person visits, update the number nicely
          setOnlineCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };

  }, []);

  const createInstantTracker = () => {
    const randomId = Math.floor(100000 + Math.random() * 900000).toString();
    router.push(`/dashboard/${randomId}`);
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">

      {/* --- TOP RIGHT BUTTON --- */}
      <div className="absolute top-6 right-6 z-10">
        {user ? (
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white text-sm font-medium transition-colors border border-gray-800 px-4 py-2 rounded-full hover:bg-gray-900"
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
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-black to-black -z-10"></div>

      {/* --- LIVE DEMO BADGE (NEW!) --- */}
      <div className="mb-8 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 bg-gray-900/80 border border-green-900/50 px-4 py-2 rounded-full backdrop-blur-md shadow-lg shadow-green-900/20">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-green-400 font-mono font-bold text-sm">
            {onlineCount} People Online Now
          </span>
        </div>
      </div>

      <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-6 tracking-tight">
        Super Tracker ⚡
      </h1>

      <p className="text-gray-400 mb-10 text-xl max-w-lg mx-auto leading-relaxed">
        Free real-time visitor tracking. <br/>
        <span className="text-gray-500">See who is on your site, right now.</span>
      </p>

      {/* --- MAIN ACTION --- */}
      <button
        onClick={createInstantTracker}
        className="group relative px-10 py-5 bg-white text-black hover:bg-gray-200 font-bold rounded-full text-xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] active:scale-95"
      >
        <span className="flex items-center gap-2">
          Create My Free Tracker 🚀
        </span>
      </button>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-gray-500 border-t border-gray-900 pt-12 w-full max-w-4xl">
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl">⚡</span>
          <p>Real-Time Updates</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl">🌍</span>
          <p>Live Map Visuals</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl">📱</span>
          <p>Device Analytics</p>
        </div>
      </div>

    </main>
  );
}