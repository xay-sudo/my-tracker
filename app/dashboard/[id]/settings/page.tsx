'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProjectSettings() {
  const params = useParams();
  const router = useRouter();
  const TRACKER_ID = params.id as string;

  const [siteName, setSiteName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      const { data, error } = await supabase
        .from('trackers')
        .select('*')
        .eq('id', TRACKER_ID)
        .single();

      if (data) {
        setSiteName(data.name);
      } else if (error) {
        // If tracker doesn't exist, go back
        router.push('/dashboard');
      }
      setLoading(false);
    };
    fetchProject();
  }, [TRACKER_ID, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('trackers')
      .update({ name: siteName })
      .eq('id', TRACKER_ID);

    if (error) {
      setMessage('Error: ' + error.message);
    } else {
      setMessage('✅ Settings updated successfully!');

      // --- FIX ADDED HERE ---
      // 1. Force Next.js to refresh the current route (clears cache)
      router.refresh();
      // 2. Optional: If you want to force update the local state immediately (redundant but safe)
      // setSiteName(siteName);
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  return (
    <main className={`min-h-screen transition-colors duration-500 p-6 flex flex-col items-center ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-12 border-b pb-4 border-gray-800">
          <h1 className="text-2xl font-bold">Project Settings</h1>
          <button onClick={() => router.back()} className="text-sm opacity-50 hover:opacity-100">← Back to Stats</button>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 text-center border text-sm ${message.includes('Error') ? 'bg-red-900/20 text-red-400 border-red-900' : 'bg-green-900/20 text-green-400 border-green-900'}`}>
            {message}
          </div>
        )}

        <div className={`border rounded-2xl p-8 transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
          <form onSubmit={handleUpdate} className="flex flex-col gap-6">

            {/* Rename Project */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest opacity-50">Website Name</label>
              <input
                type="text"
                className={`p-3 rounded-xl border outline-none focus:border-green-500 transition-all ${isDarkMode ? 'bg-black border-gray-800' : 'bg-gray-50 border-gray-200'}`}
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                required
              />
            </div>

            {/* Read-only ID */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest opacity-50">Tracker ID</label>
              <input
                type="text"
                readOnly
                className={`p-3 rounded-xl border opacity-50 cursor-not-allowed ${isDarkMode ? 'bg-black border-gray-800' : 'bg-gray-50 border-gray-200'}`}
                value={TRACKER_ID}
              />
              <p className="text-[10px] text-gray-500 italic">This ID is unique and cannot be changed.</p>
            </div>

            <button
              disabled={saving}
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="mt-12 border border-red-900/30 bg-red-900/10 rounded-2xl p-8">
          <h3 className="text-red-500 font-bold mb-2">Danger Zone</h3>
          <p className="text-xs text-gray-500 mb-6">Once you delete a tracker, there is no going back. Please be certain.</p>
          <button
            onClick={async () => {
              if (confirm('Permanently delete this tracker?')) {
                await supabase.from('trackers').delete().eq('id', TRACKER_ID);
                router.refresh(); // Refresh before pushing to clear cache
                router.push('/dashboard');
              }
            }}
            className="text-red-500 border border-red-900/50 hover:bg-red-500 hover:text-white px-6 py-2 rounded-lg text-sm font-bold transition-all"
          >
            Delete Tracker
          </button>
        </div>

      </div>
    </main>
  );
}