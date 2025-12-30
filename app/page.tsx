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
    const checkUser = async () => {
      const { data: { user: activeUser } } = await supabase.auth.getUser();
      setUser(activeUser);
    };
    checkUser();

    // Self-track for demo purposes
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tracker_id: DEMO_ID,
        url: window.location.href,
        referrer: document.referrer
      })
    });

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

  // Example installation code for the UI
  const installSnippet = `<script>
(function() {
  fetch('https://your-site.vercel.app/api/track', {
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
              <a href="#how-it-works" className="text-sm font-medium opacity-60 hover:opacity-100 transition-opacity">How it Works</a>
              <a href="#install" className="text-sm font-medium opacity-60 hover:opacity-100 transition-opacity">Installation</a>
            </nav>

            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full border transition-all ${isDarkMode ? 'border-gray-800 bg-gray-900 text-yellow-400' : 'border-gray-300 bg-white text-indigo-600 shadow-sm'}`}
            >
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

      {/* Hero Section */}
      <section className="mt-16 mb-24">
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

      {/* --- INSTALLATION GUIDE SECTION (NEW) --- */}
      <section id="install" className="w-full max-w-4xl mb-32 text-left">
        <div className={`p-8 md:p-12 rounded-[2.5rem] border ${isDarkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200 shadow-xl'}`}>
          <h2 className="text-3xl font-black mb-4">How to install</h2>
          <p className="opacity-60 mb-8 max-w-xl">Copy the code below and paste it into the <code>&lt;head&gt;</code> of your website. Your data will start appearing in the dashboard instantly.</p>

          <div className="relative group">
            <pre className={`p-6 rounded-2xl font-mono text-sm overflow-x-auto border ${isDarkMode ? 'bg-black border-gray-800 text-green-400' : 'bg-gray-50 border-gray-200 text-green-700'}`}>
              {installSnippet}
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(installSnippet);
                alert("Installation code copied!");
              }}
              className="absolute top-4 right-4 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              COPY
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {[
              { num: "01", title: "Create ID", desc: "Sign up and create a unique Tracker ID for each project." },
              { num: "02", title: "Paste Code", desc: "Add the snippet to your HTML. It works on any platform (WordPress, React, etc)." },
              { num: "03", title: "View Stats", desc: "Open your dashboard and watch visitors arrive in real-time." }
            ].map((step, i) => (
              <div key={i} className="flex flex-col gap-2">
                <span className="text-green-500 font-black text-2xl">{step.num}</span>
                <h4 className="font-bold">{step.title}</h4>
                <p className="text-sm opacity-50">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Feed */}
      <div className="w-full max-w-md mb-20">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 opacity-30 italic">Demo Activity Feed</h3>
        <div className="space-y-2">
          {recentPings.map((ping, i) => (
            <div
              key={ping.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isDarkMode ? 'bg-gray-900/40 border-gray-800/50' : 'bg-white border-gray-200 shadow-sm'}`}
              style={{ opacity: 1 - (i * 0.15) }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs">{ping.country ? <img src={`https://flagcdn.com/16x12/${ping.country.toLowerCase()}.png`} alt="flag" /> : '🌍'}</span>
                <span className="text-xs font-medium">Visitor from {ping.country || 'Unknown'}</span>
              </div>
              <span className="text-[10px] opacity-40 font-mono">
                {formatDistanceStrict(new Date(ping.created_at), new Date())} ago
              </span>
            </div>
          ))}
        </div>
      </div>

    </main>
  );
}