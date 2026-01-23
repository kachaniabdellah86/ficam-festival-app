'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner'; 
import { Home, ScanLine, User, LogOut, CheckCircle2, XCircle, MapPin, Palette, Film, Mic, ChevronRight, ListTodo, Info, Sparkles } from 'lucide-react';

// DATA: Mapping steps to IDs. No XP points, just steps.
const STEPS = {
  'FICAM-WELCOME': { id: 'step1', label: "Bienvenue !", desc: "Scanner l'entrée principale", icon: MapPin, color: "bg-blue-600" },
  'FICAM-WORKSHOP': { id: 'step2', label: "Atelier 3D", desc: "Participer au workshop", icon: Palette, color: "bg-purple-600" },
  'FICAM-MOVIE': { id: 'step3', label: "Le Roi Lion", desc: "Séance de 14h", icon: Film, color: "bg-orange-600" },
  'FICAM-MASTER': { id: 'step4', label: "Masterclass", desc: "Rencontre VIP", icon: Mic, color: "bg-green-600" },
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [selectedStep, setSelectedStep] = useState(null); // Fixes the "Clickable" issue

  // 1. SAFE USER LOADING (Prevents Client-Side Exception)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (!stored) {
        router.push('/login');
      } else {
        setUser(JSON.parse(stored));
      }
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  // 2. HANDLING THE SCAN
  const handleScan = async (result) => {
    if (!result || !result[0]) return;
    const code = result[0].rawValue;
    setIsScanning(false); 

    const step = STEPS[code];
    
    if (!step) {
        setScanResult({ success: false, msg: "Ce QR Code n'est pas valide." });
        return;
    }

    if (user.badges?.includes(step.id)) {
        setScanResult({ success: false, msg: "Déjà validé !" });
        return;
    }

    // Update Local State
    const updatedUser = { ...user, badges: [...(user.badges || []), step.id] };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setScanResult({ success: true, msg: `Étape validée : ${step.label}` });

    // Update Database (Supabase)
    try {
        await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update_progress', email: user.email, badgeId: step.id }),
        });
    } catch (e) { console.error("DB Sync Error", e); }
  };

  if (!user) return <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center text-white">Chargement...</div>;

  // Calculate Progress (Steps count, not XP) 
  const completedCount = user.badges?.length || 0;
  const totalSteps = Object.keys(STEPS).length;
  const progressPercentage = Math.round((completedCount / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-white font-sans pb-24 selection:bg-purple-500/30">
      
      {/* HEADER */}
      <header className="fixed top-0 w-full z-40 bg-[#0F0F1A]/90 backdrop-blur-xl border-b border-white/5 pt-8 pb-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tighter">FICAM <span className="text-purple-500">2026</span></h1>
        <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
                <p className="font-bold text-sm">{user.name}</p>
                <p className="text-xs text-slate-400">{completedCount}/{totalSteps} Étapes</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 p-[1px]">
                <div className="w-full h-full rounded-full bg-[#0F0F1A] flex items-center justify-center">
                    <User size={18} />
                </div>
            </div>
        </div>
      </header>
      
      {/* 3. SCANNER FIX (Centered Modal)  */}
      {isScanning && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md aspect-square relative rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black">
                <Scanner onScan={handleScan} components={{ audio: false, finder: false }} />
                <div className="absolute inset-0 border-[50px] border-black/50 pointer-events-none grid place-items-center">
                    <div className="w-64 h-64 border-2 border-white/30 rounded-2xl relative"></div>
                </div>
                <button onClick={() => setIsScanning(false)} className="absolute top-4 right-4 bg-black/60 p-2 rounded-full text-white z-50"><XCircle size={24} /></button>
            </div>
            <p className="text-white mt-6 font-medium animate-pulse">Visez le QR Code</p>
        </div>
      )}

      {/* RESULT POPUP */}
      {scanResult && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-[#1A1A24] border border-white/10 w-full max-w-sm rounded-3xl p-8 flex flex-col items-center text-center">
                {scanResult.success ? <CheckCircle2 size={40} className="text-green-400 mb-4"/> : <XCircle size={40} className="text-red-400 mb-4"/>}
                <h2 className="text-2xl font-bold mb-2">{scanResult.success ? 'Validé !' : 'Erreur'}</h2>
                <p className="text-slate-400 mb-6">{scanResult.msg}</p>
                <button onClick={() => setScanResult(null)} className="w-full py-3 bg-white text-black font-bold rounded-xl">Continuer</button>
            </div>
        </div>
      )}

      {/* 4. DETAIL POPUP (Makes buttons useful)  */}
      {selectedStep && (
         <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-6" onClick={() => setSelectedStep(null)}>
            <div className="bg-[#1A1A24] w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-8 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
                <div className={`w-14 h-14 ${selectedStep.color} rounded-2xl flex items-center justify-center mb-2`}><selectedStep.icon size={28} /></div>
                <h2 className="text-2xl font-bold">{selectedStep.label}</h2>
                <p className="text-slate-400">{selectedStep.desc}</p>
                <div className="flex gap-3 mt-4">
                    <button onClick={() => setSelectedStep(null)} className="flex-1 py-3 bg-white/5 font-bold rounded-xl">Retour</button>
                    <button onClick={() => { setSelectedStep(null); setIsScanning(true); }} className="flex-1 py-3 bg-purple-600 font-bold rounded-xl">Scanner</button>
                </div>
            </div>
         </div>
      )}

      {/* MAIN CONTENT */}
      <main className="pt-24 px-4 max-w-lg mx-auto space-y-6">
        {/* Progress Card */}
        <div className="bg-gradient-to-br from-indigo-900 to-purple-800 rounded-3xl p-6 relative overflow-hidden border border-white/10">
            <div className="relative z-10">
                <div className="flex justify-between items-end mb-2">
                     <div><p className="text-purple-200 text-sm font-medium">Votre Avancement</p><h2 className="text-4xl font-black">{progressPercentage}%</h2></div>
                     <p className="text-xl font-bold">{completedCount} <span className="text-sm text-purple-300 font-normal">/ {totalSteps}</span></p>
                 </div>
                <div className="w-full bg-black/30 h-3 rounded-full overflow-hidden">
                    <div className="h-full bg-white transition-all duration-1000" style={{ width: `${progressPercentage}%` }}></div>
                </div>
            </div>
        </div>

        {/* Steps List - BUTTONS ARE NOW CLICKABLE */}
        <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ListTodo size={20} className="text-purple-400" /> Étapes du parcours</h3>
            <div className="space-y-3">
                {Object.values(STEPS).map((step) => {
                    const isDone = user.badges?.includes(step.id);
                    return (
                        <button 
                            key={step.id} 
                            onClick={() => setSelectedStep(step)}
                            className={`w-full text-left p-4 rounded-2xl border flex items-center gap-4 transition-transform active:scale-95 ${isDone ? 'bg-green-500/10 border-green-500/20' : 'bg-[#1A1A24] border-white/5'}`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${isDone ? 'bg-green-600' : 'bg-white/5'}`}>
                                {isDone ? <CheckCircle2 size={24} /> : <step.icon size={20} />}
                            </div>
                            <div className="flex-1">
                                <h4 className={`font-bold text-sm ${isDone ? 'text-green-400' : 'text-slate-200'}`}>{step.label}</h4>
                                <p className="text-xs text-slate-500">{step.desc}</p>
                            </div>
                            {isDone ? <CheckCircle2 size={18} className="text-green-600" /> : <ChevronRight size={20} className="text-slate-600" />}
                        </button>
                    );
                })}
            </div>
        </div>
      </main>

      {/* NAV BAR */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-[#1A1A24]/90 backdrop-blur-xl border border-white/10 rounded-full p-2 flex justify-between items-center shadow-2xl z-50">
        <button onClick={() => setActiveTab('home')} className={`w-12 h-12 rounded-full flex items-center justify-center ${activeTab === 'home' ? 'bg-white/10 text-white' : 'text-slate-400'}`}><Home size={20} /></button>
        <button onClick={() => setIsScanning(true)} className="w-14 h-14 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full flex items-center justify-center -mt-8 border-4 border-[#0F0F1A] text-white"><ScanLine size={24} /></button>
        <button onClick={handleLogout} className="w-12 h-12 rounded-full flex items-center justify-center text-slate-400"><LogOut size={20} /></button>
      </nav>
    </div>
  );
}