'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState, useMemo } from 'react';
import { formatDistanceStrict } from 'date-fns';
import { useParams } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import WorldMap from '../../components/WorldMap';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#a855f7'];

export default function UserDashboard() {
  const params = useParams();
  const TRACKER_ID = params.id as string;

  const [visits, setVisits] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('24h'); // '24h', '7d', '30d'
  const [now, setNow] = useState(new Date());

  // --- 1. FETCH DATA BASED ON TIME FILTER ---
  useEffect(() => {
    const fetchData = async () => {
      let startTime = new Date();

      if (timeRange === '24h') startTime.setDate(startTime.getDate() - 1);
      if (timeRange === '7d') startTime.setDate(startTime.getDate() - 7);
      if (timeRange === '30d') startTime.setDate(startTime.getDate() - 30);

      const { data } = await supabase
        .from('visits')
        .select('*')
        .eq('tracker_id', TRACKER_ID)
        .gt('created_at', startTime.toISOString())
        .order('created_at', { ascending: false });

      if (data) setVisits(data);
    };

    fetchData();

    // Realtime subscription (Only keeps appending if looking at recent data)
    if (timeRange === '24h') {
      const channel = supabase
        .channel('realtime_visits')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'visits', filter: `tracker_id=eq.${TRACKER_ID}` },
          (payload) => setVisits((prev) => [payload.new, ...prev])
        )
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [TRACKER_ID, timeRange]);


  // --- 2. ANALYTICS HELPERS ---
  const groupData = (field: string) => {
    const counts: any = {};
    visits.forEach((v) => {
      const key = v[field] || 'Unknown';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.keys(counts).map((key) => ({ name: key, value: counts[key] }));
  };

  const deviceData = useMemo(() => groupData('device_type'), [visits]);
  const browserData = useMemo(() => groupData('browser'), [visits]);
  const osData = useMemo(() => groupData('os'), [visits]);

  return (
    <main className="min-h-screen bg-black text-white font-sans p-6 flex flex-col items-center">

      {/* Header & Time Filter */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-8 pb-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-green-500">⚡ Tracker #{TRACKER_ID}</h1>

        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-white p-2 rounded focus:outline-none focus:border-green-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <a href="/" className="text-gray-500 hover:text-white text-sm">Exit</a>
        </div>
      </div>

      {/* --- ROW 1: COUNTER & MAP --- */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-8 flex flex-col justify-center relative overflow-hidden">
           <h2 className="text-gray-400 text-xs uppercase tracking-widest font-bold z-10">Total Visits ({timeRange})</h2>
           <div className="flex items-baseline gap-2 mt-4 z-10">
             <span className="text-6xl font-bold text-white tabular-nums">{visits.length}</span>
           </div>
        </div>
        <div className="lg:col-span-2 h-64">
           <WorldMap visits={visits} />
        </div>
      </div>

      {/* --- ROW 2: PIE CHARTS (NEW!) --- */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { title: "📱 Devices", data: deviceData },
          { title: "🌐 Browsers", data: browserData },
          { title: "💻 OS", data: osData }
        ].map((chart, idx) => (
          <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-4 h-64 flex flex-col">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">{chart.title}</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chart.data}
                  cx="50%" cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chart.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 justify-center mt-2 text-xs text-gray-500">
               {chart.data.map((entry, i) => (
                 <span key={i} className="flex items-center gap-1">
                   <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }}></span>
                   {entry.name}
                 </span>
               ))}
            </div>
          </div>
        ))}
      </div>

      {/* --- ROW 3: RECENT TRAFFIC --- */}
      <div className="w-full max-w-6xl bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 bg-gray-900/50">
           <h3 className="font-bold text-gray-200 text-sm uppercase">Recent Log</h3>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
              <tr>
                <th className="p-4">Time</th>
                <th className="p-4">Country</th>
                <th className="p-4">Device</th>
                <th className="p-4">Page</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {visits.slice(0, 20).map((visit) => (
                <tr key={visit.id} className="hover:bg-gray-800/30">
                  <td className="p-4 text-gray-500 text-xs">
                    {formatDistanceStrict(new Date(visit.created_at), new Date())} ago
                  </td>
                  <td className="p-4 flex items-center gap-2">
                    {visit.country ? <img src={`https://flagcdn.com/16x12/${visit.country.toLowerCase()}.png`} /> : '🌍'}
                    <span>{visit.country || 'N/A'}</span>
                  </td>
                  <td className="p-4 text-gray-400 text-xs">
                     {visit.os} • {visit.browser}
                  </td>
                  <td className="p-4 text-white truncate max-w-[200px]">
                     {visit.url.replace(/^https?:\/\/[^/]+/, '') || '/'}
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