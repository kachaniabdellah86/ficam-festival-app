'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner'; 
import { Home, ScanLine, User, LogOut, CheckCircle2, XCircle, MapPin, Palette, Film, Mic, ChevronRight, ListTodo, Info, Lock } from 'lucide-react';

// 🗺️ DATA: We now treat these as "Steps" not "Quests"
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
  
  // Scanner States
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  
  // NEW: State for the "Clickable Button" Popup
  const [selectedStep, setSelectedStep] = useState(null);

  // 🔄 Load User
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) router.push('/login');
    else setUser(JSON.parse(stored));
  }, [router]);

  // 🚪 Logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  // 📸 Handle Scan
  const handleScan = async (result) => {
    if (!result || !result[0]) return;
    const code = result[0].rawValue;
    setIsScanning(false); // Stop camera

    const step = STEPS[code];
    
    // 1. Invalid Code
    if (!step) {
        setScanResult({ success: false, msg: "Ce QR Code n'est pas valide." });
        return;
    }

    // 2. Already Done
    if (user.badges?.includes(step.id)) {
        setScanResult({ success: false, msg: "Vous avez déjà validé cette étape !" });
        return;
    }

    // 3. Success
    const updatedUser = { ...user, badges: [...(user.badges || []), step.id] };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setScanResult({ success: true, msg: `Étape validée : ${step.label}` });

    // Sync DB (Silent)
    try {
        await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update_progress', email: user.email, badgeId: step.id }),
        });
    } catch (e) { console.error(e); }
  };

  if (!user) return <div className="min-h-screen bg-[#0F0F1A]" />;

  // 🧮 Calculate Progress (Steps instead of XP)
  const completedCount = user.badges?.length || 0;
  const totalSteps = Object.keys(STEPS).length;
  const progressPercentage = Math.round((completedCount / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-white font-sans pb-24 selection:bg-purple-500/30">
      
      {/* 🌟 HEADER */}
      <header className="fixed top-0 w-full z-40 bg-[#0F0F1A]/90 backdrop-blur-xl border-b border-white/5 pt-12 pb-4 px-6 flex justify-between items-center">
        <div>
            <h1 className="text-xl font-black tracking-tighter">
                FICAM <span className="text-purple-500">2026</span>
            </h1>
        </div>
        <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
                <p className="font-bold text-sm">{user.name}</p>
                <p className="text-xs text-slate-400">{completedCount}/{totalSteps} Étapes</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 p-[1px]">
                <div className="w-full h-full rounded-full bg-[#0F0F1A] flex items-center justify-center">
                    <User size={18} className="text-white" />
                </div>
            </div>
        </div>
      </header>
      
      {/* 🛑 SCANNER OVERLAY (Fixed for PC & Mobile) */}
      {isScanning && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md aspect-square relative rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black">
                <Scanner onScan={handleScan} components={{ audio: false, finder: false }} />
                
                {/* Visual Overlay */}
                <div className="absolute inset-0 border-[50px] border-black/50 pointer-events-none grid place-items-center">
                    <div className="w-64 h-64 border-2 border-white/30 rounded-2xl relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-purple-500 -mt-1 -ml-1 rounded-tl-xl"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-purple-500 -mt-1 -mr-1 rounded-tr-xl"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-purple-500 -mb-1 -ml-1 rounded-bl-xl"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-purple-500 -mb-1 -mr-1 rounded-br-xl"></div>
                    </div>
                </div>

                <button 
                    onClick={() => setIsScanning(false)} 
                    className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-2 rounded-full text-white z-50 hover:bg-white hover:text-black transition-colors">
                    <XCircle size={24} />
                </button>
            </div>
            <p className="text-white mt-6 font-medium animate-pulse">Visez le QR Code de l'étape</p>
        </div>
      )}

      {/* ✅ RESULT POPUP (Success/Error) */}
      {scanResult && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-[#1A1A24] border border-white/10 w-full max-w-sm rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl">
                {scanResult.success ? (
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-400">
                        <CheckCircle2 size={40} />
                    </div>
                ) : (
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 text-red-400">
                        <XCircle size={40} />
                    </div>
                )}
                <h2 className="text-2xl font-bold mb-2">{scanResult.success ? 'Validé !' : 'Oups'}</h2>
                <p className="text-slate-400 mb-8">{scanResult.msg}</p>
                <button 
                    onClick={() => setScanResult(null)}
                    className="w-full py-4 bg-white text-black font-bold rounded-xl active:scale-95 transition-transform"
                >
                    Continuer
                </button>
            </div>
        </div>
      )}

      {/* ℹ️ STEP DETAILS POPUP (The "Clickable" Feature) */}
      {selectedStep && (
         <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-6 animate-in slide-in-from-bottom-10 fade-in">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setSelectedStep(null)}></div>
            
            <div className="bg-[#1A1A24] relative z-10 border-t sm:border border-white/10 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-8 flex flex-col gap-4 shadow-2xl">
                <div className={`w-14 h-14 ${selectedStep.color} rounded-2xl flex items-center justify-center shadow-lg mb-2`}>
                    <selectedStep.icon size={28} className="text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">{selectedStep.label}</h2>
                    <p className="text-slate-400">{selectedStep.desc}</p>
                </div>
                
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 mt-2">
                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2">
                        <Info size={14} /> Instructions
                    </h4>
                    <p className="text-sm text-slate-300">
                        Rendez-vous sur le lieu indiqué. Une fois sur place, scannez le QR Code présenté par le responsable pour valider cette étape.
                    </p>
                </div>

                <div className="flex gap-3 mt-4">
                    <button onClick={() => setSelectedStep(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 font-bold rounded-xl transition-colors">Retour</button>
                    <button 
                        onClick={() => { setSelectedStep(null); setIsScanning(true); }} 
                        className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 font-bold rounded-xl shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
                    >
                        Scanner
                    </button>
                </div>
            </div>
         </div>
      )}

      {/* 📱 MAIN CONTENT */}
      <main className="pt-28 px-4 max-w-lg mx-auto space-y-8">

        {activeTab === 'home' && (
            <>
                {/* 1. Progress Card (Replacing XP) */}
                <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-purple-800 rounded-3xl p-6 shadow-2xl shadow-purple-900/20 relative overflow-hidden border border-white/10">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={120} /></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-end mb-2">
                             <div>
                                <p className="text-purple-200 text-sm font-medium mb-1">Votre Avancement</p>
                                <h2 className="text-4xl font-black">{progressPercentage}%</h2>
                             </div>
                             <div className="text-right">
                                <p className="text-xl font-bold">{completedCount} <span className="text-base text-purple-300 font-normal">/ {totalSteps}</span></p>
                             </div>
                         </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-black/30 h-3 rounded-full overflow-hidden backdrop-blur-md">
                            <div 
                                className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000 ease-out" 
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                        
                        <p className="text-xs text-purple-200 mt-3 flex items-center gap-1 opacity-80">
                            {progressPercentage === 100 ? "🎉 Parcours terminé ! Félicitations !" : "Continuez pour débloquer votre attestation."}
                        </p>
                    </div>
                </div>

                {/* 2. Steps List (Now Clickable Buttons) */}
                <div>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <ListTodo size={20} className="text-purple-400" /> Étapes du parcours
                    </h3>
                    <div className="space-y-3">
                        {Object.values(STEPS).map((step) => {
                            const isDone = user.badges?.includes(step.id);
                            return (
                                <button 
                                    key={step.id} 
                                    onClick={() => setSelectedStep(step)} // 👈 MAKES IT CLICKABLE
                                    className={`w-full text-left p-4 rounded-2xl border flex items-center gap-4 transition-all active:scale-95 group ${isDone ? 'bg-green-500/5 border-green-500/20' : 'bg-[#1A1A24] border-white/5 hover:border-white/20'}`}
                                >
                                    {/* Icon Box */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-colors ${isDone ? 'bg-green-600' : 'bg-white/5 group-hover:bg-white/10'}`}>
                                        {isDone ? <CheckCircle2 size={24} /> : <step.icon size={20} />}
                                    </div>
                                    
                                    {/* Text */}
                                    <div className="flex-1">
                                        <h4 className={`font-bold text-sm ${isDone ? 'text-green-400' : 'text-slate-200'}`}>{step.label}</h4>
                                        <p className="text-xs text-slate-500 line-clamp-1">{step.desc}</p>
                                    </div>
                                    
                                    {/* Arrow or Lock */}
                                    {isDone ? (
                                        <div className="text-green-600 opacity-0 group-hover:opacity-100 transition-opacity"><CheckCircle2 size={18} /></div>
                                    ) : (
                                        <ChevronRight size={20} className="text-slate-600 group-hover:text-white transition-colors" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </>
        )}

      </main>

      {/* 📱 BOTTOM NAVIGATION */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-[#1A1A24]/80 backdrop-blur-xl border border-white/10 rounded-full p-2 flex justify-between items-center shadow-2xl z-50">
        
        <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={Home} />
        
        {/* CENTER SCAN BUTTON */}
        <button 
            onClick={() => setIsScanning(true)}
            className="w-14 h-14 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/40 text-white -mt-8 border-4 border-black transition-transform active:scale-95 hover:scale-105"
        >
            <ScanLine size={24} />
        </button>

        <NavButton onClick={handleLogout} icon={LogOut} />

      </nav>
    </div>
  );
}

// ✨ Helper Component
function NavButton({ active, onClick, icon: Icon }) {
    return (
        <button onClick={onClick} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${active ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white'}`}>
            <Icon size={20} />
        </button>
    )
}