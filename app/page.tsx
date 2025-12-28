'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState, useMemo } from 'react';
import { formatDistanceStrict } from 'date-fns';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- HELPER: Identify Source Icon ---
const getSource = (referer: string) => {
  if (!referer || referer === 'Direct / Unknown') return { name: 'Direct', icon: '🔗' };

  const ref = referer.toLowerCase();
  if (ref.includes('facebook')) return { name: 'Facebook', icon: '🟦' };
  if (ref.includes('t.co') || ref.includes('twitter') || ref.includes('x.com')) return { name: 'X / Twitter', icon: '⬛' };
  if (ref.includes('instagram')) return { name: 'Instagram', icon: '📸' };
  if (ref.includes('telegram') || ref.includes('t.me')) return { name: 'Telegram', icon: '✈️' };
  if (ref.includes('youtube')) return { name: 'YouTube', icon: '🟥' };
  if (ref.includes('google')) return { name: 'Google', icon: '🔍' };
  if (ref.includes('tiktok')) return { name: 'TikTok', icon: '🎵' };

  return { name: 'Web Ref', icon: '🌐' };
};

export default function Dashboard() {
  const [visits, setVisits] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());

  const fetchInitialData = async () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from('visits')
      .select('*')
      .gt('created_at', tenMinutesAgo)
      .order('created_at', { ascending: false });

    if (data) setVisits(data);
  };

  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(() => setNow(new Date()), 1000);

    const channel = supabase
      .channel('realtime_visits')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'visits' }, (payload) => {
        setVisits((prev) => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const onlineCount = useMemo(() => {
    const fiveMinutesAgo = now.getTime() - 5 * 60 * 1000;
    return visits.filter(v => new Date(v.created_at).getTime() > fiveMinutesAgo).length;
  }, [visits, now]);

  return (
    <main className="min-h-screen bg-black text-white font-sans p-6 flex flex-col items-center">

      {/* --- BIG LIVE COUNTER --- */}
      <div className="w-full max-w-5xl mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl p-8 flex items-center justify-between shadow-2xl shadow-green-900/20">
          <div>
            <h2 className="text-gray-400 text-sm uppercase tracking-widest font-bold">Right Now</h2>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-6xl font-bold text-white tabular-nums">{onlineCount}</span>
              <span className="text-green-500 font-medium animate-pulse">● Online</span>
            </div>
            <p className="text-gray-600 text-sm mt-2">Active in last 5 minutes</p>
          </div>
          <div className="hidden md:flex gap-1 items-end h-16 opacity-50">
             {[...Array(10)].map((_, i) => (
                <div key={i} className="w-2 bg-green-500 rounded-sm" style={{ height: `${Math.random() * 100}%` }}></div>
             ))}
          </div>
        </div>
      </div>

      {/* --- LIVE FEED TABLE --- */}
      <div className="w-full max-w-5xl bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-gray-800 bg-gray-900 flex justify-between items-center">
          <h3 className="font-semibold text-gray-200">Real-Time Traffic</h3>
          <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 animate-pulse">Live Feed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-900 text-gray-500 text-xs uppercase">
              <tr>
                <th className="p-4">Time Ago</th>
                <th className="p-4">Location</th>
                <th className="p-4">Source</th>
                <th className="p-4">Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {visits.slice(0, 20).map((visit) => {
                const source = getSource(visit.referer);
                return (
                  <tr key={visit.id} className="hover:bg-gray-800/50 transition-colors">

                    {/* TIME */}
                    <td className="p-4 text-green-400 font-mono whitespace-nowrap tabular-nums">
                      {formatDistanceStrict(new Date(visit.created_at), now, { addSuffix: true })}
                    </td>

                    {/* COUNTRY FLAG IMAGE (Fix for Windows) */}
                    <td className="p-4 text-white flex items-center gap-3">
                      {visit.country && visit.country !== 'Unknown' ? (
                        <img
                          src={`https://flagcdn.com/24x18/${visit.country.toLowerCase()}.png`}
                          srcSet={`https://flagcdn.com/48x36/${visit.country.toLowerCase()}.png 2x`}
                          width="24"
                          height="18"
                          alt={visit.country}
                          className="rounded-sm"
                        />
                      ) : (
                        <span className="text-lg">🌍</span>
                      )}
                      <span className="text-gray-300 font-medium">{visit.country || 'Unknown'}</span>
                    </td>

                    {/* SOURCE */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{source.icon}</span>
                        <span className="text-blue-300">{source.name}</span>
                      </div>
                      <div className="text-xs text-gray-600 max-w-[150px] truncate mt-1">
                        {visit.url}
                      </div>
                    </td>

                    {/* DEVICE */}
                    <td className="p-4 text-gray-500">
                      {visit.user_agent?.includes('iPhone') ? '📱 iPhone' :
                       visit.user_agent?.includes('Android') ? '🤖 Android' :
                       visit.user_agent?.includes('Windows') ? '💻 PC' : 'Unknown'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}