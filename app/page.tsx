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
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // 1. Check Auth Status
    const checkUser = async () => {
      const { data: { user: activeUser } } = await supabase.auth.getUser();
      setUser(activeUser);
    };
    checkUser();

    // 2. Track this visit
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tracker_id: DEMO_ID,
        url: window.location.href,
        referrer: document.referrer
      })
    });

    // 3. Initial Data Fetch
    const fetchInitialData = async () => {
      const fiveMins = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('tracker_id', DEMO_ID)
        .gt('created_at', fiveMins);
      if (count !== null) setOnlineCount(count);

      const { data } = await supabase
        .from('visits')
        .select('*')
        .eq('tracker_id', DEMO_ID)
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setRecentPings(data);
    };
    fetchInitialData();

    // 4. Realtime Listener
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

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <main className={`min-h-screen transition-colors duration-500 flex flex-col items-center justify-center p-6 text-center relative ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>

      {/* Navigation */}
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center max-w-6xl">
        <div className="text-xl font-black text-green-500 italic tracking-tighter">SUPER TRACKER ⚡</div>
        <div className="flex gap-4 items-center">
          {/* --- THEME TOGGLE BUTTON --- */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full border transition-all ${isDarkMode ? 'border-gray-800 bg-gray-900 text-yellow-400' : 'border-gray-300 bg-white text-indigo-600'}`}
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>

          {user ? (
            <button onClick={() => router.push('/dashboard')} className={`px-4 py-2 rounded-lg text-sm transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 border shadow-sm'}`}>Console →</button>
          ) : (
            <button onClick={() => router.push('/login')} className="text-sm font-bold opacity-70 hover:opacity-100">Login</button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="mt-20">
        <div className={`mb-6 inline-flex items-center gap-3 px-4 py-2 rounded-full border ${isDarkMode ? 'bg-green-500/10 border-green-500/20' : 'bg-green-100 border-green-200'}`}>
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isDarkMode ? 'bg-green-400' : 'bg-green-500'}`}></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className={`font-mono text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-green-500' : 'text-green-700'}`}>
            {onlineCount} Users live now
          </span>
        </div>

        <h1 className={`text-6xl md:text-8xl font-black tracking-tighter mb-6 ${isDarkMode ? 'bg-gradient-to-b from-white to-gray-600 bg-clip-text text-transparent' : 'text-gray-900'}`}>
          REAL-TIME <br/>EVERYWHERE.
        </h1>

        <p className={`text-lg md:text-xl max-w-2xl mb-10 mx-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          The open-source alternative to complex analytics.
          Get your tracking snippet and start seeing visitors instantly.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center mb-16">
          <button
            onClick={() => router.push(`/dashboard/${Math.floor(100000 + Math.random() * 900000)}`)}
            className={`px-10 py-5 rounded-2xl font-black text-xl transition-all shadow-2xl active:scale-95 ${isDarkMode ? 'bg-white text-black shadow-green-500/20 hover:bg-green-500 hover:text-white' : 'bg-gray-900 text-white hover:bg-black'}`}
          >
            Start Free Now
          </button>
        </div>
      </div>

      {/* Live Feed */}
      <div className="w-full max-w-md mb-20">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 opacity-50">Live Activity Feed</h3>
        <div className="space-y-2">
          {recentPings.map((ping, i) => (
            <div
              key={ping.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isDarkMode ? 'bg-gray-900/40 border-gray-800/50' : 'bg-white border-gray-200 shadow-sm'}`}
              style={{ opacity: 1 - (i * 0.15) }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs">{ping.country ? <img src={`https://flagcdn.com/16x12/${ping.country.toLowerCase()}.png`} alt="flag" /> : '🌍'}</span>
                <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Visitor from {ping.country || 'Unknown'}</span>
              </div>
              <span className="text-[10px] opacity-50 font-mono">
                {formatDistanceStrict(new Date(ping.created_at), new Date())} ago
              </span>
            </div>
          ))}
        </div>
      </div>

    </main>
  );
}