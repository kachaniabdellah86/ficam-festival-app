'use client';
import Link from 'next/link';
import { Sparkles, QrCode, Play, ArrowRight, Ticket, Film, Star, ChevronRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500 selection:text-white overflow-x-hidden">
      
      {/* 🎬 CINEMATIC BACKGROUND */}
      <div className="fixed inset-0 z-0">
        {/* Projector Light */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px]"></div>
        {/* Film Grain Overlay (Optional CSS trick) */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      {/* 🧭 NAVBAR */}
      <nav className="fixed top-0 w-full z-50 px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
             <Film size={20} className="text-white" />
           </div>
           <span className="font-black text-xl tracking-tighter">FICAM</span>
        </div>
        <Link href="/login" className="px-5 py-2 bg-white/10 border border-white/10 backdrop-blur-md rounded-full text-sm font-bold hover:bg-white/20 transition-all">
           Connexion
        </Link>
      </nav>

      {/* 🦸 HERO SECTION */}
      <main className="relative z-10 pt-32 pb-20 px-6 flex flex-col items-center text-center max-w-lg mx-auto">
        
        {/* Floating Badge Animation */}
        <div className="relative mb-8 animate-in zoom-in duration-700">
            <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-30 animate-pulse"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl rotate-3 flex items-center justify-center shadow-2xl shadow-purple-500/50 border border-white/20">
                <Star size={40} className="text-white fill-white" />
            </div>
            {/* Small floating elements */}
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#1A1A24] rounded-2xl border border-white/10 flex items-center justify-center rotate-12 shadow-xl">
                <span className="text-xs font-bold text-green-400">+50 XP</span>
            </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-6">
          Vivez le <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
            Cinéma.
          </span>
        </h1>
        
        <p className="text-slate-400 text-lg mb-10 leading-relaxed max-w-xs mx-auto">
          L'application compagnon officielle du festival. Scannez, jouez, et gagnez des récompenses exclusives.
        </p>
        
        {/* 🚀 PRIMARY CTA */}
        <div className="w-full space-y-4">
            <Link href="/register" className="group relative w-full block">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <button className="relative w-full py-5 bg-white text-black font-black text-lg rounded-2xl flex items-center justify-center gap-3 transition-transform active:scale-95">
                    <Play size={24} fill="black" /> Commencer l'aventure
                </button>
            </Link>
            
            <p className="text-xs text-slate-500 font-medium">100% Gratuit • Inscription en 30 secondes</p>
        </div>

      </main>

      {/* ✨ FEATURES (Cards) */}
      <section className="relative z-10 px-6 pb-24 max-w-lg mx-auto space-y-4">
         <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-4 pl-2">Comment ça marche ?</h3>
         
         <FeatureCard 
            icon={QrCode} 
            title="Chasse aux QR Codes" 
            desc="Trouvez les codes cachés sur les stands." 
            color="text-blue-400" 
            bg="bg-blue-500/10"
         />
         <FeatureCard 
            icon={Ticket} 
            title="Validez vos Séances" 
            desc="Obtenez des badges pour chaque film vu." 
            color="text-pink-400" 
            bg="bg-pink-500/10"
         />
         <FeatureCard 
            icon={Sparkles} 
            title="Devenez une Légende" 
            desc="Grimpez les niveaux et gagnez des prix." 
            color="text-yellow-400" 
            bg="bg-yellow-500/10"
         />
      </section>

      {/* 🦶 FOOTER */}
      <footer className="relative z-10 text-center py-8 text-slate-600 text-xs">
         <p>© FICAM 2024 • Fait avec ❤️ par l'équipe digitale</p>
      </footer>

    </div>
  );
}

// 🧱 Component for the feature cards
function FeatureCard({ icon: Icon, title, desc, color, bg }) {
    return (
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm flex items-center gap-4 hover:bg-white/10 transition-colors">
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon size={24} className={color} />
            </div>
            <div>
                <h4 className="font-bold text-white">{title}</h4>
                <p className="text-sm text-slate-400 leading-tight">{desc}</p>
            </div>
        </div>
    )
}