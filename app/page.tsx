// app/page.tsx
import { kv } from '@vercel/kv';
import { formatDistanceToNow } from 'date-fns';

export const dynamic = 'force-dynamic'; // Refresh data every time

export default async function Dashboard() {
  // Get last 100 visits
  const rawData = await kv.lrange('visits', 0, 100);
  
  const visits = rawData.map((item) => {
    return typeof item === 'string' ? JSON.parse(item) : item;
  });

  return (
    <main className="p-8 bg-black min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8 text-blue-500">Visitor Tracker 👁️</h1>
      
      <div className="overflow-x-auto border border-gray-800 rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="p-4">Time</th>
              <th className="p-4">Page</th>
              <th className="p-4">Device</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {visits.map((visit: any, index: number) => (
              <tr key={index} className="hover:bg-gray-900/50">
                <td className="p-4 text-green-400 font-mono text-sm">
                  {visit.timestamp ? formatDistanceToNow(new Date(visit.timestamp)) + ' ago' : 'N/A'}
                </td>
                <td className="p-4 text-blue-300">{visit.url}</td>
                <td className="p-4 text-xs text-gray-500 max-w-xs truncate">
                  {visit.userAgent}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}