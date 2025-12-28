import { createClient } from '@supabase/supabase-js';
import { formatDistanceToNow } from 'date-fns';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function Dashboard() {
  const { data: visits } = await supabase
    .from('visits')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <main className="p-8 bg-black min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8 text-green-500">Supabase Tracker ⚡</h1>
      <div className="overflow-x-auto border border-gray-800 rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="p-4">Time</th>
              <th className="p-4">Country</th>
              <th className="p-4">Page</th>
              <th className="p-4">Device</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {visits?.map((visit: any) => (
              <tr key={visit.id} className="hover:bg-gray-900/50">
                <td className="p-4 text-green-400 font-mono text-sm">
                  {visit.created_at ? formatDistanceToNow(new Date(visit.created_at)) + ' ago' : 'N/A'}
                </td>
                <td className="p-4 text-white">{visit.country || 'Unknown'}</td>
                <td className="p-4 text-blue-300">{visit.url}</td>
                <td className="p-4 text-xs text-gray-500 max-w-xs truncate">
                  {visit.user_agent}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}