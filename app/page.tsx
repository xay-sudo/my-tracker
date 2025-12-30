'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DEMO_ID = 'homepage-live-demo';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    // 1. Check Auth Status
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    // 2. Self-Track (Demo Function)
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tracker_id: DEMO_ID, url: window.location.href, referrer: document.referrer })
    });

    // 3. Live Stats for Demo
    const fetchStats = async () => {
      const fiveMins = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count } = await supabase.from('visits').select('*', { count: 'exact', head: true }).eq('tracker_id', DEMO_ID).gt('created_at', fiveMins);
      if (count !== null) setOnlineCount(count);
    };
    fetchStats();

    // 4. Realtime Listener
    const channel = supabase.channel('demo_stats')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'visits', filter: `tracker_id=eq.${DEMO_ID}` }, () => setOnlineCount(p => p + 1))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const startInstant = () => {
    const id = Math.floor(100000 + Math.random() * 900000).toString();
    router.push(`/dashboard/${id}`);
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">

      {/* Navigation */}
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center max-w-6xl">
        <div className="text-xl font-black text-green-500 italic">SUPER TRACKER</div>
        <div className="flex gap-6 items-center">
          {user ? (
            <button onClick={() => router.push('/dashboard')} className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-all">My Console →</button>
          ) : (
            <button onClick={() => router.push('/login')} className="text-gray-400 hover:text-white text-sm font-bold">Login</button>
          )}
        </div>
      </nav>

      {/* --- LIVE DEMO BADGE --- */}
      <div className="mb-6 flex items-center gap-3 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-green-500 font-mono text-xs font-bold uppercase tracking-widest">
          {onlineCount} People browsing this demo now
        </span>
      </div>

      <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
        TRACKING <br/>MADE SIMPLE.
      </h1>

      <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
        Get real-time analytics for your website in 10 seconds.
        No cookies, no bloat, just the data you need.
      </p>

      {/* --- FREE ACTION --- */}
      <div className="flex flex-col md:flex-row gap-4 mb-20">
        <button
          onClick={startInstant}
          className="bg-white text-black px-10 py-5 rounded-2xl font-black text-xl hover:bg-green-500 hover:text-white transition-all shadow-2xl shadow-green-500/20 active:scale-95"
        >
          Create Free Tracker ⚡
        </button>
        <button
          onClick={() => router.push('/login')}
          className="bg-gray-900 text-white px-10 py-5 rounded-2xl font-black text-xl border border-gray-800 hover:border-gray-600 transition-all"
        >
          Sign Up for Full Power
        </button>
      </div>

      {/* --- COMPARISON TABLE --- */}
      <div className="w-full max-w-3xl bg-gray-900/50 border border-gray-800 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="grid grid-cols-2 text-sm">
          <div className="p-8 border-r border-gray-800">
            <h3 className="text-gray-400 uppercase font-bold mb-6 tracking-widest">Free User</h3>
            <ul className="space-y-4 text-left">
              <li className="flex gap-2">✅ <span className="text-gray-300">Live Traffic Counter</span></li>
              <li className="flex gap-2">✅ <span className="text-gray-300">World Map View</span></li>
              <li className="flex gap-2">❌ <span className="text-gray-600 line-through">Saved History</span></li>
              <li className="flex gap-2">❌ <span className="text-gray-600 line-through">Multiple Sites</span></li>
            </ul>
          </div>
          <div className="p-8 bg-green-500/5">
            <h3 className="text-green-500 uppercase font-bold mb-6 tracking-widest">Logged In</h3>
            <ul className="space-y-4 text-left">
              <li className="flex gap-2">✅ <span className="text-gray-100 font-bold">Everything in Free</span></li>
              <li className="flex gap-2">✅ <span className="text-gray-100 font-bold">30-Day History</span></li>
              <li className="flex gap-2">✅ <span className="text-gray-100 font-bold">Browser & OS Analytics</span></li>
              <li className="flex gap-2">✅ <span className="text-gray-100 font-bold">CSV Data Export</span></li>
            </ul>
          </div>
        </div>
      </div>

    </main>
  );
}