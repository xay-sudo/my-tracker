'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { formatDistanceStrict } from 'date-fns';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DEMO_ID = 'homepage-live-demo';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [recentPings, setRecentPings] = useState<any[]>([]);

  useEffect(() => {
    // 1. Check Auth Status
    const checkUser = async () => {
      const { data: { user: activeUser } } = await supabase.auth.getUser();
      setUser(activeUser);
    };
    checkUser();

    // 2. Track this visit for the demo
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tracker_id: DEMO_ID,
        url: window.location.href,
        referrer: document.referrer
      })
    });

    // 3. Initial Data Fetch (Count + Recent Pings)
    const fetchInitialData = async () => {
      const fiveMins = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      // Get Online Count
      const { count } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('tracker_id', DEMO_ID)
        .gt('created_at', fiveMins);

      if (count !== null) setOnlineCount(count);

      // Get last 5 pings for the feed
      const { data } = await supabase
        .from('visits')
        .select('*')
        .eq('tracker_id', DEMO_ID)
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) setRecentPings(data);
    };
    fetchInitialData();

    // 4. Realtime Listener for both Count and Feed
    const channel = supabase.channel('homepage_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'visits',
        filter: `tracker_id=eq.${DEMO_ID}`
      }, (payload) => {
        setOnlineCount(p => p + 1);
        setRecentPings(prev => [payload.new, ...prev].slice(0, 5));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const startInstant = () => {
    const id = Math.floor(100000 + Math.random() * 900000).toString();
    router.push(`/dashboard/${id}`);
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center relative">

      {/* Navigation */}
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center max-w-6xl">
        <div className="text-xl font-black text-green-500 italic tracking-tighter">SUPER TRACKER ⚡</div>
        <div className="flex gap-6 items-center">
          {user ? (
            <button onClick={() => router.push('/dashboard')} className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-all">Console →</button>
          ) : (
            <button onClick={() => router.push('/login')} className="text-gray-400 hover:text-white text-sm font-bold">Login</button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="mt-20">
        <div className="mb-6 inline-flex items-center gap-3 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-green-500 font-mono text-xs font-bold uppercase tracking-widest">
            {onlineCount} Users live on this page
          </span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white to-gray-600 bg-clip-text text-transparent">
          REAL-TIME <br/>EVERYWHERE.
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10 mx-auto">
          The open-source alternative to complex analytics.
          Get your tracking snippet and start seeing visitors instantly.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center mb-16">
          <button
            onClick={startInstant}
            className="bg-white text-black px-10 py-5 rounded-2xl font-black text-xl hover:bg-green-500 hover:text-white transition-all shadow-2xl shadow-green-500/20 active:scale-95"
          >
            Start Free Now
          </button>
          <button
            onClick={() => router.push('/login')}
            className="bg-gray-900 text-white px-10 py-5 rounded-2xl font-black text-xl border border-gray-800 hover:border-gray-600 transition-all"
          >
            Create Account
          </button>
        </div>
      </div>

      {/* --- LIVE FEED COMPONENT --- */}
      <div className="w-full max-w-md mb-20">
        <h3 className="text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Live Activity Feed</h3>
        <div className="space-y-2">
          {recentPings.map((ping, i) => (
            <div
              key={ping.id}
              className="flex items-center justify-between bg-gray-900/40 border border-gray-800/50 p-3 rounded-xl animate-fade-in-down"
              style={{ opacity: 1 - (i * 0.15) }} // Fade older items
            >
              <div className="flex items-center gap-3">
                <span className="text-xs">{ping.country ? <img src={`https://flagcdn.com/16x12/${ping.country.toLowerCase()}.png`} /> : '🌍'}</span>
                <span className="text-xs text-gray-300 font-medium">New visitor from {ping.country || 'Unknown'}</span>
              </div>
              <span className="text-[10px] text-gray-600 font-mono">
                {formatDistanceStrict(new Date(ping.created_at), new Date())} ago
              </span>
            </div>
          ))}
          {recentPings.length === 0 && <p className="text-gray-700 text-xs italic">Waiting for pings...</p>}
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-gray-900/30 border border-gray-800 rounded-[2rem] overflow-hidden">
        <div className="p-10 border-b md:border-b-0 md:border-r border-gray-800 text-left">
          <h4 className="text-white font-bold mb-4">Free Tracker</h4>
          <p className="text-gray-500 text-sm mb-6">Perfect for quick projects and temporary blogs.</p>
          <ul className="space-y-3 text-sm text-gray-400">
            <li>• Instant setup (No Login)</li>
            <li>• Live Counter</li>
            <li>• Real-time World Map</li>
          </ul>
        </div>
        <div className="p-10 text-left bg-green-500/[0.02]">
          <h4 className="text-green-500 font-bold mb-4">Pro Account</h4>
          <p className="text-gray-500 text-sm mb-6">Full control for serious developers and businesses.</p>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="text-gray-200 font-medium">• 30-Day History Storage</li>
            <li className="text-gray-200 font-medium">• Browser & OS Analytics</li>
            <li className="text-gray-200 font-medium">• Manage Multiple Sites</li>
            <li className="text-gray-200 font-medium">• Password Recovery</li>
          </ul>
        </div>
      </div>

    </main>
  );
}