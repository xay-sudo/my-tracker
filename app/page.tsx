'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Dashboard() {
  const [visits, setVisits] = useState<any[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);

  // Helper to fetch latest data
  const fetchData = async () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

    // 1. Get recent visits list (limit 20 for cleaner look)
    const { data: recentVisits } = await supabase
      .from('visits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (recentVisits) setVisits(recentVisits);

    // 2. Count "Active" users (visits in last 5 minutes)
    const { count } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', fiveMinutesAgo);

    setOnlineCount(count || 0);
  };

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Refresh "Online Count" every 1 minute (to drop old users)
    const interval = setInterval(fetchData, 60000);

    // Real-time Subscription (Instantly adds new hits)
    const channel = supabase
      .channel('realtime_visits')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'visits' },
        (payload) => {
          // Add new visit to top of list
          setVisits((prev) => [payload.new, ...prev.slice(0, 19)]);
          // Increment "Online Now" instantly
          setOnlineCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return (
    <main className="min-h-screen bg-black text-white font-sans p-6 flex flex-col items-center">

      {/* --- BIG COUNTER (whos.amung.us Style) --- */}
      <div className="w-full max-w-4xl mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl p-8 flex items-center justify-between shadow-2xl shadow-green-900/20">
          <div>
            <h2 className="text-gray-400 text-sm uppercase tracking-widest font-bold">Right Now</h2>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-6xl font-bold text-white">{onlineCount}</span>
              <span className="text-green-500 font-medium animate-pulse">● Online</span>
            </div>
            <p className="text-gray-600 text-sm mt-2">Active in last 5 minutes</p>
          </div>
          {/* Simple Sparkline/Graph Visual */}
          <div className="hidden md:flex gap-1 items-end h-16">
            {[40, 60, 45, 70, 85, 60, 75].map((h, i) => (
              <div key={i} className="w-3 bg-green-900/50 rounded-sm" style={{ height: `${h}%` }}></div>
            ))}
          </div>
        </div>
      </div>

      {/* --- LIVE FEED TABLE --- */}
      <div className="w-full max-w-4xl bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-gray-800 bg-gray-900 flex justify-between items-center">
          <h3 className="font-semibold text-gray-200">Real-Time Traffic</h3>
          <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">
            Live Feed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-900 text-gray-500 text-xs uppercase">
              <tr>
                <th className="p-4">When</th>
                <th className="p-4">Location</th>
                <th className="p-4">Page</th>
                <th className="p-4">Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {visits.map((visit) => (
                <tr key={visit.id} className="hover:bg-gray-800/50 transition-colors animate-in fade-in slide-in-from-top-2 duration-300">
                  <td className="p-4 text-green-400 font-mono whitespace-nowrap">
                    {visit.created_at ? formatDistanceToNow(new Date(visit.created_at), { addSuffix: true }) : 'Just now'}
                  </td>
                  <td className="p-4 text-white flex items-center gap-2">
                    {/* Optional: Add flag emojis here if you have a helper function */}
                    {visit.country || 'Unknown'}
                  </td>
                  <td className="p-4 text-blue-300 max-w-[200px] truncate">{visit.url}</td>
                  <td className="p-4 text-gray-500 max-w-[150px] truncate" title={visit.user_agent}>
                    {visit.user_agent?.includes('iPhone') ? '📱 iPhone' :
                     visit.user_agent?.includes('Android') ? '🤖 Android' :
                     visit.user_agent?.includes('Windows') ? '💻 Windows' :
                     visit.user_agent?.includes('Mac') ? '🍎 Mac' : 'Unknown Device'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}