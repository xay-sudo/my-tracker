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

  // --- NEW: DELETE WEBSITE FUNCTION ---
  const deleteWebsite = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tracker? Data cannot be recovered.')) return;

    const { error } = await supabase
      .from('trackers')
      .delete()
      .eq('id', id);

    if (!error) {
      setWebsites(websites.filter(site => site.id !== id));
    } else {
      alert('Error deleting: ' + error.message);
    }
  };

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
    setTimeout(() => setCopyingId(null), 2000);
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
            <h1 className="text-3xl font-bold text-green-500 underline decoration-green-900 underline-offset-8">My Trackers</h1>
            <p className="text-gray-500 text-sm mt-2">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 text-sm transition-colors font-medium border border-gray-800 px-4 py-2 rounded-lg">
            Logout
          </button>
        </div>

        {/* Add New Website Form */}
        <form onSubmit={addWebsite} className="mb-12 flex flex-col md:flex-row gap-4 bg-gray-900/50 p-6 rounded-2xl border border-gray-800 shadow-xl backdrop-blur-sm">
          <input
            type="text"
            placeholder="Website Name (e.g. My Blog)"
            className="flex-1 bg-black border border-gray-800 p-4 rounded-xl text-white focus:border-green-500 outline-none transition-all"
            value={newSiteName}
            onChange={(e) => setNewSiteName(e.target.value)}
          />
          <button className="bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-green-900/20">
            Create Tracker
          </button>
        </form>

        {/* Website List */}
        <div className="grid grid-cols-1 gap-4">
          {websites.map((site) => (
            <div key={site.id} className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-gray-700 transition-all group">

              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-white">{site.name}</h3>
                  <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-1 rounded uppercase tracking-tighter">Live</span>
                </div>
                <p className="text-gray-500 text-xs font-mono mt-1 opacity-60">ID: {site.id}</p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                {/* Copy Button */}
                <button
                  onClick={() => copyTrackingCode(site.id)}
                  className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                    copyingId === site.id 
                    ? 'bg-green-600 border-green-500 text-white' 
                    : 'bg-black border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                  }`}
                >
                  {copyingId === site.id ? '✅ Copied' : 'Copy Code'}
                </button>

                {/* View Stats */}
                <button
                  onClick={() => router.push(`/dashboard/${site.id}`)}
                  className="flex-1 md:flex-none bg-green-600/10 text-green-500 border border-green-600/20 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-green-600 hover:text-white transition-all"
                >
                  Dashboard
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => deleteWebsite(site.id)}
                  className="p-2.5 rounded-xl border border-gray-800 text-gray-600 hover:text-red-500 hover:border-red-900/50 transition-all bg-black"
                  title="Delete Tracker"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
              </div>

            </div>
          ))}

          {websites.length === 0 && (
            <div className="text-center py-20 bg-gray-900/20 border-2 border-dashed border-gray-800 rounded-3xl">
              <div className="text-4xl mb-4">📉</div>
              <p className="text-gray-500">You don't have any trackers yet.</p>
              <p className="text-gray-600 text-sm">Add one above to start seeing your traffic!</p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}