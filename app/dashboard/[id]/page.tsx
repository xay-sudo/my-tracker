'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState, useMemo } from 'react';
import { formatDistanceStrict } from 'date-fns';
import { useParams } from 'next/navigation';
import WorldMap from '../../components/WorldMap'; // Import the new map

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const getSource = (referer: string) => {
  if (!referer || referer === 'Direct / Unknown') return { name: 'Direct', icon: '🔗' };
  const ref = referer.toLowerCase();
  if (ref.includes('facebook')) return { name: 'Facebook', icon: '🟦' };
  if (ref.includes('twitter') || ref.includes('x.com')) return { name: 'X / Twitter', icon: '⬛' };
  if (ref.includes('instagram')) return { name: 'Instagram', icon: '📸' };
  if (ref.includes('google')) return { name: 'Google', icon: '🔍' };
  return { name: 'Web Ref', icon: '🌐' };
};

export default function UserDashboard() {
  const params = useParams();
  const TRACKER_ID = params.id as string;
  const [visits, setVisits] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  const fetchInitialData = async () => {
    // Fetch last 24 hours of data for better charts
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from('visits')
      .select('*')
      .eq('tracker_id', TRACKER_ID)
      .gt('created_at', oneDayAgo)
      .order('created_at', { ascending: false });

    if (data) setVisits(data);
  };

  useEffect(() => {
    if (!TRACKER_ID) return;
    fetchInitialData();
    const interval = setInterval(() => setNow(new Date()), 1000);

    const channel = supabase
      .channel(`room_${TRACKER_ID}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'visits', filter: `tracker_id=eq.${TRACKER_ID}` },
        (payload) => setVisits((prev) => [payload.new, ...prev])
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); clearInterval(interval); };
  }, [TRACKER_ID]);

  // --- STATS LOGIC ---

  // 1. Online Users (Last 5 mins)
  const onlineCount = useMemo(() => {
    const fiveMinutesAgo = now.getTime() - 5 * 60 * 1000;
    return visits.filter(v => new Date(v.created_at).getTime() > fiveMinutesAgo).length;
  }, [visits, now]);

  // 2. Top Pages Logic (New!)
  const topPages = useMemo(() => {
    const counts: Record<string, number> = {};
    visits.forEach(v => {
      // Clean URL: remove 'https://domain.com' and leave only '/blog-post'
      let path = v.url.replace(/^https?:\/\/[^/]+/, '');
      if (!path) path = '/'; // Homepage
      counts[path] = (counts[path] || 0) + 1;
    });
    // Sort by most popular
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5); // Take top 5
  }, [visits]);

  const snippet = `<script>
(function() {
  fetch('${origin}/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tracker_id: '${TRACKER_ID}', url: window.location.href, referrer: document.referrer })
  });
})();
</script>`;

  return (
    <main className="min-h-screen bg-black text-white font-sans p-6 flex flex-col items-center">

      {/* Header */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-8 pb-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-green-500">⚡ Tracker #{TRACKER_ID}</h1>
        <a href="/" className="text-gray-500 hover:text-white text-sm">Back Home</a>
      </div>

      {/* --- GRID LAYOUT --- */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* 1. MAIN COUNTER (Top Left) */}
        <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-8 flex flex-col justify-center shadow-2xl relative overflow-hidden">
           <h2 className="text-gray-400 text-xs uppercase tracking-widest font-bold z-10">Right Now</h2>
           <div className="flex items-baseline gap-2 mt-4 z-10">
             <span className="text-7xl font-bold text-white tabular-nums">{onlineCount}</span>
             <span className="text-green-500 font-medium animate-pulse">● Online</span>
           </div>
           {/* Background Pulse */}
           <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-green-600/20 blur-3xl rounded-full pointer-events-none"></div>
        </div>

        {/* 2. WORLD MAP (Top Right - Spans 2 cols) */}
        <div className="lg:col-span-2 h-64">
           <WorldMap visits={visits} />
        </div>
      </div>

      {/* --- DATA TABLES --- */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 3. TOP PAGES (New!) */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800 bg-gray-900/50">
             <h3 className="font-bold text-gray-200 text-sm uppercase">🔥 Top Pages</h3>
          </div>
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-gray-800">
              {topPages.map(([path, count], i) => (
                <tr key={path} className="hover:bg-gray-800/30">
                  <td className="p-4 text-gray-400 font-mono w-8">{i + 1}.</td>
                  <td className="p-4 text-white truncate max-w-[200px]" title={path}>{path}</td>
                  <td className="p-4 text-right text-green-400 font-bold">{count} visits</td>
                </tr>
              ))}
              {topPages.length === 0 && (
                <tr><td colSpan={3} className="p-4 text-center text-gray-600">No pages viewed yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4. RECENT FEED (Existing) */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex justify-between">
             <h3 className="font-bold text-gray-200 text-sm uppercase">🕒 Recent Traffic</h3>
             <span className="text-xs text-green-500 animate-pulse">● Live</span>
          </div>
          <div className="overflow-y-auto max-h-[300px]">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-gray-800">
                {visits.slice(0, 10).map((visit) => (
                  <tr key={visit.id} className="hover:bg-gray-800/30">
                    <td className="p-4 text-gray-500 text-xs whitespace-nowrap">
                      {formatDistanceStrict(new Date(visit.created_at), now)} ago
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {visit.country ? <img src={`https://flagcdn.com/16x12/${visit.country.toLowerCase()}.png`} /> : '🌍'}
                        <span className="text-white">{visit.country || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-blue-300 text-xs">
                       {getSource(visit.referer).name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* --- INSTALL CODE (Bottom) --- */}
      <div className="w-full max-w-6xl mt-8 bg-black border border-gray-800 rounded-lg p-4">
        <details>
          <summary className="text-gray-500 text-sm cursor-pointer hover:text-white select-none">Show Installation Code</summary>
          <div className="mt-4 relative">
             <textarea
               readOnly
               className="w-full bg-gray-900 text-green-400 font-mono text-xs p-4 rounded border border-gray-700 h-24"
               value={snippet}
               onClick={(e) => e.currentTarget.select()}
             />
          </div>
        </details>
      </div>

    </main>
  );
}