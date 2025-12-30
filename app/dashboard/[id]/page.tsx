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
  const [siteName, setSiteName] = useState('Loading...');
  const [timeRange, setTimeRange] = useState('24h');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);

  // --- 1. FETCH DATA (VISITS + SITE NAME) ---
  useEffect(() => {
    const fetchData = async () => {
      // Fetch Tracker Info (Site Name)
      const { data: trackerData } = await supabase
        .from('trackers')
        .select('name')
        .eq('id', TRACKER_ID)
        .single();
      
      if (trackerData) setSiteName(trackerData.name);

      // Calculate Time Offset
      let startTime = new Date();
      if (timeRange === '24h') startTime.setDate(startTime.getDate() - 1);
      if (timeRange === '7d') startTime.setDate(startTime.getDate() - 7);
      if (timeRange === '30d') startTime.setDate(startTime.getDate() - 30);

      // Fetch Visits
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

    // Real-time listener for new visits
    const channel = supabase
      .channel('dashboard_realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'visits', 
        filter: `tracker_id=eq.${TRACKER_ID}` 
      }, (payload) => {
        setVisits((prev) => [payload.new, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Dashboard...</div>;

  return (
    <main className={`min-h-screen transition-colors duration-500 p-6 flex flex-col items-center ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* --- HEADER SECTION --- */}
      <div className={`w-full max-w-6xl flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <h1 className="text-2xl font-black text-green-500 tracking-tight">⚡ {siteName}</h1>
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full border transition-all ${isDarkMode ? 'border-gray-800 bg-gray-900 text-yellow-400' : 'border-gray-300 bg-white text-indigo-600 shadow-sm'}`}
            title="Toggle Light/Dark Mode"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className={`flex-1 md:flex-none p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-black shadow-sm'}`}
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <button 
            onClick={() => router.push(`/dashboard/${TRACKER_ID}/settings`)}
            className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${isDarkMode ? 'border-gray-800 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'}`}
          >
            ⚙️ Settings
          </button>

          <button onClick={() => router.push('/dashboard')} className="text-sm opacity-50 hover:opacity-100">Exit</button>
        </div>
      </div>

      {/* --- STATS & MAP ROW --- */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className={`lg:col-span-1 border rounded-3xl p-8 flex flex-col justify-center relative overflow-hidden transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800 shadow-2xl shadow-green-900/10' : 'bg-white border-gray-200 shadow-md'}`}>
           <h2 className="opacity-50 text-xs uppercase tracking-widest font-bold mb-2">Total Visitors</h2>
           <div className="flex items-baseline gap-2">
             <span className="text-7xl font-black tabular-nums tracking-tighter">{visits.length}</span>
             <span className="text-green-500 font-bold text-sm">Live</span>
           </div>
        </div>
        <div className="lg:col-span-2 h-72 rounded-3xl overflow-hidden border border-transparent shadow-xl">
           <WorldMap visits={visits} />
        </div>
      </div>

      {/* --- PIE CHARTS (DEVICE ANALYTICS) --- */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { title: "📱 Devices", data: deviceData },
          { title: "🌐 Browsers", data: browserData },
          { title: "💻 OS", data: osData }
        ].map((chart, idx) => (
          <div key={idx} className={`border rounded-2xl p-6 h-64 flex flex-col transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <h3 className="text-xs font-bold opacity-50 uppercase tracking-widest mb-4">{chart.title}</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chart.data} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value">
                  {chart.data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#111827' : '#fff', 
                    borderColor: isDarkMode ? '#374151' : '#e5e7eb', 
                    color: isDarkMode ? '#fff' : '#000',
                    borderRadius: '12px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* --- RECENT ACTIVITY LOG --- */}
      <div className={`w-full max-w-6xl border rounded-2xl overflow-hidden transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800 shadow-xl' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
           <h3 className="font-bold text-xs uppercase tracking-widest opacity-60">Real-time Visitor Log</h3>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className={`text-[10px] uppercase font-bold tracking-widest ${isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
              <tr>
                <th className="p-4">Time</th>
                <th className="p-4">Location</th>
                <th className="p-4">System</th>
                <th className="p-4">Target Page</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
              {visits.slice(0, 20).map((visit) => (
                <tr key={visit.id} className={`transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                  <td className="p-4 opacity-50 text-xs">
                    {formatDistanceStrict(new Date(visit.created_at), new Date())} ago
                  </td>
                  <td className="p-4 flex items-center gap-3 font-medium">
                    {visit.country ? (
                      <img 
                        src={`https://flagcdn.com/20x15/${visit.country.toLowerCase()}.png`} 
                        className="rounded-sm shadow-sm" 
                        alt={visit.country} 
                      />
                    ) : '🌍'}
                    <span>{visit.country || 'Global'}</span>
                  </td>
                  <td className="p-4 opacity-70 text-[11px] font-mono">
                    {visit.os} <span className="mx-1 opacity-30">/</span> {visit.browser}
                  </td>
                  <td className="p-4 font-mono text-xs truncate max-w-[180px]">
                    {visit.url.replace(/^https?:\/\/[^/]+/, '') || '/'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visits.length === 0 && (
            <div className="p-20 text-center opacity-30 italic">No data collected for this period yet.</div>
          )}
        </div>
      </div>
    </main>
  );
}