'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState, useMemo } from 'react';
import { formatDistanceStrict } from 'date-fns';
import { useParams } from 'next/navigation';

// Initialize Supabase
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

export default function UserDashboard() {
  const params = useParams();
  // Get the Tracker ID from the URL (e.g. "829312")
  const TRACKER_ID = params.id as string;

  const [visits, setVisits] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());
  const [origin, setOrigin] = useState('');

  // Set the domain origin for the snippet (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const fetchInitialData = async () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    // FETCH ONLY DATA FOR THIS ID
    const { data } = await supabase
      .from('visits')
      .select('*')
      .eq('tracker_id', TRACKER_ID)
      .gt('created_at', tenMinutesAgo)
      .order('created_at', { ascending: false });

    if (data) setVisits(data);
  };

  useEffect(() => {
    if (!TRACKER_ID) return;

    fetchInitialData();

    // Update "Time Ago" every second
    const interval = setInterval(() => setNow(new Date()), 1000);

    // Subscribe to Real-time changes for this specific ID
    const channel = supabase
      .channel(`room_${TRACKER_ID}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'visits',
          filter: `tracker_id=eq.${TRACKER_ID}` // <--- Critical Filter
        },
        (payload) => {
          setVisits((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [TRACKER_ID]);

  // Calculate "Online Now" (Active in last 5 minutes)
  const onlineCount = useMemo(() => {
    const fiveMinutesAgo = now.getTime() - 5 * 60 * 1000;
    return visits.filter(v => new Date(v.created_at).getTime() > fiveMinutesAgo).length;
  }, [visits, now]);

  // The Script for users to copy
  const snippet = `<script>
(function() {
  var tracker_id = '${TRACKER_ID}';
  var url = window.location.href;
  var ref = document.referrer;
  
  fetch('${origin}/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      tracker_id: tracker_id,
      url: url,
      referrer: ref
    })
  }).catch(err => console.log('Tracker Error:', err));
})();
</script>`;

  return (
    <main className="min-h-screen bg-black text-white font-sans p-6 flex flex-col items-center">

      {/* Header */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <h1 className="text-2xl font-bold text-green-500 flex items-center gap-2">
          <span className="text-3xl">⚡</span> Tracker #{TRACKER_ID}
        </h1>
        <a href="/" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300 transition-colors">
          + Create New
        </a>
      </div>

      {/* --- INSTALLATION INSTRUCTIONS --- */}
      <div className="w-full max-w-5xl bg-gray-900 border border-gray-700 rounded-lg p-6 mb-8 shadow-lg">
        <h3 className="text-white font-bold mb-2 flex items-center gap-2">
          <span>📋</span> Installation Code
        </h3>
        <p className="text-gray-400 text-sm mb-3">
          Paste this code into the <code>&lt;head&gt;</code> or <code>&lt;footer&gt;</code> of your website (WordPress, HTML, etc.).
        </p>
        <div className="relative group">
          <textarea
            readOnly
            className="w-full h-32 bg-black p-4 rounded border border-gray-800 font-mono text-xs text-green-400 focus:outline-none focus:border-green-500 resize-none"
            value={snippet}
            onClick={(e) => e.currentTarget.select()}
          />
          <div className="absolute top-2 right-2 text-xs text-gray-600 bg-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            Click to Select
          </div>
        </div>
      </div>

      {/* --- BIG LIVE COUNTER --- */}
      <div className="w-full max-w-5xl mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl p-8 flex items-center justify-between shadow-2xl shadow-green-900/10">
          <div>
            <h2 className="text-gray-400 text-sm uppercase tracking-widest font-bold">People Online</h2>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-6xl font-bold text-white tabular-nums">{onlineCount}</span>
              <span className="text-green-500 font-medium animate-pulse text-sm uppercase tracking-wider">● Live Now</span>
            </div>
            <p className="text-gray-600 text-sm mt-2">Active in the last 5 minutes</p>
          </div>

          {/* Simple Animated Graph Bar */}
          <div className="hidden md:flex gap-1 items-end h-16 opacity-40">
             {[...Array(12)].map((_, i) => (
                <div key={i} className="w-2 bg-green-500 rounded-sm animate-pulse"
                     style={{
                       height: `${20 + Math.random() * 80}%`,
                       animationDelay: `${i * 0.1}s`
                     }}>
                </div>
             ))}
          </div>
        </div>
      </div>

      {/* --- LIVE FEED TABLE --- */}
      <div className="w-full max-w-5xl bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-gray-800 bg-gray-900 flex justify-between items-center">
           <h3 className="font-semibold text-gray-200">Real-Time Traffic Feed</h3>
           <div className="flex items-center gap-2">
             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
             <span className="text-xs text-green-400 uppercase font-bold tracking-wider">Live</span>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-900 text-gray-500 text-xs uppercase">
              <tr>
                <th className="p-4 font-medium">Time Ago</th>
                <th className="p-4 font-medium">Location</th>
                <th className="p-4 font-medium">Source</th>
                <th className="p-4 font-medium">Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {visits.slice(0, 20).map((visit) => {
                const source = getSource(visit.referer);
                return (
                  <tr key={visit.id} className="hover:bg-gray-800/50 transition-colors">
                    {/* Time */}
                    <td className="p-4 text-green-400 font-mono whitespace-nowrap tabular-nums">
                      {formatDistanceStrict(new Date(visit.created_at), now, { addSuffix: true })}
                    </td>

                    {/* Country with Flag Image */}
                    <td className="p-4 text-white">
                      <div className="flex items-center gap-3">
                        {visit.country && visit.country !== 'Unknown' ? (
                            <img
                              src={`https://flagcdn.com/24x18/${visit.country.toLowerCase()}.png`}
                              srcSet={`https://flagcdn.com/48x36/${visit.country.toLowerCase()}.png 2x`}
                              width="24" height="18"
                              alt={visit.country}
                              className="rounded-sm shadow-sm"
                            />
                        ) : (
                            <span className="text-xl">🌍</span>
                        )}
                        <span className="font-medium text-gray-300">{visit.country || 'Unknown'}</span>
                      </div>
                    </td>

                    {/* Source / Referrer */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{source.icon}</span>
                        <span className="text-blue-300 font-medium">{source.name}</span>
                      </div>
                      <div className="text-xs text-gray-600 max-w-[200px] truncate mt-1" title={visit.url}>
                        {visit.url.replace(/^https?:\/\//, '')}
                      </div>
                    </td>

                    {/* Device */}
                    <td className="p-4 text-gray-500 font-medium">
                      {visit.user_agent?.includes('iPhone') ? '📱 iPhone' :
                       visit.user_agent?.includes('Android') ? '🤖 Android' :
                       visit.user_agent?.includes('Windows') ? '💻 Windows' :
                       visit.user_agent?.includes('Mac') ? '🍎 Mac' : 'Unknown'}
                    </td>
                  </tr>
                );
              })}

              {visits.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-600 italic">
                    Waiting for data... Paste the code above into your site to start tracking!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}