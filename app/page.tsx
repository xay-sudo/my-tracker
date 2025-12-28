'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState, useMemo } from 'react';
import { formatDistanceStrict } from 'date-fns';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Dashboard() {
  const [visits, setVisits] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());

  // 1. Fetch ALL visitors from the last 10 minutes to ensure accurate local counting
  const fetchInitialData = async () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from('visits')
      .select('*')
      .gt('created_at', tenMinutesAgo) // Only get recent history
      .order('created_at', { ascending: false });

    if (data) setVisits(data);
  };

  useEffect(() => {
    fetchInitialData();

    // 2. TICKER: Update 'now' every second (This forces the page to re-calculate times/counts)
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    // 3. REALTIME: Listen for NEW visits instantly
    const channel = supabase
      .channel('realtime_visits')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'visits' },
        (payload) => {
          setVisits((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  // 4. Calculate "Online Now" (Active in last 5 mins) dynamically
  const onlineCount = useMemo(() => {
    const fiveMinutesAgo = now.getTime() - 5 * 60 * 1000;
    return visits.filter(v => new Date(v.created_at).getTime() > fiveMinutesAgo).length;
  }, [visits, now]);

  return (
    <main className="min-h-screen bg-black text-white font-sans p-6 flex flex-col items-center">

      {/* --- BIG COUNTER --- */}
      <div className="w-full max-w-4xl mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl p-8 flex items-center justify-between shadow-2xl shadow-green-900/20">
          <div>
            <h2 className="text-gray-400 text-sm uppercase tracking-widest font-bold">Right Now</h2>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-6xl font-bold text-white tabular-nums">
                {onlineCount}
              </span>
              <span className="text-green-500 font-medium animate-pulse">● Online</span>
            </div>
            <p className="text-gray-600 text-sm mt-2">Updates every second</p>
          </div>

           {/* Visual Pulse Graph */}
           <div className="hidden md:flex gap-1 items-end h-16 opacity-50">
             {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 bg-green-500 rounded-sm transition-all duration-500"
                  style={{
                    height: `${Math.max(20, Math.random() * 100)}%`,
                    opacity: i === 9 ? 1 : 0.3
                  }}
                ></div>
             ))}
          </div>
        </div>
      </div>

      {/* --- LIVE FEED TABLE --- */}
      <div className="w-full max-w-4xl bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-gray-800 bg-gray-900 flex justify-between items-center">
          <h3 className="font-semibold text-gray-200">Real-Time Traffic</h3>
          <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 animate-pulse">
            Live
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-900 text-gray-500 text-xs uppercase">
              <tr>
                <th className="p-4">Time Ago</th>
                <th className="p-4">Location</th>
                <th className="p-4">Page</th>
                <th className="p-4">Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {visits.slice(0, 20).map((visit) => (
                <tr key={visit.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="p-4 text-green-400 font-mono whitespace-nowrap tabular-nums">
                   {/* This updates every second automatically because 'now' changes */}
                   {formatDistanceStrict(new Date(visit.created_at), now, { addSuffix: true })}
                  </td>
                  <td className="p-4 text-white">
                    {visit.country || 'Unknown'}
                  </td>
                  <td className="p-4 text-blue-300 max-w-[200px] truncate">{visit.url}</td>
                  <td className="p-4 text-gray-500 max-w-[150px] truncate">
                    {visit.user_agent?.includes('iPhone') ? 'iPhone' :
                     visit.user_agent?.includes('Android') ? 'Android' : 'Desktop'}
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