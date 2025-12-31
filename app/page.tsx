'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { formatDistanceStrict } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
// Assuming WorldMap is in the same folder structure. If it fails, check the path.
import WorldMap from './components/WorldMap';

// --- 1. Added Type Definitions (Fixes "any" errors) ---
interface Visit {
  id: number;
  created_at: string;
  country: string | null;
  city?: string | null;
  device?: string | null;
  tracker_id: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DEMO_ID = 'homepage-live-demo';
const LIVE_URL = 'https://my-tracker-two.vercel.app'; // Your actual Vercel URL
const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#a855f7'];

const MOCK_DEVICES = [
  { name: 'Mobile', value: 65 },
  { name: 'Desktop', value: 30 },
  { name: 'Tablet', value: 5 },
];

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  // --- 2. Applied Types here ---
  const [recentPings, setRecentPings] = useState<Visit[]>([]);
  const [demoVisits, setDemoVisits] = useState<Visit[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // 1. Check User Session
    const checkUser = async () => {
      const { data: { user: activeUser } } = await supabase.auth.getUser();
      setUser(activeUser);
    };
    checkUser();

    // 2. Track Self (The current visitor)
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tracker_id: DEMO_ID,
        url: typeof window !== 'undefined' ? window.location.href : '',
        referrer: typeof document !== 'undefined' ? document.referrer : ''
      })
    }).catch(err => console.error("Tracking failed:", err));

    // 3. Fetch Initial Data (Last 5 mins & Recent 20)
    const fetchInitialData = async () => {
      const fiveMins = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      // Get count
      const { count } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('tracker_id', DEMO_ID)
        .gt('created_at', fiveMins);

      if (count !== null) setOnlineCount(count);

      // Get recent visits
      const { data } = await supabase
        .from('visits')
        .select('*')
        .eq('tracker_id', DEMO_ID)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setRecentPings(data.slice(0, 5));
        setDemoVisits(data);
      }
    };
    fetchInitialData();

    // 4. Realtime Subscription
    const channel = supabase.channel('homepage_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'visits',
        filter: `tracker_id=eq.${DEMO_ID}`
      }, (payload) => {
        const newVisit = payload.new as Visit;
        setOnlineCount(prev => prev + 1);
        setRecentPings(prev => [newVisit, ...prev].slice(0, 5));
        setDemoVisits(prev => [newVisit, ...prev].slice(0, 20));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // --- 3. Fixed Installation Snippet with REAL URL ---
  const installSnippet = `<script>
(function() {
  fetch('${LIVE_URL}/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      tracker_id: 'YOUR_ID', 
      url: window.location.href, 
      referrer: document.referrer 
    })
  });
})();
</script>`;

  return (
    <main className={`min-h-screen transition-colors duration-500 flex flex-col items-center pt-24 p-6 text-center relative ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>

      {/* --- FIXED HEADER --- */}
      <header className={`fixed top-0 w-full z-50 border-b backdrop-blur-md transition-all ${isDarkMode ? 'bg-black/70 border-gray-800' : 'bg-white/70 border-gray-200'}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="text-xl font-black text-green-500 italic tracking-tighter">SUPER TRACKER</span>
          </div>

          <div className="flex gap-4 items-center">
            <nav className="hidden md:flex gap-6 mr-4">
              <a href="#preview" className="text-sm font-medium opacity-60 hover:opacity-100 transition-opacity">Live Demo</a>
              <a href="#install" className="text-sm font-medium opacity-60 hover:opacity-100 transition-opacity">Installation</a>
            </nav>

            <button onClick={toggleTheme} className={`p-2 rounded-full border transition-all ${isDarkMode ? 'border-gray-800 bg-gray-900 text-yellow-400' : 'border-gray-300 bg-white text-indigo-600 shadow-sm'}`}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            {user ? (
              <button onClick={() => router.push('/dashboard')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isDarkMode ? 'bg-white text-black' : 'bg-gray-900 text-white'}`}>Dashboard</button>
            ) : (
              <button onClick={() => router.push('/login')} className={`px-4 py-2 rounded-lg text-sm font-bold border ${isDarkMode ? 'border-gray-800 hover:bg-gray-900' : 'border-gray-300 hover:bg-gray-50 shadow-sm'}`}>Login</button>
            )}
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="mt-16 mb-12 animate-fade-in-up">
        <div className={`mb-6 inline-flex items-center gap-3 px-4 py-2 rounded-full border ${isDarkMode ? 'bg-green-500/10 border-green-500/20' : 'bg-green-100 border-green-200'}`}>
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isDarkMode ? 'bg-green-400' : 'bg-green-500'}`}></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className={`font-mono text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-green-500' : 'text-green-700'}`}>
            {onlineCount} Users browsing the demo live
          </span>
        </div>

        <h1 className={`text-6xl md:text-8xl font-black tracking-tighter mb-6 ${isDarkMode ? 'bg-gradient-to-b from-white to-gray-600 bg-clip-text text-transparent' : 'text-gray-900'}`}>
          ANALYTICS <br/>WITHOUT LIMITS.
        </h1>
        <button
          onClick={() => router.push('/login')}
          className={`px-10 py-5 rounded-2xl font-black text-xl transition-all shadow-2xl active:scale-95 ${isDarkMode ? 'bg-white text-black hover:bg-green-500 hover:text-white' : 'bg-gray-900 text-white'}`}
        >
          Start Tracking Now →
        </button>
      </section>

      {/* --- LIVE PREVIEW --- */}
      <section id="preview" className="w-full max-w-5xl mb-20">
        <div className={`rounded-3xl border overflow-hidden shadow-2xl transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800 shadow-green-900/10' : 'bg-white border-gray-200 shadow-xl'}`}>
          <div className={`h-8 w-full border-b flex items-center px-4 gap-2 ${isDarkMode ? 'bg-black border-gray-800' : 'bg-gray-100 border-gray-200'}`}>
             <div className="w-3 h-3 rounded-full bg-red-500"></div>
             <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
             <div className="w-3 h-3 rounded-full bg-green-500"></div>
             <div className="ml-4 text-[10px] font-mono opacity-40">dashboard.supertracker.com</div>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold">Your Website Stats</h3>
               <span className="text-xs bg-green-500 text-white px-2 py-1 rounded font-bold uppercase">Live View</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* Live Visitors Card */}
               <div className={`col-span-1 rounded-2xl p-6 flex flex-col justify-center border ${isDarkMode ? 'bg-black border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                  <span className="text-xs uppercase font-bold opacity-50 mb-2">Live Visitors</span>
                  <span className="text-6xl font-black tracking-tighter">{onlineCount}</span>
               </div>

               {/* Map Card */}
               <div className="col-span-2 h-64 rounded-2xl overflow-hidden relative">
                  <WorldMap visits={demoVisits} />
                  <div className="absolute inset-0 pointer-events-none border rounded-2xl opacity-10"></div>
               </div>

               {/* Devices Card */}
               <div className={`col-span-1 h-64 rounded-2xl p-4 border flex flex-col ${isDarkMode ? 'bg-black border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                  <span className="text-xs uppercase font-bold opacity-50 mb-2">Device Usage</span>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={MOCK_DEVICES} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                        {MOCK_DEVICES.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
               </div>

               {/* Activity Log */}
               <div className={`col-span-2 h-64 rounded-2xl p-4 border overflow-hidden ${isDarkMode ? 'bg-black border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                  <span className="text-xs uppercase font-bold opacity-50 mb-4 block">Recent Activity</span>
                  <div className="space-y-3">
                    {recentPings.map((ping, i) => (
                      <div key={ping.id || i} className="flex items-center justify-between opacity-80 text-sm">
                        <div className="flex items-center gap-2">
                           {ping.country ? (
                             // eslint-disable-next-line @next/next/no-img-element
                             <img src={`https://flagcdn.com/16x12/${ping.country.toLowerCase()}.png`} alt={ping.country} />
                           ) : '🌍'}
                           <span>New visitor from {ping.country || 'Unknown'}</span>
                        </div>
                        <span className="font-mono text-xs opacity-50">
                            {/* 4. Added Date Fallback to prevent crash */}
                           {formatDistanceStrict(new Date(ping.created_at || new Date()), new Date())} ago
                        </span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- LIVE FEED --- */}
      <div className="w-full max-w-md mb-32">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 opacity-30 italic">Global Activity Feed</h3>
        <div className="space-y-2">
          {recentPings.map((ping, i) => (
            <div
              key={ping.id || i}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isDarkMode ? 'bg-gray-900/40 border-gray-800/50' : 'bg-white border-gray-200 shadow-sm'}`}
              style={{ opacity: 1 - (i * 0.15) }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs">
                    {ping.country ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`https://flagcdn.com/16x12/${ping.country.toLowerCase()}.png`} alt={ping.country} />
                    ) : '🌍'}
                </span>
                <span className="text-xs font-medium">Visitor from {ping.country || 'Unknown'}</span>
              </div>
              <span className="text-[10px] opacity-40 font-mono">
                {formatDistanceStrict(new Date(ping.created_at || new Date()), new Date())} ago
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* --- INSTALLATION GUIDE --- */}
      <section id="install" className="w-full max-w-4xl mb-24 text-left animate-fade-in-up">
        <div className={`p-8 md:p-12 rounded-[2.5rem] border ${isDarkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200 shadow-xl'}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h2 className="text-3xl font-black mb-2">Ready to start?</h2>
              <p className="opacity-60 max-w-lg">Copy this snippet and paste it into your website's <code>&lt;head&gt;</code> tag.</p>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 md:mt-0 bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded-xl transition-all"
            >
              Get Your ID →
            </button>
          </div>

          <div className="relative group">
            <pre className={`p-6 rounded-2xl font-mono text-sm overflow-x-auto border ${isDarkMode ? 'bg-black border-gray-800 text-green-400' : 'bg-gray-50 border-gray-200 text-green-700'}`}>
              {installSnippet}
            </pre>
            <button
              onClick={() => { navigator.clipboard.writeText(installSnippet); alert("Copied!"); }}
              className="absolute top-4 right-4 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              COPY CODE
            </button>
          </div>

          <p className="text-center text-xs opacity-30 mt-8">Works with WordPress, React, Vue, Wix, Squarespace, and more.</p>
        </div>
      </section>

    </main>
  );
}