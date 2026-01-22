import Link from 'next/link';
import { QrCode, Ticket, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500 rounded-full blur-[100px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-indigo-500 rounded-full blur-[100px] opacity-20 animate-pulse delay-700"></div>

      <div className="z-10 text-center space-y-8 max-w-md w-full">
        
        {/* Header */}
        <div className="space-y-2">
          <div className="flex justify-center mb-4">
            <Sparkles className="w-12 h-12 text-yellow-300 animate-spin-slow" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-400 drop-shadow-lg">
            FICAM 2025
          </h1>
          <p className="text-purple-200 text-lg font-light">Festival International de Cinéma</p>
        </div>

        {/* Buttons Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-3xl shadow-2xl space-y-4">
          <Link href="/scan" className="group relative flex items-center justify-center gap-3 w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-400 hover:to-violet-500 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 active:scale-95">
            <QrCode className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            <span>Scanner un Billet</span>
          </Link>
          
          <button className="flex items-center justify-center gap-3 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-purple-100 font-semibold py-4 px-6 rounded-xl transition-all hover:scale-105 active:scale-95">
            <Ticket className="w-6 h-6" />
            <span>Mes Billets (Coming Soon)</span>
          </button>
        </div>

        <p className="text-xs text-purple-400/60 font-mono">Powered by FICAM Tech Team</p>
      </div>
    </div>
  );
}