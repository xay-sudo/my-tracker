'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const createTracker = () => {
    // 1. Generate a random 6-digit ID (e.g. 482910)
    const randomId = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Send user to their new private dashboard
    router.push(`/dashboard/${randomId}`);
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">

      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-black to-black -z-10"></div>

      <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-6 tracking-tight">
        Super Tracker ⚡
      </h1>

      <p className="text-gray-400 mb-10 text-xl max-w-lg mx-auto leading-relaxed">
        Real-time visitor tracking for your website. <br/>
        <span className="text-gray-500">Free. No sign-up required.</span>
      </p>

      <button
        onClick={createTracker}
        className="group relative px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-full text-lg transition-all shadow-[0_0_40px_rgba(34,197,94,0.3)] hover:shadow-[0_0_60px_rgba(34,197,94,0.5)] active:scale-95"
      >
        <span className="flex items-center gap-2">
          Click to Create Tracker 🚀
        </span>
      </button>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-gray-500">
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl">⏱️</span>
          <p>Real-Time Updates</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl">🌍</span>
          <p>Country Flags</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl">📱</span>
          <p>Device Detection</p>
        </div>
      </div>
    </main>
  );
}