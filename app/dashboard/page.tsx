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
  const [trackers, setTrackers] = useState<any[]>([]);
  const [newSiteName, setNewSiteName] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    // 1. Check if logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login'); // Redirect if not logged in
    } else {
      setUser(user);
      fetchTrackers(user.id);
    }
  };

  const fetchTrackers = async (userId: string) => {
    // 2. Fetch only THIS user's websites
    const { data } = await supabase
      .from('trackers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setTrackers(data);
  };

  const createTracker = async () => {
    if (!newSiteName) return;
    const randomId = Math.floor(100000 + Math.random() * 900000).toString();

    const { error } = await supabase
      .from('trackers')
      .insert({
        id: randomId,
        user_id: user.id,
        name: newSiteName
      });

    if (!error) {
      setNewSiteName('');
      fetchTrackers(user.id); // Refresh list
    }
  };

  const deleteTracker = async (id: string) => {
    if(!confirm('Are you sure you want to delete this website?')) return;

    await supabase.from('trackers').delete().eq('id', id);
    fetchTrackers(user.id);
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-12 border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-bold text-green-500">My Websites</h1>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
            className="text-gray-400 hover:text-white text-sm bg-gray-900 px-4 py-2 rounded"
          >
            Sign Out
          </button>
        </div>

        {/* Create New Section */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl mb-8 flex gap-4 items-center shadow-lg">
          <input
            type="text"
            placeholder="Website Name (e.g. My Portfolio)"
            className="flex-1 bg-black border border-gray-700 p-3 rounded text-white focus:border-green-500 outline-none"
            value={newSiteName}
            onChange={(e) => setNewSiteName(e.target.value)}
          />
          <button
            onClick={createTracker}
            className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded font-bold transition-colors"
          >
            + Add Site
          </button>
        </div>

        {/* List of Sites */}
        <div className="grid gap-4">
          {trackers.map((tracker) => (
            <div key={tracker.id} className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl flex justify-between items-center hover:border-gray-600 transition-colors">
              <div>
                <h3 className="text-xl font-bold mb-1">{tracker.name}</h3>
                <p className="text-gray-500 text-sm font-mono">Tracker ID: {tracker.id}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/dashboard/${tracker.id}`)}
                  className="bg-blue-600/20 text-blue-400 border border-blue-600/50 px-4 py-2 rounded hover:bg-blue-600/30 transition-all"
                >
                  View Stats
                </button>
                <button
                  onClick={() => deleteTracker(tracker.id)}
                  className="bg-red-900/20 text-red-400 border border-red-900/50 px-4 py-2 rounded hover:bg-red-900/30 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {trackers.length === 0 && (
            <div className="text-center text-gray-500 py-12 border border-dashed border-gray-800 rounded-xl">
              No websites yet. Add one above!
            </div>
          )}
        </div>

      </div>
    </main>
  );
}