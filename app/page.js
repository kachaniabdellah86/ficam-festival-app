'use client';
import Link from 'next/link';
import { Sparkles, QrCode, Play, Star, Ticket } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0F0F1A] text-white font-sans overflow-hidden relative selection:bg-pink-500 selection:text-white">
      
      {/* 🟣 FUN BACKGROUND BLOBS (Decorations) */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse delay-1000"></div>
      
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-purple-500 to-pink-500 p-2 rounded-full rotate-3 hover:rotate-12 transition-transform">
              <Ticket size={20} className="text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight">FICAM<span className="text-purple-400">.Fun</span></span>
          </div>
          <Link href="/scan">
            <button className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-purple-50 transition-colors shadow-lg shadow-white/10 text-sm">
              Scanner 🚀
            </button>
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="pt-48 pb-20 px-6 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-pink-300 mb-8 animate-bounce">
          <Sparkles size={16} /> <span>L'aventure commence ici !</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-6">
          Vivez le <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400">
            Cinéma Autrement
          </span>
        </h1>
        
        <p className="text-slate-300 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          Collectez des badges, validez vos masterclass et débloquez votre attestation dans une expérience gamifiée.
        </p>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          {/* 👇 THIS LINK NOW GOES TO YOUR WORKING SCANNER */}
          <Link href="/scan">
            <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full hover:scale-110 transition-transform shadow-xl shadow-purple-600/30 flex items-center gap-2">
              <Play size={20} fill="currentColor" /> Ouvrir le Scanner
            </button>
          </Link>
          <button className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-white font-bold rounded-full transition-all flex items-center gap-2">
            <QrCode size={20} /> Comment ça marche ?
          </button>
        </div>
      </section>

      {/* --- FUN CARDS SECTION --- */}
      <section className="py-20 px-6 max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
        {[
          { title: "Scannez", icon: QrCode, color: "text-purple-400", bg: "bg-purple-500/10", desc: "Trouvez les QR Codes cachés dans le festival." },
          { title: "Jouez", icon: Star, color: "text-yellow-400", bg: "bg-yellow-500/10", desc: "Répondez aux quiz pour gagner des points d'XP." },
          { title: "Gagnez", icon: Ticket, color: "text-pink-400", bg: "bg-pink-500/10", desc: "Débloquez votre attestation officielle." },
        ].map((item, i) => (
          <div key={i} className="group p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all hover:-translate-y-2 cursor-pointer backdrop-blur-sm">
            <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center mb-6 rotate-3 group-hover:rotate-12 transition-transform`}>
              <item.icon size={28} className={item.color} />
            </div>
            <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
            <p className="text-slate-400">{item.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}