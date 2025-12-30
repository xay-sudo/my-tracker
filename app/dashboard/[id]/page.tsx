'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState, useMemo } from 'react';
import { formatDistanceStrict } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import WorldMap from '../../components/WorldMap';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#a855f7'];

export default function UserDashboard() {
  const params = useParams();
  const router = useRouter();
  const TRACKER_ID = params.id as string;

  const [visits, setVisits] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [isDarkMode, setIsDarkMode] = useState(true); // Theme State
  const [loading, setLoading] = useState(true);

  // --- 1. FETCH DATA ---
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
      setLoading(false);
    };

    fetchData();
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

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <main className={`min-h-screen transition-colors duration-500 p-6 flex flex-col items-center ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>

      {/* Header & Controls */}
      <div className={`w-full max-w-6xl flex justify-between items-center mb-8 pb-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-green-500">⚡ Tracker #{TRACKER_ID}</h1>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full border transition-all ${isDarkMode ? 'border-gray-800 bg-gray-900 text-yellow-400' : 'border-gray-300 bg-white text-indigo-600 shadow-sm'}`}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className={`p-2 rounded focus:outline-none focus:border-green-500 transition-all ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-black shadow-sm'}`}
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button onClick={() => router.push('/dashboard')} className="opacity-50 hover:opacity-100 text-sm">Back</button>
        </div>
      </div>

      {/* --- STATS CARDS --- */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className={`lg:col-span-1 border rounded-2xl p-8 flex flex-col justify-center relative overflow-hidden transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800 shadow-2xl' : 'bg-white border-gray-200 shadow-md'}`}>
           <h2 className="opacity-50 text-xs uppercase tracking-widest font-bold">Total Visits</h2>
           <span className="text-6xl font-bold mt-4 tabular-nums">{visits.length}</span>
        </div>
        <div className="lg:col-span-2 h-64">
           <WorldMap visits={visits} />
        </div>
      </div>

      {/* --- PIE CHARTS --- */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { title: "📱 Devices", data: deviceData },
          { title: "🌐 Browsers", data: browserData },
          { title: "💻 OS", data: osData }
        ].map((chart, idx) => (
          <div key={idx} className={`border rounded-xl p-4 h-64 flex flex-col transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <h3 className="text-xs font-bold opacity-50 uppercase mb-4">{chart.title}</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chart.data} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                  {chart.data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#111827' : '#fff',
                    borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                    color: isDarkMode ? '#fff' : '#000'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* --- RECENT LOG TABLE --- */}
      <div className={`w-full max-w-6xl border rounded-xl overflow-hidden transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
           <h3 className="font-bold text-sm uppercase">Recent Traffic</h3>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className={`text-xs uppercase ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
              <tr>
                <th className="p-4">Time</th>
                <th className="p-4">Country</th>
                <th className="p-4">Info</th>
                <th className="p-4">Page</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
              {visits.slice(0, 15).map((visit) => (
                <tr key={visit.id} className={isDarkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}>
                  <td className="p-4 opacity-50 text-xs">
                    {formatDistanceStrict(new Date(visit.created_at), new Date())} ago
                  </td>
                  <td className="p-4 flex items-center gap-2">
                    {visit.country ? <img src={`https://flagcdn.com/16x12/${visit.country.toLowerCase()}.png`} alt="flag" /> : '🌍'}
                    <span>{visit.country || 'N/A'}</span>
                  </td>
                  <td className="p-4 opacity-70 text-xs">{visit.os} • {visit.browser}</td>
                  <td className="p-4 truncate max-w-[200px]">{visit.url.replace(/^https?:\/\/[^/]+/, '') || '/'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}