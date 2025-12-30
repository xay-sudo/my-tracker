'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardManager() {
  const router = useRouter();
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [newSiteName, setNewSiteName] = useState('');
  const [copyingId, setCopyingId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
        fetchWebsites(user.id);
      }
    };
    checkUser();
  }, [router]);

  const fetchWebsites = async (userId: string) => {
    const { data, error } = await supabase
      .from('trackers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) setWebsites(data);
    setLoading(false);
  };

  const addWebsite = async (e: any) => {
    e.preventDefault();
    if (!newSiteName) return;

    const trackerId = Math.floor(100000 + Math.random() * 900000).toString();

    const { error } = await supabase.from('trackers').insert({
      id: trackerId,
      name: newSiteName,
      user_id: user.id
    });

    if (!error) {
      setNewSiteName('');
      fetchWebsites(user.id);
    }
  };

  // --- COPY CODE FUNCTION ---
  const copyTrackingCode = (trackerId: string) => {
    const origin = window.location.origin;
    const snippet = `<script>
(function() {
  fetch('${origin}/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tracker_id: '${trackerId}', url: window.location.href, referrer: document.referrer })
  });
})();
</script>`;

    navigator.clipboard.writeText(snippet);
    setCopyingId(trackerId);
    setTimeout(() => setCopyingId(null), 2000); // Reset button text after 2s
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold text-green-500">My Trackers</h1>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 text-sm transition-colors">
            Logout
          </button>
        </div>

        {/* Add New Website Form */}
        <form onSubmit={addWebsite} className="mb-12 flex gap-4 bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl">
          <input
            type="text"
            placeholder="Website Name (e.g. My Portfolio)"
            className="flex-1 bg-black border border-gray-800 p-3 rounded text-white focus:border-green-500 outline-none"
            value={newSiteName}
            onChange={(e) => setNewSiteName(e.target.value)}
          />
          <button className="bg-green-600 hover:bg-green-500 text-white font-bold px-8 rounded transition-all active:scale-95">
            + Add Site
          </button>
        </form>

        {/* Website List */}
        <div className="grid grid-cols-1 gap-4">
          {websites.map((site) => (
            <div key={site.id} className="bg-gray-900 border border-gray-800 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-green-900/50 transition-colors">

              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">{site.name}</h3>
                <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">ID: {site.id}</p>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                {/* 1. COPY CODE BUTTON (NEW) */}
                <button
                  onClick={() => copyTrackingCode(site.id)}
                  className={`flex-1 md:flex-none px-4 py-2 rounded text-sm font-bold transition-all border ${
                    copyingId === site.id 
                    ? 'bg-green-600 border-green-500 text-white' 
                    : 'bg-black border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                  }`}
                >
                  {copyingId === site.id ? '✅ Copied!' : 'Copy Code'}
                </button>

                {/* 2. VIEW DASHBOARD BUTTON */}
                <button
                  onClick={() => router.push(`/dashboard/${site.id}`)}
                  className="flex-1 md:flex-none bg-green-600/10 text-green-500 border border-green-600/20 px-4 py-2 rounded text-sm font-bold hover:bg-green-600 hover:text-white transition-all"
                >
                  View Stats →
                </button>
              </div>

            </div>
          ))}

          {websites.length === 0 && (
            <div className="text-center py-20 bg-gray-900/30 border border-dashed border-gray-800 rounded-xl">
              <p className="text-gray-500">No websites added yet. Add your first one above!</p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}